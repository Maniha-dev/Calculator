# ANSWERS.md

---

## 1. How to run

No build step, no dependencies. Clone/download the repo, then:

```bash
python3 -m http.server 3000   # or: npx serve .
# open http://localhost:3000
```

Or open `index.html` directly in a browser — it works as a plain file. The only external dependency is a Google Fonts CDN call; if it fails, the stack falls back to system serif/sans.

---

## 2. Stack & design choices

**Stack: Vanilla HTML + CSS + JS (no framework)**

The entire app is a single-screen calculator. There's no routing, no shared state tree, no async data — it's a pure input → output transformation. Reaching for React or Vue here would add ~40 KB of runtime for a problem that a 150-line JS file solves more directly. Vanilla JS also has zero build tooling, which means anyone can `open index.html` without installing Node.

**Visual decision 1: Results card on the right (desktop) / top (mobile)**

On desktop the layout is a 2-column grid: inputs left, results right. I chose this over stacking inputs then results because the output is the primary thing the user cares about — they want to see it without scrolling. The results card is `position: sticky; top: 1.5rem` so it stays visible even if the inputs panel grows. On mobile (≤ 680 px) the results card reorders to the top via CSS `order: -1`, so the answer is the first thing you see when you open the app, and the keyboard opens below the inputs — not covering the result.

**Visual decision 2: Monospace numbers throughout**

All currency values (inputs, outputs) use `DM Mono`. This affects every numeric element in the app — the input fields, the "Rs" prefixes, and the result values. Proportional fonts cause the layout to shift as digits change width (e.g. "1" vs "8"), which creates a jittery feel during live updates. Monospace fixes the column width so the layout is stable as the user types. It also gives the output panel a receipt / ledger quality that reads as deliberately "financial" rather than generic.

---

## 3. Responsive & accessibility

**360 px (narrow phone):**
- Single-column layout, results card above inputs
- Tip preset buttons shrink via `flex: 1` and wrap if needed — they never overflow
- `inputmode="decimal"` / `inputmode="numeric"` on each field so the mobile keyboard matches the expected input (numeric pad for people, decimal keyboard for bill/tip)
- `font-size: 1rem` on inputs prevents iOS Safari auto-zoom (which triggers below 16 px)
- The hero per-person number scales from 2 rem → 1.6 rem → 1.4 rem across breakpoints

**1440 px (laptop):**
- Two-column card grid with sticky results
- Comfortable reading widths, generous whitespace, result values rendered at full size

**Accessibility — what I handled:**

- **ARIA live regions:** Both the results section (`aria-live="polite" aria-atomic="true"`) and each error message (`role="alert" aria-live="polite"`) are announced by screen readers when they update. The error messages are near their fields and reference them via `aria-describedby`.
- **`aria-invalid`:** Set to `"true"` on each input when its validation fails, and cleared on fix.
- **`aria-pressed`:** Preset tip buttons are `<button type="button" aria-pressed="true/false">` — they behave as toggles, not checkboxes, which matches their function.
- **Keyboard stepper:** ↑ / ↓ arrow keys on the people field increment/decrement, in addition to the +/− buttons.
- **Focus management:** Tab order is natural (bill → preset buttons → custom tip → people stepper − → people input → stepper + → reset). The `reset` button returns focus to the bill input.
- **Colour contrast:** Checked primary text (#f0f2f5) on surface (#13161d): ~16:1. Accent (#c8f068) on surface: ~9:1. Error (#ff6b6b) on surface: ~5:1 — above WCAG AA 4.5:1 for small text.
- **`focus-visible`:** All interactive elements show a 2 px accent outline on keyboard focus; mouse clicks don't show it.

**Accessibility — what I knowingly skipped:**

I didn't add a `<fieldset>` + `<legend>` grouping around the tip presets section. The group has an `aria-label` on its `role="group"` div, which communicates its purpose to a screen reader. A `<fieldset>/<legend>` would be semantically more correct, but visually styling `<fieldset>` borders away without side effects (particularly in Safari) takes disproportionate effort for a minor improvement in this context.

---

## 4. AI usage

I used Claude (claude.ai) throughout this project.

**Where I used it:**

1. **Initial structure** — Asked for a semantic HTML skeleton for a tip calculator with accessible form fields.
2. **CSS architecture** — Asked for a CSS variables scheme for a dark fintech aesthetic.
3. **Validation logic** — Asked for a JS validation function for currency inputs.
4. **ARIA patterns** — Asked how to correctly mark up toggle-style preset buttons.

**One thing I changed and why:**

For the rounding/output logic, the AI initially gave me this approach:

```js
const perPerson = Math.round((total / people) * 100) / 100;
```

Round-to-nearest is the standard JS idiom, but I changed it to a ceiling function:

```js
function ceilTo2(n) {
  return Math.ceil(n * 100) / 100;
}
```

**Why:** The assessment brief explicitly asks me to pick a rounding policy and defend it. Round-to-nearest means the group can underpay by up to half a paisa per person × n people — small individually, but it means the calculated total can fall short of the actual bill. Ceiling-per-person guarantees the group always covers the full amount. I also added a disclosure note ("Rounded up so the group never under-pays") that appears only when rounding actually changes the value, so users aren't confused when the exact division is clean.

---

## 5. Honest gap

The weakest part of the submission is the empty state on the results card. Currently it shows a dashed circle with "Enter bill details to see the split." It's functional but generic — it does the job of preventing the user from staring at a "—" panel, but it's not memorable or instructive.

With another day I would replace it with a small animated breakdown: a ghost/skeleton of the three result rows with a subtle shimmer, plus a micro-illustration that communicates "split" (e.g. a receipt tearing in two). This would make the first impression stronger and more clearly communicate the app's purpose before the user types anything. I'd also add a "recently used" feature using `localStorage` to pre-fill the last used party size, which is the most tedious thing to re-type when you reopen the app at a restaurant.

---

**Rounding policy (standalone summary):**

Per-person amounts are rounded **up** to the nearest 2 decimal places using `Math.ceil(n * 100) / 100`. This ensures the group never underpays relative to the actual bill + tip. When rounding is applied, a note appears below the results. When the division is exact (e.g. Rs 300 ÷ 3 = Rs 100.00), no note appears and no rounding is performed.
