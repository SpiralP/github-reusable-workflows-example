import { expect, test } from "bun:test";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

test("works", async () => {
  const { stdout, stderr } = await execAsync(
    "node ./dist/generate-annotations.js cargo clippy"
  );
  expect(stdout.replace(/(target\(s\) in )(\d+\.\d+.)/, "$1<removed>"))
    .toMatchInlineSnapshot(`
    "warning: unused manifest key: unused-group
    warning: unused variable: \`unused_var\`
      --> src/main.rs:16:9
       |
    16 |     let unused_var = "unused";
       |         ^^^^^^^^^^ help: if this is intentional, prefix it with an underscore: \`_unused_var\`
       |
       = note: \`#[warn(unused_variables)]\` on by default

    warning: statement with no effect
      --> src/main.rs:20:5
       |
    20 |     ();
       |     ^^^
       |
       = help: for further information visit https://rust-lang.github.io/rust-clippy/master/index.html#no_effect
       = note: \`#[warn(clippy::no_effect)]\` on by default

    warning: \`github-reusable-workflows-example-rust\` (bin "github-reusable-workflows-example-rust") generated 2 warnings
        Finished \`dev\` profile [unoptimized + debuginfo] target(s) in <removed>
    "
  `);
  expect(stderr).toMatchInlineSnapshot(`
    "
    ::warning file=Cargo.toml,line=1,col=1::unused manifest key: unused-group

    ::warning file=src/main.rs,line=16,col=9::unused variable: \`unused_var\`

    ::warning file=src/main.rs,line=20,col=5::statement with no effect
    Command exited with code 0
    "
  `);
});
