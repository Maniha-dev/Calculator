# Splyt — Tip Calculator & Bill Splitter

> Split the bill. Not the friendship.

A live-updating tip calculator and bill splitter. No "Calculate" button — results appear instantly as you type.

## How to run

No build step, no dependencies.

```bash
# Clone / download the repo, then:
cd tip-calculator

# Option 1 — Python (comes pre-installed on macOS/Linux)
python3 -m http.server 3000
# open http://localhost:3000

# Option 2 — Node
npx serve .
# open the printed URL

# Option 3 — VS Code
# Install the "Live Server" extension → right-click index.html → Open with Live Server
```

Or just open `index.html` directly in a browser — it works as a plain file with no server required (all assets are local except the Google Fonts CDN call, which gracefully degrades).

---

See `ANSWERS.md` for stack choices, responsive/a11y notes, and rounding policy.
