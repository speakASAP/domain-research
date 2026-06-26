const state = {
  candidates: [],
  selectedDomains: {},
  watchDomains: [],
  voice: {
    active: false,
    baseText: '',
    finalText: '',
    recognition: null,
    shouldRestart: false,
  },
};

const STORAGE_ACCESS = 'domain_research_access';
const STORAGE_REFRESH = 'domain_research_refresh';
const STORAGE_EMAIL = 'domain_research_email';
const STORAGE_STATE = 'domain_research_auth_state';
const STORAGE_DRAFT = 'domain_research_session_draft';
const DRAFT_VERSION = 1;
const MAX_DRAFT_CANDIDATES = 100;
const DRAFT_TTL_MS = 24 * 60 * 60 * 1000;
const LEGACY_ACCESS_KEYS = ['auth_profile_access', 'auth_admin_access'];

const healthStatus = document.getElementById('healthStatus');
const candidateList = document.getElementById('candidateList');
const watchList = document.getElementById('watchList');
const descriptionInput = document.getElementById('description');
const tldsInput = document.getElementById('tlds');
const countInput = document.getElementById('count');
const voiceButton = document.getElementById('voiceDescription');
const voiceButtonText = document.getElementById('voiceButtonText');
const voiceStatus = document.getElementById('voiceStatus');
const authButton = document.getElementById('authButton');
const authStatus = document.getElementById('authStatus');
const watchForm = document.getElementById('watchForm');
const watchDomainInput = document.getElementById('watchDomain');
const watchDomainChips = document.getElementById('watchDomainChips');

function getAccessToken() {
  return sessionStorage.getItem(STORAGE_ACCESS) || LEGACY_ACCESS_KEYS.map((key) => sessionStorage.getItem(key)).find(Boolean) || '';
}

function setTokens(accessToken, refreshToken, email) {
  if (accessToken) sessionStorage.setItem(STORAGE_ACCESS, accessToken);
  if (refreshToken) sessionStorage.setItem(STORAGE_REFRESH, refreshToken);
  if (email) sessionStorage.setItem(STORAGE_EMAIL, email);
}

function saveSessionDraft() {
  try {
    state.selectedDomains = currentCandidateSelections();
    const draft = JSON.stringify({
      version: DRAFT_VERSION,
      savedAt: new Date().toISOString(),
      description: descriptionInput?.value || '',
      tlds: tldsInput?.value || '',
      count: countInput?.value || '',
      candidates: state.candidates.slice(0, MAX_DRAFT_CANDIDATES),
      selectedDomains: state.selectedDomains,
      watchDomains: state.watchDomains,
      watchDomainInput: watchDomainInput?.value || '',
    });
    return writeDraftStorage(draft);
  } catch {
    return false;
  }
}

function currentCandidateSelections() {
  const selectedDomains = { ...state.selectedDomains };
  candidateList.querySelectorAll('input[type="checkbox"]').forEach((input) => {
    selectedDomains[input.value] = input.checked;
  });
  return selectedDomains;
}

function writeDraftStorage(value) {
  let saved = false;
  try {
    localStorage.setItem(STORAGE_DRAFT, value);
    saved = true;
  } catch {
    // Browser storage may be unavailable in private or locked-down contexts.
  }
  try {
    sessionStorage.setItem(STORAGE_DRAFT, value);
    saved = true;
  } catch {
    // sessionStorage is only a fallback for same-tab redirects.
  }
  return saved;
}

function readDraftStorage() {
  try {
    return localStorage.getItem(STORAGE_DRAFT) || sessionStorage.getItem(STORAGE_DRAFT) || '';
  } catch {
    try {
      return sessionStorage.getItem(STORAGE_DRAFT) || '';
    } catch {
      return '';
    }
  }
}

function clearDraftStorage() {
  try {
    localStorage.removeItem(STORAGE_DRAFT);
  } catch {
    // ignore unavailable storage
  }
  try {
    sessionStorage.removeItem(STORAGE_DRAFT);
  } catch {
    // ignore unavailable storage
  }
}

