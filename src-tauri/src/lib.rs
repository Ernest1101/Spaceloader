use serde::{Deserialize, Serialize};
use std::process::Command;
use tauri::{AppHandle, Emitter};
use tokio::fs;
use tokio::io::AsyncWriteExt;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Client {
    pub id: String,
    pub name: String,
    pub version: String,
    pub description: String,
    pub file_type: String,
    pub download_url: String,
}

#[tauri::command]
async fn fetch_clients() -> Result<Vec<Client>, String> {
    let client = reqwest::Client::new();
    let response = client
        .get("https://spaceloader.mooo.com/api/clients")
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    let clients: Vec<Client> = response
        .json()
        .await
        .map_err(|e| format!("JSON parse error: {}", e))?;

    Ok(clients)
}

#[tauri::command]
async fn download_client(
    url: String,
    filename: String,
    app: AppHandle,
) -> Result<String, String> {
    // Create temp directory
    let temp_dir = std::env::temp_dir().join("Spaceloader");
    fs::create_dir_all(&temp_dir)
        .await
        .map_err(|e| format!("Failed to create temp dir: {}", e))?;

    let file_path = temp_dir.join(&filename);

    // Download file
    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Download failed: {}", e))?;

    let total_size = response.content_length().unwrap_or(0) as f64;
    let mut downloaded: u64 = 0;
    let mut stream = response.bytes_stream();

    let mut file = fs::File::create(&file_path)
        .await
        .map_err(|e| format!("Failed to create file: {}", e))?;

    use futures_util::StreamExt;
    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| format!("Chunk error: {}", e))?;
        file.write_all(&chunk)
            .await
            .map_err(|e| format!("Write error: {}", e))?;
        downloaded += chunk.len() as u64;

        if total_size > 0.0 {
            let progress = (downloaded as f64 / total_size) * 100.0;
            app.emit("download_progress", progress)
                .map_err(|e| format!("Emit error: {}", e))?;
        }
    }

    file.flush()
        .await
        .map_err(|e| format!("Flush error: {}", e))?;

    Ok(file_path.to_string_lossy().to_string())
}

#[tauri::command]
fn launch_client(file_path: String) -> Result<String, String> {
    Command::new("java")
        .arg("-jar")
        .arg(&file_path)
        .spawn()
        .map_err(|e| format!("Failed to launch: {}", e))?;

    Ok(format!("Launched: {}", file_path))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            fetch_clients,
            download_client,
            launch_client
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
