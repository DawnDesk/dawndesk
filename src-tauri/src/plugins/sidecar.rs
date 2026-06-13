use crate::{
    plugins::manifest::read_manifest,
    settings::config::{user_data_root, AppConfig},
};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::{
    io::Write,
    path::{Path, PathBuf},
    process::{Command, Stdio},
};

#[derive(Debug, Default)]
pub struct SidecarManager;

#[derive(Debug, Deserialize)]
pub struct SidecarToolResult {
    pub id: String,
    pub output: Value,
    pub error: Option<String>,
}

#[derive(Debug, Serialize)]
struct SidecarToolCall<'a> {
    id: &'a str,
    tool: &'a str,
    input: Value,
}

impl SidecarManager {
    pub fn new() -> Self {
        Self
    }

    pub fn start_for_plugin(&self, plugin_id: &str) -> Result<(), String> {
        println!("Sidecar start requested for plugin '{plugin_id}'.");
        Ok(())
    }

    pub fn stop_for_plugin(&self, plugin_id: &str) -> Result<(), String> {
        println!("Sidecar stop requested for plugin '{plugin_id}'.");
        Ok(())
    }

    pub fn run_tool(
        &self,
        config: &AppConfig,
        plugin_id: &str,
        tool: &str,
        input: Value,
    ) -> Result<Value, String> {
        let plugin_dir = user_data_root(config).join("plugins").join(plugin_id);
        let manifest = read_manifest(&plugin_dir.join("plugin.manifest.json"))?;
        let Some(sidecar) = manifest.sidecar else {
            return Err(format!("Plugin '{plugin_id}' does not define a sidecar."));
        };
        let sidecar_path = resolve_sidecar_binary(&plugin_dir, &sidecar.binary)
            .ok_or_else(|| format!("Sidecar binary '{}' was not found.", sidecar.binary))?;
        let call_id = format!("{plugin_id}-{tool}");
        let payload = serde_json::to_string(&SidecarToolCall {
            id: &call_id,
            tool,
            input,
        })
        .map_err(|error| format!("Failed to serialize tool call: {error}"))?;

        let mut child = Command::new(&sidecar_path)
            .env("DAWNDESK_PLUGIN_ID", plugin_id)
            .env("DAWNDESK_PLUGIN_DATA_DIR", plugin_dir.to_string_lossy().to_string())
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|error| format!("Failed to start sidecar '{}': {error}", sidecar_path.display()))?;

        if let Some(stdin) = child.stdin.as_mut() {
            writeln!(stdin, "{payload}")
                .map_err(|error| format!("Failed to write sidecar input: {error}"))?;
        }
        drop(child.stdin.take());

        let output = child
            .wait_with_output()
            .map_err(|error| format!("Failed to read sidecar output: {error}"))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
            return Err(if stderr.is_empty() {
                format!("Sidecar exited with status {}.", output.status)
            } else {
                stderr
            });
        }

        let stdout = String::from_utf8_lossy(&output.stdout);
        let response_line = stdout
            .lines()
            .find(|line| !line.trim().is_empty())
            .ok_or_else(|| "Sidecar returned no response.".to_string())?;
        let result: SidecarToolResult = serde_json::from_str(response_line)
            .map_err(|error| format!("Invalid sidecar response: {error}"))?;

        if let Some(error) = result.error {
            Err(error)
        } else {
            Ok(json!({
                "id": result.id,
                "output": result.output,
            }))
        }
    }
}

fn resolve_sidecar_binary(plugin_dir: &Path, binary: &str) -> Option<PathBuf> {
    let executable = if cfg!(windows) && !binary.ends_with(".exe") {
        format!("{binary}.exe")
    } else {
        binary.to_string()
    };
    let candidates = [
        plugin_dir.join(&executable),
        plugin_dir.join("bin").join(&executable),
        plugin_dir.join("sidecars").join(&executable),
        plugin_dir.join("src-tauri").join("target").join("release").join(&executable),
        plugin_dir.join("src-tauri").join("target").join("debug").join(&executable),
    ];

    candidates.into_iter().find(|path| path.exists())
}