function restoreSessionDraft() {
  let draft = null;
  try {
    draft = JSON.parse(readDraftStorage() || 'null');
  } catch {
    return;
  }
  if (!draft || draft.version !== DRAFT_VERSION) return;
  if (draft.savedAt && Date.now() - Date.parse(draft.savedAt) > DRAFT_TTL_MS) {
    clearDraftStorage();
    return;
  }

  if (descriptionInput) descriptionInput.value = draft.description || '';
  if (tldsInput && draft.tlds) tldsInput.value = draft.tlds;
  if (countInput && draft.count) countInput.value = draft.count;
  if (watchDomainInput) watchDomainInput.value = draft.watchDomainInput || '';
  state.candidates = Array.isArray(draft.candidates) ? draft.candidates : [];
  state.selectedDomains = isPlainObject(draft.selectedDomains) ? draft.selectedDomains : {};
  state.watchDomains = Array.isArray(draft.watchDomains) ? draft.watchDomains : [];
  renderCandidates();
  renderWatchDomainChips();
}

function hasUnsavedDraftInput() {
  return Boolean(
    (descriptionInput?.value || '').trim() ||
    (watchDomainInput?.value || '').trim() ||
    state.candidates.length ||
    state.watchDomains.length
  );
}

function redirectToAuth(mode = 'login') {
  const saved = saveSessionDraft();
  if (!saved && hasUnsavedDraftInput()) {
    const shouldContinue = window.confirm(
      'Signing in will leave this page, and this browser did not allow Domain Research to save your current inputs. Copy them before continuing if you need them. Continue to sign in?'
    );
    if (!shouldContinue) return;
  }
  window.location.assign(buildAuthUrl(mode));
}

function promptForWatchRegistration() {
  const saved = saveSessionDraft();
  window.alert(
    'You are not signed in yet. To create domain watches and keep these domains linked to you, please create an account or sign in. After you press OK, registration will open.'
  );

  if (!saved && hasUnsavedDraftInput()) {
    const shouldContinue = window.confirm(
      'This browser did not allow Domain Research to save your current inputs. Copy them before continuing if you need them. Continue to registration?'
    );
    if (!shouldContinue) return;
  }

  window.location.assign(buildAuthUrl('register'));
}

function autosaveSessionDraft() {
  saveSessionDraft();
}

