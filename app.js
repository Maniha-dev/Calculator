'use strict';

/* ─── CONFIG ──────────────────────────────────────────────────────────────── */
const MAX_BILL     = 9_999_999;
const MAX_TIP      = 100;       // sensible upper bound: 100%
const MAX_PEOPLE   = 100;
const CURRENCY     = 'Rs';

/* ─── STATE ───────────────────────────────────────────────────────────────── */
let state = {
  bill: '',
  tip: '',          // numeric string or ''
  people: '',
  activePreset: null,
};

/* ─── DOM REFS ────────────────────────────────────────────────────────────── */
const billInput    = document.getElementById('bill-input');
const tipInput     = document.getElementById('tip-custom');
const peopleInput  = document.getElementById('people-input');
const resetBtn     = document.getElementById('reset-btn');
const decBtn       = document.getElementById('people-dec');
const incBtn       = document.getElementById('people-inc');

const billWrap     = document.getElementById('bill-wrap');
const tipWrap      = document.getElementById('tip-wrap');
const peopleWrap   = document.getElementById('people-wrap');

const billError    = document.getElementById('bill-error');
const tipError     = document.getElementById('tip-error');
const peopleError  = document.getElementById('people-error');

const outTip       = document.getElementById('out-tip');
const outTotal     = document.getElementById('out-total');
const outPerPerson = document.getElementById('out-per-person');
const perPersonNote = document.getElementById('per-person-note');
const roundingNote = document.getElementById('rounding-note');
const resultEmpty  = document.getElementById('result-empty');

const presetBtns   = document.querySelectorAll('.preset-btn');

/* ─── VALIDATION ──────────────────────────────────────────────────────────── */
function validateBill(raw) {
  if (raw === '' || raw === null) return { ok: false, msg: '' }; // empty = no error shown
  const n = parseFloat(raw);
  if (isNaN(n))        return { ok: false, msg: 'Enter a valid number.' };
  if (n < 0)           return { ok: false, msg: 'Amount cannot be negative.' };
  if (n === 0)         return { ok: false, msg: 'Amount must be greater than 0.' };
  if (n > MAX_BILL)    return { ok: false, msg: `Max bill is ${CURRENCY} ${MAX_BILL.toLocaleString()}.` };
  // Reject more than 2 decimal places in raw input
  if (/\.\d{3,}/.test(raw)) return { ok: false, msg: 'Max 2 decimal places.' };
  return { ok: true, value: n };
}

function validateTip(raw) {
  if (raw === '' || raw === null) return { ok: false, msg: '' };
  const n = parseFloat(raw);
  if (isNaN(n))        return { ok: false, msg: 'Enter a valid percentage.' };
  if (n < 0)           return { ok: false, msg: 'Tip cannot be negative.' };
  if (n > MAX_TIP)     return { ok: false, msg: `Max tip is ${MAX_TIP}%.` };
  return { ok: true, value: n };
}

function validatePeople(raw) {
  if (raw === '' || raw === null) return { ok: false, msg: '' };
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return { ok: false, msg: 'Must be a whole number.' };
  const n = parseInt(trimmed, 10);
  if (n < 1)           return { ok: false, msg: 'At least 1 person required.' };
  if (n > MAX_PEOPLE)  return { ok: false, msg: `Max ${MAX_PEOPLE} people.` };
  return { ok: true, value: n };
}

/* ─── ROUNDING POLICY ─────────────────────────────────────────────────────── *
 * We round UP per person to the nearest paisa (2 decimal places).
 * This ensures the group never under-pays. The displayed value is the ceiling
 * of (total / people) to 2dp. A note clarifies this when rounding kicks in.
 * ─────────────────────────────────────────────────────────────────────────── */
function ceilTo2(n) {
  return Math.ceil(n * 100) / 100;
}

