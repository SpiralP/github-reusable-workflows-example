import { spawn } from "node:child_process";
import { PassThrough } from "node:stream";

const matchers = [
  // warning: statement with no effect
  //   --> src/main.rs:20:5
  // warning: `github-reusable-workflows-example-rust` (bin "github-reusable-workflows-example-rust") generated 1 warning
  /^(?<severity>warning|error)(:?\[\S+\])?: (?<message>[^\n]+)\n  --> (?<file>\S+):(?<line>\d+):(?<col>\d+)$/gm,
  /^(?<severity>warning|error): (?<message>[^\n]+)\n(?!  --> )$/gm,

  // src/main.rs:16:9: warning: unused variable: `unused_var`: help: if this is intentional, prefix it with an underscore: `_unused_var`
  // src/main.rs:14:13: error: expected expression, found `;`: expected expression
  // src/main.rs:14:5: error[E0618]: expected function, found `String`
  /^(?<file>\S+):(?<line>\d+):(?<col>\d+): (?<severity>warning|error)(:?\[\S+\])?: (?<message>[^\n]+)$/gm,

  // thread 'test_ci_annotations' panicked at src/main.rs:28:5:\nhehe
  /^.*panicked at (?<file>\S+):(?<line>\d+):(?<col>\d+):\n(?<message>.+)$/gm,
  /^(?<message>.*panicked) at (?<file>\S+):(?<line>\d+):(?<col>\d+)(?!:)$/gm,
];

const previousAnnotations = new Set();

function processAnnotations(output: string) {
  matchers
    .flatMap((regex) => [...output.matchAll(regex)])
    .forEach((match) => {
      const { groups } = match;
      if (!groups || !groups.message) {
        return;
      }

      const { message } = groups;

      let severity = match[0].includes("panicked") ? "error" : "warning";
      if (groups.severity) {
        severity = groups.severity.toLowerCase();
        if (severity === "warn") {
          severity = "warning";
        } else if (severity === "error") {
          severity = "error";
        }
      }

      if (!groups.file && message.startsWith("unused manifest key: ")) {
        groups.file = "Cargo.toml";
      }

      if (groups.file && !groups.line && !groups.col) {
        groups.line = "1";
        groups.col = "1";
      }

      let annotation = `::${severity}::${message}`;
      if (groups.file && groups.line && groups.col) {
        const { file, line, col } = groups;
        annotation = `::${severity} file=${file},line=${line},col=${col}::${message}`;
      }
      if (!previousAnnotations.has(annotation)) {
        previousAnnotations.add(annotation);
        console.error("\n" + annotation);
      }
    });
}

function main(args: string[]) {
  if (!args[0]) {
    console.error("No command provided to execute.");
    process.exit(1);
  }

  const child = spawn(args[0], args.slice(1), {
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.on("error", (err) => {
    console.error(`Error executing command: ${err.message}`);
    process.exit(1);
  });

  const output = new PassThrough();
  child.stdout.pipe(output);
  child.stderr.pipe(output);

  output.pipe(process.stdout);

  let stdout = "";
  output.on("data", (data: Buffer) => {
    stdout += data.toString();
    processAnnotations(stdout);
  });

  output.on("end", () => {
    processAnnotations(stdout + "\n\n");
  });

  child.on("close", (code) => {
    console.error(`Command exited with code ${code}`);
    process.exit(code);
  });
}

main(process.argv.slice(2));
