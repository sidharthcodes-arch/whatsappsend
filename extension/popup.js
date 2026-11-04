let scrapedLeads = [];
let isScraping = false;

const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const statusCard = document.getElementById('statusCard');
const statusText = document.getElementById('statusText');
const progressFill = document.getElementById('progressFill');
const previewContainer = document.getElementById('previewContainer');
const previewList = document.getElementById('previewList');
const leadsCount = document.getElementById('leadsCount');
const completionActions = document.getElementById('completionActions');
const downloadBtn = document.getElementById('downloadBtn');
const dashboardBtn = document.getElementById('dashboardBtn');

// Helper to get active tab
async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

startBtn.addEventListener('click', async () => {
  const tab = await getActiveTab();
  if (!tab || !tab.url || !tab.url.includes('google.com/maps')) {
    alert('Please open Google Maps and perform a search (e.g., "cafes in indiranagar") first!');
    return;
  }

  isScraping = true;
  scrapedLeads = [];
  previewList.innerHTML = '';
  leadsCount.textContent = '0';

  startBtn.style.display = 'none';
  stopBtn.style.display = 'flex';
  statusCard.style.display = 'block';
  previewContainer.style.display = 'block';
  completionActions.style.display = 'none';
  statusText.textContent = 'Scanning Google Maps search cards...';
  progressFill.style.width = '0%';

  // Inject content scraper
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['content.js']
  });
});

stopBtn.addEventListener('click', async () => {
  const tab = await getActiveTab();
  if (tab) {
    chrome.tabs.sendMessage(tab.id, { action: 'STOP_SCRAPING' });
  }
  finishScraping();
});

function finishScraping() {
  isScraping = false;
  startBtn.style.display = 'flex';
  startBtn.innerHTML = '<span>🔄 Scrape Again</span>';
  stopBtn.style.display = 'none';
  statusText.textContent = `Completed! ${scrapedLeads.length} leads with phones collected.`;
  progressFill.style.width = '100%';
  if (scrapedLeads.length > 0) {
    completionActions.style.display = 'flex';
  }
}

// Receive messages from content.js
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'SCRAPER_PROGRESS') {
    const { current, total, lead } = msg;
    const pct = Math.round((current / total) * 100);
    progressFill.style.width = `${pct}%`;
    statusText.textContent = `Checking ${current} of ${total} places...`;

    if (lead) {
      scrapedLeads.push(lead);
      leadsCount.textContent = scrapedLeads.length;

      const item = document.createElement('div');
      item.className = 'preview-item';
      item.innerHTML = `
        <span class="lead-name" title="${lead.name}">${lead.name}</span>
        <span class="lead-phone">${lead.phone}</span>
      `;
      previewList.appendChild(item);
      previewList.scrollTop = previewList.scrollHeight;
    }
  } else if (msg.type === 'SCRAPER_FINISHED') {
    finishScraping();
  } else if (msg.type === 'SCRAPER_ERROR') {
    alert(msg.message || 'Scraping error occurred.');
    finishScraping();
  }
});

downloadBtn.addEventListener('click', () => {
  if (scrapedLeads.length === 0) return;

  const rows = [['Title', 'Phone']];
  scrapedLeads.forEach((l) => {
    rows.push([`"${l.name.replace(/"/g, '""')}"`, `"${l.phone}"`]);
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', 'google_maps_leads.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

dashboardBtn.addEventListener('click', () => {
  // Save scraped leads to localStorage for the outreach dashboard if accessed
  alert('CSV downloaded! Open your index.html dashboard and drop the CSV in to start your WhatsApp outreach.');
});