function formatMoney(n) {
  // Always show 2 decimal places
  return n.toLocaleString('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/* ─── COMPUTE & RENDER ────────────────────────────────────────────────────── */
function compute() {
  const billV   = validateBill(state.bill);
  const tipV    = validateTip(state.tip);
  const peopleV = validatePeople(state.people);

  // Show/hide errors
  setError(billError, billWrap, billInput,     billV.msg   || '');
  setError(tipError,  tipWrap,  tipInput,      tipV.msg    || '');
  setError(peopleError, peopleWrap, peopleInput, peopleV.msg || '');

  // All valid?
  const allValid = billV.ok && tipV.ok && peopleV.ok;

  if (!allValid) {
    showEmpty();
    return;
  }

  const bill    = billV.value;
  const tipPct  = tipV.value;
  const people  = peopleV.value;

  const tipAmt  = bill * (tipPct / 100);
  const total   = bill + tipAmt;
  const rawPerP = total / people;
  const perP    = ceilTo2(rawPerP);

  // Detect if rounding was applied (more than 2dp in exact value)
  const exactPerP  = total / people;
  const wasRounded = Math.abs(perP - exactPerP) > 0.0001;

  // Update outputs
  setResult(outTip,       tipAmt);
  setResult(outTotal,     total);
  setResult(outPerPerson, perP);

  // Per-person sublabel
  if (people === 1) {
    perPersonNote.textContent = '(just you)';
  } else {
    perPersonNote.textContent = `÷ ${people} people`;
  }

  // Rounding note
  if (wasRounded) {
    roundingNote.textContent = `Rounded up so the group never under-pays.`;
  } else {
    roundingNote.textContent = '';
  }

  hideEmpty();
}

function setResult(container, value) {
  const numEl = container.querySelector('.result-num');
  const newText = formatMoney(value);
  if (numEl.textContent !== newText) {
    numEl.textContent = newText;
    numEl.classList.remove('updated');
    // Trigger reflow for animation restart
    void numEl.offsetWidth;
    numEl.classList.add('updated');
    setTimeout(() => numEl.classList.remove('updated'), 600);
  }
}

function showEmpty() {
  resultEmpty.setAttribute('aria-hidden', 'false');
  outTip.querySelector('.result-num').textContent       = '—';
  outTotal.querySelector('.result-num').textContent     = '—';
  outPerPerson.querySelector('.result-num').textContent = '—';
  perPersonNote.textContent = '';
  roundingNote.textContent  = '';
}

function hideEmpty() {
  resultEmpty.setAttribute('aria-hidden', 'true');
}

function setError(errEl, wrapEl, inputEl, msg) {
  if (msg) {
    errEl.textContent = msg;
    errEl.classList.add('visible');
    wrapEl.classList.add('error');
    inputEl.setAttribute('aria-invalid', 'true');
  } else {
    errEl.textContent = '';
    errEl.classList.remove('visible');
    wrapEl.classList.remove('error');
    inputEl.setAttribute('aria-invalid', 'false');
  }
}

/* ─── INPUT SANITISERS ────────────────────────────────────────────────────── */
// Strip non-numeric except one decimal point
function sanitiseDecimal(val) {
  let s = val.replace(/[^\d.]/g, '');
  const parts = s.split('.');
  if (parts.length > 2) s = parts[0] + '.' + parts.slice(1).join('');
  return s;
}

function sanitiseInteger(val) {
  return val.replace(/[^\d]/g, '');
}

/* ─── EVENT LISTENERS ─────────────────────────────────────────────────────── */

// Bill
billInput.addEventListener('input', () => {
  const raw = sanitiseDecimal(billInput.value);
  if (billInput.value !== raw) {
    const sel = billInput.selectionStart;
    billInput.value = raw;
    billInput.setSelectionRange(sel, sel);
  }
  state.bill = raw;
  compute();
});

billInput.addEventListener('blur', () => {
  // Format on blur: if valid, normalise to 2dp
  const v = validateBill(state.bill);
  if (v.ok) {
    const formatted = v.value.toFixed(2);
    billInput.value = formatted;
    state.bill = formatted;
    compute();
  }
});

// Tip custom input
tipInput.addEventListener('input', () => {
  const raw = sanitiseDecimal(tipInput.value);
  if (tipInput.value !== raw) {
    const sel = tipInput.selectionStart;
    tipInput.value = raw;
    tipInput.setSelectionRange(sel, sel);
  }

  // Deselect preset if user is typing custom
  if (raw !== '') {
    deactivatePresets();
    state.activePreset = null;
  }

  state.tip = raw;
  compute();
});

// Presets
presetBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const val = btn.dataset.tip;
    const isAlreadyActive = btn.getAttribute('aria-pressed') === 'true';

    deactivatePresets();

    if (isAlreadyActive) {
      // Toggle off
      state.tip = '';
      state.activePreset = null;
      tipInput.value = '';
    } else {
      btn.setAttribute('aria-pressed', 'true');
      state.activePreset = val;
      state.tip = val;
      tipInput.value = val;
    }

    compute();
  });
});

function deactivatePresets() {
  presetBtns.forEach(b => b.setAttribute('aria-pressed', 'false'));
}

// People
peopleInput.addEventListener('input', () => {
  const raw = sanitiseInteger(peopleInput.value);
  if (peopleInput.value !== raw) {
    const sel = peopleInput.selectionStart;
    peopleInput.value = raw;
    peopleInput.setSelectionRange(sel, sel);
  }
  state.people = raw;
  updateStepperBtns();
  compute();
});

decBtn.addEventListener('click', () => {
  const cur = parseInt(state.people, 10) || 1;
  const next = Math.max(1, cur - 1);
  state.people = String(next);
  peopleInput.value = state.people;
  updateStepperBtns();
  compute();
});

incBtn.addEventListener('click', () => {
  const cur = parseInt(state.people, 10) || 0;
  const next = Math.min(MAX_PEOPLE, cur + 1);
  state.people = String(next);
  peopleInput.value = state.people;
  updateStepperBtns();
  compute();
});

function updateStepperBtns() {
  const n = parseInt(state.people, 10);
  decBtn.disabled = n <= 1;
  incBtn.disabled = n >= MAX_PEOPLE;
}

// Keyboard: Enter/ArrowUp/ArrowDown on people input
peopleInput.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    incBtn.click();
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    decBtn.click();
  }
});

// Reset
resetBtn.addEventListener('click', () => {
  state = { bill: '', tip: '', people: '', activePreset: null };
  billInput.value   = '';
  tipInput.value    = '';
  peopleInput.value = '';
  deactivatePresets();
  updateStepperBtns();
  // Clear all errors
  setError(billError,   billWrap,   billInput,   '');
  setError(tipError,    tipWrap,    tipInput,    '');
  setError(peopleError, peopleWrap, peopleInput, '');
  showEmpty();

  // Animate the reset
  resetBtn.style.transform = 'rotate(-360deg)';
  resetBtn.style.transition = 'transform 0.5s ease';
  setTimeout(() => {
    resetBtn.style.transform = '';
    resetBtn.style.transition = '';
  }, 500);

  billInput.focus();
});

/* ─── PASTE HANDLING ──────────────────────────────────────────────────────── */
// Prevent pasting garbage into bill/tip (allow paste but sanitise via input event)
[billInput, tipInput].forEach(el => {
  el.addEventListener('paste', () => {
    // Input event fires after paste and will sanitise
    setTimeout(() => el.dispatchEvent(new Event('input')), 0);
  });
});

/* ─── INIT ────────────────────────────────────────────────────────────────── */
updateStepperBtns();
showEmpty();
billInput.focus();
