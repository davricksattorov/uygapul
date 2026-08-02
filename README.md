# uygapul.com

Rate comparison for money transfers from Europe to Uzbekistan.
Static site — no server, no build step, no database. Hosting costs nothing.

```
index.html          public page
admin.html          rate editor (noindex)
assets/style.css
assets/app.js
assets/admin.js
data/providers.js   the only file that changes day to day
.nojekyll
```

All paths are relative. Open `index.html` by double-clicking and it works.

---

## Going live (about 10 minutes)

1. Create a GitHub repo named `uygapul`. Upload every file, keeping the folder structure.
2. Repo → **Settings → Pages** → Source: *Deploy from a branch* → `main` / `/ (root)` → Save.
3. You're live at `yourname.github.io/uygapul`.
4. Point the domain: at your registrar create a CNAME record for `www` → `yourname.github.io`,
   then in Settings → Pages enter `www.uygapul.com` as the custom domain. Tick *Enforce HTTPS*.

---

## Updating rates without touching code

Open `/admin.html` → **Connection** tab, once:

- GitHub username, repo name, branch (`main`)
- A **fine-grained** personal access token:
  GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens.
  Scope it to **this one repository**, permission **Contents: Read and write**. Nothing else.
  Set an expiry you'll actually remember to renew.

Then, from any device: **Rates** tab → edit → **Publish**. Live in ~30 seconds.

The token is stored in that browser's localStorage only. It is never committed and never
leaves your device except in the call to GitHub. If you lose the phone, revoke the token.

No connection set up? **Download providers.js** and drop it into `data/` through the GitHub
web interface. Works from a phone too.

---

## What runs on its own

The mid-market EUR→UZS rate, fetched on page load and cached for the day. Primary source is
open.er-api.com; if it fails, the Central Bank of Uzbekistan JSON feed; if both fail, the
`fallbackRate` in `providers.js` — and the page visibly marks the rate as approximate.
That last part is not decoration. Silently showing a stale rate is how a comparison site
loses the only thing it has.

## What you maintain

The four numbers per provider. Once a month, send real money, compare the receipt to what
the site predicted, correct the margin, update the check date, publish. Fifteen minutes.

## Before launch

- Replace the placeholder `url` values with your referral links — that's the revenue.
- Replace the seeded margins with what your own receipts show.
- Resist adding more providers. Four honest rows beat twenty stale ones.
