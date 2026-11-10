# Quick-start guide

One-page PDF linked from the app (`public/quick-start.pdf`).

Regenerate after UI changes:

```bash
npm run build
CHROME_PATH=/usr/bin/google-chrome python3 guide/shots.py   # phone screenshots of the current app
CHROME_PATH=/usr/bin/google-chrome python3 guide/pdf.py     # renders guide.html → public/quick-start.pdf
npm run build                                               # copies the new PDF into dist/
```

Needs Python Playwright (`pip install playwright`). Edit the copy in `guide.html`; screenshot crops are the `top:` offsets on each `<img>`.
