const { invoke } = window.__TAURI__.core;
const { listen } = window.__TAURI__.event;

// Store downloaded clients state
const downloadedClients = new Map();

// DOM Elements
const clientsGrid = document.getElementById('clients-grid');
const errorMessage = document.getElementById('error-message');

// Show error message
function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.remove('hidden');
}

// Hide error message
function hideError() {
  errorMessage.classList.add('hidden');
}

// Create client card element
function createClientCard(client) {
  const card = document.createElement('div');
  card.className = 'client-card';
  card.id = `client-${client.id}`;
  
  const isDownloaded = downloadedClients.has(client.id);
  
  card.innerHTML = `
    <h2>${escapeHtml(client.name)}</h2>
    <p class="version">${escapeHtml(client.version)}</p>
    <p class="description">${escapeHtml(client.description)}</p>
    <span class="file-type">${escapeHtml(client.file_type.toUpperCase())}</span>
    
    <button class="btn btn-download" id="download-${client.id}" ${isDownloaded ? 'disabled' : ''}>
      ${isDownloaded ? 'Скачано' : 'Скачать'}
    </button>
    
    <div class="progress-container" id="progress-container-${client.id}">
      <div class="progress-bar" id="progress-bar-${client.id}"></div>
      <p class="progress-text" id="progress-text-${client.id}">0%</p>
    </div>
    
    <button class="btn btn-launch" id="launch-${client.id}" ${!isDownloaded ? 'disabled' : ''}>
      Запустить
    </button>
  `;
  
  // Download button handler
  const downloadBtn = card.querySelector(`#download-${client.id}`);
  downloadBtn.addEventListener('click', () => handleDownload(client));
  
  // Launch button handler
  const launchBtn = card.querySelector(`#launch-${client.id}`);
  launchBtn.addEventListener('click', () => handleLaunch(client));
  
  return card;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Handle download
async function handleDownload(client) {
  const downloadBtn = document.getElementById(`download-${client.id}`);
  const progressContainer = document.getElementById(`progress-container-${client.id}`);
  const progressBar = document.getElementById(`progress-bar-${client.id}`);
  const progressText = document.getElementById(`progress-text-${client.id}`);
  
  downloadBtn.disabled = true;
  downloadBtn.textContent = 'Загрузка...';
  progressContainer.classList.add('visible');
  
  try {
    // Extract filename from URL
    const urlParts = client.download_url.split('/');
    const filename = urlParts[urlParts.length - 1] || `${client.id}.${client.file_type}`;
    
    const filePath = await invoke('download_client', {
      url: client.download_url.trim(),
      filename: filename.trim()
    });
    
    downloadedClients.set(client.id, filePath);
    
    downloadBtn.textContent = 'Скачано';
    progressBar.style.width = '100%';
    progressText.textContent = '100%';
    
    // Enable launch button
    const launchBtn = document.getElementById(`launch-${client.id}`);
    launchBtn.disabled = false;
    
    setTimeout(() => {
      progressContainer.classList.remove('visible');
    }, 1000);
    
  } catch (error) {
    console.error('Download error:', error);
    downloadBtn.disabled = false;
    downloadBtn.textContent = 'Скачать';
    progressContainer.classList.remove('visible');
    showError(`Ошибка загрузки: ${error}`);
  }
}

// Handle launch
async function handleLaunch(client) {
  const filePath = downloadedClients.get(client.id);
  
  if (!filePath) {
    showError('Файл не скачан');
    return;
  }
  
  try {
    const result = await invoke('launch_client', { filePath });
    console.log(result);
  } catch (error) {
    console.error('Launch error:', error);
    showError(`Ошибка запуска: ${error}`);
  }
}

// Listen for download progress events
listen('download_progress', (event) => {
  // Find the currently downloading client card
  const progressBars = document.querySelectorAll('.progress-bar');
  const progressTexts = document.querySelectorAll('.progress-text');
  
  // Update the last visible progress bar
  progressBars.forEach((bar, index) => {
    if (bar.parentElement.classList.contains('visible')) {
      bar.style.width = `${event.payload}%`;
      if (progressTexts[index]) {
        progressTexts[index].textContent = `${Math.round(event.payload)}%`;
      }
    }
  });
});

// Fetch and display clients
async function loadClients() {
  clientsGrid.innerHTML = '<p class="loading">Загрузка списка клиентов...</p>';
  hideError();
  
  try {
    const clients = await invoke('fetch_clients');
    
    if (clients.length === 0) {
      clientsGrid.innerHTML = '<p class="loading">Нет доступных клиентов</p>';
      return;
    }
    
    clientsGrid.innerHTML = '';
    clients.forEach(client => {
      const card = createClientCard(client);
      clientsGrid.appendChild(card);
    });
    
  } catch (error) {
    console.error('Fetch error:', error);
    clientsGrid.innerHTML = '';
    showError(`Ошибка подключения к серверу: ${error}`);
  }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  loadClients();
});