function isPlainObject(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function consumeAuthFragment() {
  if (!window.location.hash || !window.location.hash.includes('access_token=')) return;
  const params = new URLSearchParams(window.location.hash.slice(1));
  const accessToken = params.get('access_token') || '';
  const refreshToken = params.get('refresh_token') || '';
  const email = params.get('email') || '';
  const returnedState = params.get('state') || '';
  const expectedState = sessionStorage.getItem(STORAGE_STATE) || '';

  if (returnedState && expectedState && returnedState !== expectedState) {
    sessionStorage.removeItem(STORAGE_STATE);
    history.replaceState(null, '', window.location.pathname + window.location.search);
    throw new Error('Auth state mismatch');
  }

  setTokens(accessToken, refreshToken, email);
  sessionStorage.removeItem(STORAGE_STATE);
  history.replaceState(null, '', window.location.pathname + window.location.search);
}

function buildAuthUrl(mode = 'login') {
  const stateValue = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
  sessionStorage.setItem(STORAGE_STATE, stateValue);
  const url = new URL(`https://auth.alfares.cz/${mode}`);
  url.searchParams.set('client_id', 'domain-research');
  url.searchParams.set('return_url', `${window.location.origin}${window.location.pathname}`);
  url.searchParams.set('state', stateValue);
  return url.toString();
}

function updateAuthStatus() {
  const email = sessionStorage.getItem(STORAGE_EMAIL) || '';
  const loggedIn = Boolean(getAccessToken());
  if (authStatus) authStatus.textContent = loggedIn ? (email || 'signed in') : 'signed out';
  if (authButton) authButton.textContent = loggedIn ? 'Sign out' : 'Sign in';
}

async function api(path, options = {}) {
  const token = getAccessToken();
  const headers = { 'content-type': 'application/json', ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`/api${path}`, {
    ...options,
    headers,
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

function setupVoiceInput() {
  if (!descriptionInput || !voiceButton) return;

  const BrowserSpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!BrowserSpeechRecognition) {
    voiceButton.disabled = true;
    voiceButtonText.textContent = 'Voice unavailable';
    voiceStatus.textContent = 'Chrome voice input is unavailable in this browser.';
    return;
  }

  const recognition = new BrowserSpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = navigator.language || 'en-US';
  state.voice.recognition = recognition;

  voiceButton.addEventListener('click', () => {
    if (state.voice.active) {
      stopVoiceInput();
    } else {
      startVoiceInput();
    }
  });

  recognition.addEventListener('start', () => {
    state.voice.active = true;
    updateVoiceUi(true, 'Listening...');
  });

  recognition.addEventListener('result', handleVoiceResult);

  recognition.addEventListener('error', (event) => {
    const messages = {
      'not-allowed': 'Microphone access was blocked.',
      'service-not-allowed': 'Microphone access was blocked.',
      'audio-capture': 'Microphone is unavailable.',
      'no-speech': 'Listening...',
    };
    voiceStatus.textContent = messages[event.error] || 'Voice input stopped.';
    if (['not-allowed', 'service-not-allowed', 'audio-capture'].includes(event.error)) {
      state.voice.shouldRestart = false;
    }
  });

  recognition.addEventListener('end', () => {
    if (state.voice.shouldRestart) {
      try {
        recognition.start();
      } catch {
        state.voice.shouldRestart = false;
        state.voice.active = false;
        updateVoiceUi(false, 'Chrome voice input ready.');
      }
      return;
    }

    state.voice.active = false;
    updateVoiceUi(false, 'Chrome voice input ready.');
  });
}

function startVoiceInput() {
  if (!state.voice.recognition) return;

  state.voice.baseText = descriptionInput.value.trim();
  state.voice.finalText = '';
  state.voice.shouldRestart = true;

  try {
    state.voice.recognition.start();
  } catch {
    voiceStatus.textContent = 'Voice input is already active.';
  }
}

function stopVoiceInput() {
  if (!state.voice.recognition) return;

  state.voice.shouldRestart = false;
  state.voice.recognition.stop();
  updateVoiceUi(false, 'Chrome voice input ready.');
}

function handleVoiceResult(event) {
  let interimText = '';

  for (let index = event.resultIndex; index < event.results.length; index += 1) {
    const transcript = event.results[index][0].transcript.trim();
    if (!transcript) continue;

    if (event.results[index].isFinal) {
      state.voice.finalText = joinDictationText(state.voice.finalText, transcript);
    } else {
      interimText = joinDictationText(interimText, transcript);
    }
  }

  const dictatedText = joinDictationText(state.voice.finalText, interimText);
  descriptionInput.value = joinDictationText(state.voice.baseText, dictatedText);
  descriptionInput.dispatchEvent(new Event('input', { bubbles: true }));
}

function updateVoiceUi(isListening, statusText) {
  voiceButton.classList.toggle('is-listening', isListening);
  voiceButton.setAttribute('aria-pressed', String(isListening));
  voiceButton.setAttribute('aria-label', isListening ? 'Stop voice dictation' : 'Start voice dictation');
  voiceButtonText.textContent = isListening ? 'Stop' : 'Voice input';
  voiceStatus.textContent = statusText;
}

function joinDictationText(currentText, nextText) {
  if (!currentText) return nextText;
  if (!nextText) return currentText;
  return `${currentText} ${nextText}`;
}

function renderCandidates() {
  candidateList.innerHTML = state.candidates.map((candidate) => {
    const fqdn = String(candidate.fqdn || '');
    const checked = state.selectedDomains[fqdn] !== false ? 'checked' : '';
    return `
      <label class="candidate">
        <input type="checkbox" value="${escapeHtml(fqdn)}" ${checked} />
        <span>
          <span class="domain">${escapeHtml(fqdn)}</span>
          <span class="meta">score ${Math.round(candidate.score || 0)} · ${escapeHtml(candidate.source || 'heuristic')}</span>
        </span>
        <span class="badge ${candidate.availability === 'registered' ? 'warning' : ''}">${escapeHtml(candidate.availability || 'unchecked')}</span>
      </label>
    `;
  }).join('');
}

function captureCandidateSelections() {
  state.selectedDomains = Object.fromEntries(
    Array.from(candidateList.querySelectorAll('input[type="checkbox"]')).map((input) => [input.value, input.checked])
  );
}

function selectAllCandidates(candidates) {
  state.selectedDomains = Object.fromEntries(candidates.map((candidate) => [String(candidate.fqdn || ''), true]));
}

document.getElementById('suggestionForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  candidateList.innerHTML = '<p class="meta">Generating candidates...</p>';
  const payload = {
    description: descriptionInput?.value || '',
    tlds: (tldsInput?.value || '').split(',').map((item) => item.trim()).filter(Boolean),
    count: Number(countInput?.value || 12),
  };
  const job = await api('/domain-suggestions', { method: 'POST', body: JSON.stringify(payload) });
  state.candidates = job.candidates || [];
  selectAllCandidates(state.candidates);
  renderCandidates();
  saveSessionDraft();
});

document.getElementById('checkSelected').addEventListener('click', async () => {
  const domains = Array.from(candidateList.querySelectorAll('input:checked')).map((input) => input.value);
  if (!domains.length) return;
  const result = await api('/availability/check', { method: 'POST', body: JSON.stringify({ domains }) });
  const byDomain = new Map((result.results || []).map((item) => [item.fqdn, item]));
  state.candidates = state.candidates.map((candidate) => ({ ...candidate, ...(byDomain.get(candidate.fqdn) || {}) }));
  captureCandidateSelections();
  renderCandidates();
  saveSessionDraft();
});

function parseWatchDomains(value) {
  return String(value || '')
    .split(/[,\s]+/)
    .map(normalizeWatchDomain)
    .filter(Boolean);
}

function normalizeWatchDomain(value) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]
    .replace(/[.;:]+$/g, '');
  return normalized.includes('.') ? normalized : '';
}

