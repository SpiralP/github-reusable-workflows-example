const fs = require("node:fs");

const OUTPUT_LOG_FILE = process.argv[2];
if (!OUTPUT_LOG_FILE) {
  console.error("!OUTPUT_LOG_FILE");
  process.exit(1);
}

const output = fs.readFileSync(OUTPUT_LOG_FILE, "utf8");

const matchers = [
  /^(?<severity>warning|error): (?<message>[^\n]+)\n  --> (?<file>.+):(?<line>\d+):(?<col>\d+)$/gm,
  /^(?<severity>warning|error): (?<message>[^\n]+)(?!\n  --> )$/gm,
];

const annotations = new Set(
  matchers
    .flatMap((regex) => [...output.matchAll(regex)])
    .map((match) => match.groups)
    .map((group) => {
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
        group.line = 1;
        group.col = 1;
      }

      if (group.file && group.line && group.col) {
        const { file, line, col } = group;
        return `::${severity} file=${file},line=${line},col=${col}::${message}`;
      } else {
        return `::${severity}::${message}`;
      }
    })
);

annotations.forEach((annotation) => {
  console.log(annotation);
});
