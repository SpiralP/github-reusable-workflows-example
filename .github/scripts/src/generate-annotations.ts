import { spawn } from "node:child_process";
import { PassThrough } from "node:stream";

const previousAnnotations = new Set();

function processAnnotations(output: string) {
  const matchers = [
    /^(?<severity>warning|error): (?<message>[^\n]+)\n  --> (?<file>.+):(?<line>\d+):(?<col>\d+)$/gm,
    /^(?<severity>warning|error): (?<message>[^\n]+)\n(?!  --> )$/gm,
  ];

  matchers
    .flatMap((regex) => [...output.matchAll(regex)])
    .map((match) => match.groups)
    .forEach((group) => {
      if (!group || !group.message) {
        return;
      }

      const { message } = group;

      let severity = "warning";
      if (group.severity) {
        severity = group.severity.toLowerCase();
        if (severity === "warn") {
          severity = "warning";
        } else if (severity === "error") {
          severity = "error";
        }
      }

      if (!group.file && message.startsWith("unused manifest key: ")) {
        group.file = "Cargo.toml";
      }

      if (group.file && !group.line && !group.col) {
        group.line = "1";
        group.col = "1";
      }

      let annotation = `::${severity}::${message}`;
      if (group.file && group.line && group.col) {
        const { file, line, col } = group;
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