function addWatchDomainsFromText(value) {
  const domains = parseWatchDomains(value);
  if (!domains.length) return false;

  const known = new Set(state.watchDomains);
  for (const domain of domains) known.add(domain);
  state.watchDomains = Array.from(known);
  renderWatchDomainChips();
  saveSessionDraft();
  return true;
}

function renderWatchDomainChips() {
  if (!watchDomainChips) return;
  watchDomainChips.innerHTML = state.watchDomains.map((domain) => `
    <span class="watch-domain-chip">
      <span>${escapeHtml(domain)}</span>
      <button type="button" data-watch-domain-remove="${escapeHtml(domain)}" aria-label="Remove ${escapeHtml(domain)}">x</button>
    </span>
  `).join('');
}

function collectWatchDomains() {
  if (watchDomainInput?.value.trim()) {
    addWatchDomainsFromText(watchDomainInput.value);
    watchDomainInput.value = '';
  }
  return [...state.watchDomains];
}

watchDomainInput?.addEventListener('input', () => {
  if (!/[,\n\r\t]/.test(watchDomainInput.value)) return;
  addWatchDomainsFromText(watchDomainInput.value);
  watchDomainInput.value = '';
});

watchDomainInput?.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter') return;
  event.preventDefault();
  if (addWatchDomainsFromText(watchDomainInput.value)) {
    watchDomainInput.value = '';
  }
});

watchDomainInput?.addEventListener('paste', (event) => {
  const pasted = event.clipboardData?.getData('text') || '';
  if (parseWatchDomains(pasted).length < 2) return;
  event.preventDefault();
  addWatchDomainsFromText(pasted);
  watchDomainInput.value = '';
});

