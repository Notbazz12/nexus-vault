fn main() {
    // tauri-build requires the tauri dependency, which only exists with the `app` feature.
    if std::env::var_os("CARGO_FEATURE_APP").is_some() {
        tauri_build::build()
    }
}
