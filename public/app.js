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
const CUSTOM_CANDIDATE_SCORE = 70;

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
const customCandidateForm = document.getElementById('customCandidateForm');
const customCandidateInput = document.getElementById('customCandidates');
const refreshWatchesButton = document.getElementById('refreshWatches');

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
      customCandidateInput: customCandidateInput?.value || '',
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
  if (customCandidateInput) customCandidateInput.value = draft.customCandidateInput || '';
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
    (customCandidateInput?.value || '').trim() ||
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

function renderCandidateError(message) {
  candidateList.innerHTML = `<p class="meta">${escapeHtml(message)}</p>`;
}

function parseCustomCandidateItems(value) {
  return String(value || '')
    .split(/[,\n\r\t]+/)
    .flatMap((chunk) => chunk.split(/\s+/))
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeCustomCandidateLabel(value) {
  return transliterateCyrillic(String(value || '').toLowerCase())
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]
    .replace(/[^a-z0-9.-]/g, '')
    .replace(/\.{2,}/g, '.')
    .replace(/^-+|-+$/g, '')
    .replace(/^\.+|\.+$/g, '');
}

function transliterateCyrillic(value) {
  const map = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y',
    к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
    х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ы: 'y', э: 'e', ю: 'yu', я: 'ya', ъ: '', ь: '',
  };
  return value.replace(/[а-яёъь]/g, (char) => map[char] ?? char);
}

function customCandidateDomains(value) {
  const tlds = (tldsInput?.value || 'com,cz')
    .split(',')
    .map((item) => item.toLowerCase().replace(/^\./, '').trim())
    .filter(Boolean);
  const domains = [];
  for (const item of parseCustomCandidateItems(value)) {
    const normalized = normalizeCustomCandidateLabel(item);
    if (!normalized) continue;
    if (normalized.includes('.')) {
      domains.push(normalized);
      continue;
    }
    for (const tld of tlds) domains.push(`${normalized}.${tld}`);
  }
  return Array.from(new Set(domains));
}

function addCustomCandidates(value) {
  const domains = customCandidateDomains(value);
  if (!domains.length) return false;

  captureCandidateSelections();
  const existing = new Set(state.candidates.map((candidate) => candidate.fqdn));
  const additions = domains
    .filter((fqdn) => !existing.has(fqdn))
    .map((fqdn) => ({ fqdn, score: CUSTOM_CANDIDATE_SCORE, source: 'custom', availability: 'unchecked' }));
  state.candidates = [...additions, ...state.candidates];
  domains.forEach((fqdn) => {
    state.selectedDomains[fqdn] = true;
  });
  renderCandidates();
  saveSessionDraft();
  return true;
}

document.getElementById('suggestionForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  candidateList.innerHTML = '<p class="meta">Generating candidates...</p>';
  const payload = {
    description: descriptionInput?.value || '',
    tlds: (tldsInput?.value || '').split(',').map((item) => item.trim()).filter(Boolean),
    count: Number(countInput?.value || 12),
  };
  try {
    const job = await api('/domain-suggestions', { method: 'POST', body: JSON.stringify(payload) });
    state.candidates = job.candidates || [];
    selectAllCandidates(state.candidates);
    renderCandidates();
    saveSessionDraft();
  } catch (error) {
    console.error('Candidate generation failed', error);
    renderCandidateError('Candidate generation failed. Please try again in a moment.');
  }
});


customCandidateForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  if (addCustomCandidates(customCandidateInput?.value || '')) {
    customCandidateInput.value = '';
    saveSessionDraft();
    return;
  }
  customCandidateInput?.focus();
});

customCandidateInput?.addEventListener('input', autosaveSessionDraft);
customCandidateInput?.addEventListener('change', autosaveSessionDraft);

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