watchDomainChips?.addEventListener('click', (event) => {
  const button = event.target.closest?.('[data-watch-domain-remove]');
  const domain = button?.dataset.watchDomainRemove;
  if (!domain) return;
  state.watchDomains = state.watchDomains.filter((item) => item !== domain);
  renderWatchDomainChips();
  saveSessionDraft();
  watchDomainInput?.focus();
});

watchForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const domains = collectWatchDomains();
  if (!domains.length) {
    watchDomainInput?.focus();
    return;
  }

  if (!getAccessToken()) {
    promptForWatchRegistration();
    return;
  }

  watchList.innerHTML = `<p class="meta">Adding ${domains.length} watch${domains.length === 1 ? '' : 'es'}...</p>`;
  const failed = [];
  for (const fqdn of domains) {
    try {
      await api('/watches', {
        method: 'POST',
        body: JSON.stringify({ fqdn }),
      });
    } catch (error) {
      failed.push({ fqdn, message: error.message });
    }
  }

  state.watchDomains = failed.map((item) => item.fqdn);
  renderWatchDomainChips();
  saveSessionDraft();
  await loadWatches();
  if (failed.length) {
    watchList.insertAdjacentHTML('afterbegin', `<p class="meta">Could not create: ${escapeHtml(failed.map((item) => item.fqdn).join(', '))}</p>`);
  }
});

[descriptionInput, tldsInput, countInput, watchDomainInput].forEach((input) => {
  input?.addEventListener('input', autosaveSessionDraft);
  input?.addEventListener('change', autosaveSessionDraft);
});

candidateList.addEventListener('change', (event) => {
  if (!event.target.matches('input[type="checkbox"]')) return;
  captureCandidateSelections();
  saveSessionDraft();
});

if (authButton) {
  authButton.addEventListener('click', () => {
    if (getAccessToken()) {
      sessionStorage.removeItem(STORAGE_ACCESS);
      sessionStorage.removeItem(STORAGE_REFRESH);
      sessionStorage.removeItem(STORAGE_EMAIL);
      updateAuthStatus();
      loadWatches().catch(() => undefined);
      return;
    }
    redirectToAuth('login');
  });
}

async function loadWatches() {
  updateAuthStatus();
  if (!getAccessToken()) {
    watchList.innerHTML = '<p class="meta">Sign in to view watched domains.</p>';
    return;
  }

  try {
    const watches = await api('/watches');
    watchList.innerHTML = watches.map((watch) => `
      <div class="watch" data-watch-id="${escapeHtml(watch.id)}">
        <span></span>
        <span>
          <span class="domain">${escapeHtml(watch.fqdn)}</span>
          <span class="meta">${escapeHtml(watch.lifecycleStage || 'unknown')} · next check ${escapeHtml(formatDate(watch.nextCheckAt))}</span>
          <span class="meta">drop estimate ${escapeHtml(formatDate(watch.dropCandidateAt))}</span>
        </span>
        <span class="badge ${watch.lastAvailability === 'registered' ? 'warning' : ''}">${escapeHtml(watch.lastAvailability)}</span>
        <span class="watch-actions">
          <button type="button" data-watch-action="accepted">Track drop</button>
          <button type="button" class="secondary" data-watch-action="declined">Stop</button>
        </span>
      </div>
    `).join('') || '<p class="meta">No watched domains yet.</p>';
  } catch (error) {
    watchList.innerHTML = `<p class="meta">${escapeHtml(error.message)}</p>`;
  }
}


watchList.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-watch-action]');
  if (!button) return;
  const row = button.closest('[data-watch-id]');
  const id = row?.dataset.watchId;
  if (!id) return;
  await api(`/watches/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ dropTrackingConsent: button.dataset.watchAction }),
  });
  await loadWatches();
});

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

try {
  consumeAuthFragment();
} catch (error) {
  watchList.innerHTML = `<p class="meta">${escapeHtml(error.message)}</p>`;
}
restoreSessionDraft();
updateAuthStatus();
setupVoiceInput();
checkHealth();
loadWatches().catch(() => undefined);
