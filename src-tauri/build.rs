fn main() {
    println!("cargo:rustc-link-lib=comctl32");
    println!("cargo:rustc-link-lib=shell32");
    println!("cargo:rustc-link-lib=ole32");
    println!("cargo:rustc-link-lib=uuid");
    println!("cargo:rustc-link-lib=gdi32");

    // When running with MinGW GNU toolchain and workspace paths containing spaces,
    // windres has an unquoted include path bug in cc1.exe when invoked through tauri_build.
    #[cfg(all(windows, target_env = "gnu"))]
    {
        if std::env::var("CARGO_MANIFEST_DIR").map(|d| d.contains(' ')).unwrap_or(false) {
            println!("cargo:rustc-check-cfg=cfg(desktop)");
            println!("cargo:rustc-cfg=desktop");
            println!("cargo:rustc-check-cfg=cfg(dev)");
            println!("cargo:rustc-cfg=dev");

            // Compile manifest directly with windres to embed Common Controls v6 into the binary
            if let Ok(out_dir) = std::env::var("OUT_DIR") {
                let out_path = std::path::Path::new(&out_dir);
                let manifest_path = out_path.join("app.manifest");
                let rc_path = out_path.join("app.rc");
                let res_path = out_path.join("app.o");

                let manifest_xml = r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<assembly xmlns="urn:schemas-microsoft-com:asm.v1" manifestVersion="1.0">
  <assemblyIdentity version="1.1.0.0" processorArchitecture="*" name="Omar.MizanERP" type="win32"/>
  <description>Mizan ERP</description>
  <dependency>
    <dependentAssembly>
      <assemblyIdentity type="win32" name="Microsoft.Windows.Common-Controls" version="6.0.0.0" processorArchitecture="*" publicKeyToken="6595b64144ccf1df" language="*"/>
    </dependentAssembly>
  </dependency>
  <compatibility xmlns="urn:schemas-microsoft-com:compatibility.v1">
    <application>
      <supportedOS Id="{8e0f7a12-bfb3-4fe8-b9a5-48fd50a15a9a}"/>
      <supportedOS Id="{1f676c76-80e1-4239-95bb-83d0f6d0da78}"/>
      <supportedOS Id="{4a2f28e3-53b9-4441-ba9c-d69d4a4a6e38}"/>
      <supportedOS Id="{35138b9a-5d96-4fbd-8e2d-a2440225f93a}"/>
    </application>
  </compatibility>
</assembly>"#;

                let rc_content = format!(
                    "#define RT_MANIFEST 24\n1 RT_MANIFEST \"{}\"\n",
                    manifest_path.to_string_lossy().replace('\\', "/")
                );

                if std::fs::write(&manifest_path, manifest_xml).is_ok()
                    && std::fs::write(&rc_path, &rc_content).is_ok()
                {
                    let status = std::process::Command::new("windres")
                        .arg(&rc_path)
                        .arg("-O")
                        .arg("coff")
                        .arg("-o")
                        .arg(&res_path)
                        .status();

                    if let Ok(s) = status {
                        if s.success() {
                            println!("cargo:rustc-link-arg={}", res_path.to_string_lossy());
                        }
                    }
                }
            }

            return;
        }
    }

    tauri_build::build();
}

