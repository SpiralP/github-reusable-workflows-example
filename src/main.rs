#[tokio::main]
async fn main() {
    println!("Hello, world!");

    let body = reqwest::get("https://www.github.com/")
        .await
        .unwrap()
        .text()
        .await
        .unwrap();

    println!("{body}");

    // warning: unused variable: `unused_var`
    //   --> src/main.rs:16:9
    let unused_var = "unused";

    // warning: statement with no effect
    //   --> src/main.rs:20:5
    ();
    // warning: `github-reusable-workflows-example-rust` (bin "github-reusable-workflows-example-rust") generated 1 warning
}

#[test]
fn test_ci_annotations() {
    println!();
    println!("error[E0618]: expected function, found `&'static str`");
    println!("  --> src/main.rs:16:22");
    println!();
    println!("src/main.rs:14:5: error[E0618]: expected function, found `String`");
    println!();
    println!("thread 'test_ci_annotations' panicked at src/main.rs:28:5");
    println!();
    println!("thread 'test_ci_annotations' panicked at src/main.rs:28:5:\nhehe");
    println!();
}