async function handleWatchSubmit(event) {
  event?.preventDefault();
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
      const watch = await api('/watches', {
        method: 'POST',
        body: JSON.stringify({ fqdn }),
      });
      await api(`/watches/${encodeURIComponent(watch.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ dropTrackingConsent: 'accepted' }),
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
}

watchForm?.addEventListener('submit', handleWatchSubmit);
document.getElementById('createWatchesButton')?.addEventListener('click', handleWatchSubmit);

[descriptionInput, tldsInput, countInput, watchDomainInput, customCandidateInput].forEach((input) => {
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


refreshWatchesButton?.addEventListener('click', async () => {
  if (!getAccessToken()) {
    promptForWatchRegistration();
    return;
  }

  refreshWatchesButton.disabled = true;
  const originalText = refreshWatchesButton.textContent;
  refreshWatchesButton.textContent = 'Checking...';
  try {
    const result = await api('/watches/recheck', { method: 'POST', body: JSON.stringify({}) });
    renderWatchedDomainTable(result.watches || []);
    watchList.insertAdjacentHTML(
      'afterbegin',
      `<p class="meta">Checked ${escapeHtml(result.checked || 0)} watched domain${result.checked === 1 ? '' : 's'}${result.failed ? `, ${escapeHtml(result.failed)} failed` : ''}.</p>`
    );
  } catch (error) {
    watchList.insertAdjacentHTML('afterbegin', `<p class="meta">${escapeHtml(error.message)}</p>`);
  } finally {
    refreshWatchesButton.disabled = false;
    refreshWatchesButton.textContent = originalText;
  }
});

async function loadWatches() {
  updateAuthStatus();
  if (!getAccessToken()) {
    renderWatchedDomainTable([], 'Sign in to view watched domains.');
    return;
  }

  try {
    const watches = await api('/watches');
    renderWatchedDomainTable(watches);
  } catch (error) {
    watchList.innerHTML = `<p class="meta">${escapeHtml(error.message)}</p>`;
  }
}

function renderWatchedDomainTable(watches, emptyMessage = 'No watched domains yet.') {
  if (!watches.length) {
    watchList.innerHTML = `<p class="meta">${escapeHtml(emptyMessage)}</p>`;
    return;
  }

  watchList.innerHTML = `
    <table class="watch-table">
      <thead>
        <tr>
          <th>Domain</th>
          <th>Expires</th>
          <th>Buy window estimate</th>
          <th>Next check</th>
          <th>Notify</th>
        </tr>
      </thead>
      <tbody>
        ${watches.map((watch) => `
          <tr data-watch-id="${escapeHtml(watch.id)}">
            <td>
              <span class="domain">${escapeHtml(watch.fqdn)}</span>
              <span class="meta">${escapeHtml(watch.lifecycleStage || 'unknown')} · ${escapeHtml(watch.lastAvailability || 'unknown')}</span>
            </td>
            <td>${escapeHtml(formatDate(watch.lastExpiresAt, 'unknown'))}</td>
            <td>${escapeHtml(formatDate(watch.dropCandidateAt, 'not estimated'))}</td>
            <td>${escapeHtml(formatDate(watch.nextCheckAt, 'not scheduled'))}</td>
            <td>
              <label class="notify-toggle">
                <input
                  type="checkbox"
                  data-watch-notify
                  ${watch.dropTrackingConsent !== 'declined' ? 'checked' : ''}
                  aria-label="Notify when ${escapeHtml(watch.fqdn)} becomes available"
                />
                <span>When available</span>
              </label>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

watchList.addEventListener('change', async (event) => {
  const input = event.target.closest('[data-watch-notify]');
  if (!input) return;
  const row = input.closest('[data-watch-id]');
  const id = row?.dataset.watchId;
  if (!id) return;
  await api(`/watches/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ dropTrackingConsent: input.checked ? 'accepted' : 'declined' }),
  });
  await loadWatches();
});

function formatDate(value, fallback = 'not scheduled') {
  return value ? new Date(value).toLocaleString() : fallback;
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
loadWatches().catch(() => undefined);
