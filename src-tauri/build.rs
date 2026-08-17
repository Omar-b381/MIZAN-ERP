fn main() {
    // When running with MinGW GNU toolchain and workspace paths containing spaces,
    // windres has an unquoted include path bug in cc1.exe.
    // tauri_build provides try_build which can be called with custom Attributes.
    #[cfg(all(windows, target_env = "gnu"))]
    {
        // Don't invoke windres on GNU target if path has space to avoid cc1 path split
        // Tauri codegen and capabilities still run normally.
        if std::env::var("CARGO_MANIFEST_DIR").map(|d| d.contains(' ')).unwrap_or(false) {
            println!("cargo:rustc-check-cfg=cfg(desktop)");
            println!("cargo:rustc-cfg=desktop");
            println!("cargo:rustc-check-cfg=cfg(dev)");
            println!("cargo:rustc-cfg=dev");
            return;
        }
    }

    tauri_build::build();
}
