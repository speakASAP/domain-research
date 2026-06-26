const state = { candidates: [] };

const healthStatus = document.getElementById('healthStatus');
const candidateList = document.getElementById('candidateList');
const watchList = document.getElementById('watchList');

async function api(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: { 'content-type': 'application/json', ...(options.headers || {}) },
  });
  if (!response.ok) throw new Error(`${response.status} ${await response.text()}`);
  return response.json();
}

async function checkHealth() {
  try {
    const response = await fetch('/health');
    healthStatus.textContent = response.ok ? 'healthy' : 'degraded';
  } catch {
    healthStatus.textContent = 'offline';
  }
}

function renderCandidates() {
  candidateList.innerHTML = state.candidates.map((candidate) => `
    <label class="candidate">
      <input type="checkbox" value="${escapeHtml(candidate.fqdn)}" checked />
      <span>
        <span class="domain">${escapeHtml(candidate.fqdn)}</span>
        <span class="meta">score ${Math.round(candidate.score || 0)} · ${escapeHtml(candidate.source || 'heuristic')}</span>
      </span>
      <span class="badge ${candidate.availability === 'registered' ? 'warning' : ''}">${escapeHtml(candidate.availability || 'unchecked')}</span>
    </label>
  `).join('');
}

document.getElementById('suggestionForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  candidateList.innerHTML = '<p class="meta">Generating candidates...</p>';
  const payload = {
    description: document.getElementById('description').value,
    tlds: document.getElementById('tlds').value.split(',').map((item) => item.trim()).filter(Boolean),
    count: Number(document.getElementById('count').value || 12),
  };
  const job = await api('/domain-suggestions', { method: 'POST', body: JSON.stringify(payload) });
  state.candidates = job.candidates || [];
  renderCandidates();
});

document.getElementById('checkSelected').addEventListener('click', async () => {
  const domains = Array.from(candidateList.querySelectorAll('input:checked')).map((input) => input.value);
  if (!domains.length) return;
  const result = await api('/availability/check', { method: 'POST', body: JSON.stringify({ domains }) });
  const byDomain = new Map((result.results || []).map((item) => [item.fqdn, item]));
  state.candidates = state.candidates.map((candidate) => ({ ...candidate, ...(byDomain.get(candidate.fqdn) || {}) }));
  renderCandidates();
});

document.getElementById('watchForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  await api('/watches', {
    method: 'POST',
    body: JSON.stringify({
      fqdn: document.getElementById('watchDomain').value,
      notificationEmail: document.getElementById('watchEmail').value || undefined,
    }),
  });
  await loadWatches();
});

async function loadWatches() {
  const watches = await api('/watches');
  watchList.innerHTML = watches.map((watch) => `
    <div class="watch">
      <span></span>
      <span>
        <span class="domain">${escapeHtml(watch.fqdn)}</span>
        <span class="meta">next check ${escapeHtml(formatDate(watch.nextCheckAt))}</span>
      </span>
      <span class="badge ${watch.lastAvailability === 'registered' ? 'warning' : ''}">${escapeHtml(watch.lastAvailability)}</span>
    </div>
  `).join('') || '<p class="meta">No watched domains yet.</p>';
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : 'not scheduled';
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }[char]));
}

checkHealth();
loadWatches().catch(() => undefined);
