# License Admin (React + Vite)

A React port of the single-file admin page, so config values live in a `.env`
file (git-ignored) instead of being hardcoded in the source.

## Setup

```bash
npm install
cp .env.example .env
# then fill in .env with your Firebase + EmailJS values
npm run dev
```

Build for deployment:

```bash
npm run build   # outputs static files to dist/
```

`dist/` can be hosted anywhere static (Firebase Hosting, Netlify, GitHub
Pages, etc.) — it's the same kind of static bundle the original single HTML
file was, just built from source.

## Read this before you deploy

Moving to React and `.env` keeps these values **out of your git repository**,
which is worth doing. It does **not** hide them from anyone who opens the
deployed site, because `npm run build` bakes the `.env` values straight into
the JavaScript bundle that ships to every visitor's browser — same as the
original HTML did. Anyone can open dev tools, view the bundle, and read them
back out. There is no client-side technique (React, Vite, obfuscation, etc.)
that changes this; a static site's JS is public by construction.

That's actually fine here, because both sets of keys are designed to be
public:

- **Firebase web config** (`apiKey`, `authDomain`, `projectId`) identifies
  *which* Firebase project to talk to. It is not a secret — Google's own docs
  say so. What actually protects your data is your **Firestore Security
  Rules** (who can read/write which collections) and **Firebase
  Authentication** (who can sign in at all). Double-check those rules rather
  than worrying about this value leaking.
- **EmailJS public key** is, by name and design, meant to be shipped to
  browsers — that's how EmailJS's client-side send works. What limits abuse
  is EmailJS's **domain allowlist** (Account → Security on emailjs.com) —
  make sure only your real deployed domain(s) are listed there, or anyone
  who copies your public key could send email through your account from
  their own page.

If you ever add a value that's a genuine secret (a private API key, a
service-account credential, anything with real write/delete power with no
rule enforcement behind it), it must **not** go in `VITE_`-prefixed env vars
or anywhere in this frontend — it needs a backend or serverless function
that holds the secret and the browser only talks to your endpoint.

## Project structure

- `src/firebase.js` — Firebase app/auth/db init, reading config from
  `import.meta.env`.
- `src/emailjs.js` — EmailJS wrapper, same env-var pattern.
- `src/utils.js` — pure helper functions (code generation, formatting,
  error messages) ported 1:1 from the original script.
- `src/App.jsx` — all UI: sign-in screen, issue codes, send to client,
  codes/licenses/devices tables.
- `src/App.css` — styling, ported from the original `<style>` block.

## Deploying to GitHub Pages

Pushing to `main` builds and publishes automatically via
`.github/workflows/deploy.yml`. Three things have to be set up once, on the
GitHub side, before the first push will produce a working site.

**1. Set the Pages source to GitHub Actions.**
Settings → Pages → Build and deployment → Source → **GitHub Actions**.
If this is left on "Deploy from a branch", that branch-based publisher races
the Actions deploy and the site serves a blank page from whatever it finds at
the branch root.

**2. Add the six build values as repository secrets.**
Settings → Secrets and variables → Actions → New repository secret, one each:

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_EMAILJS_PUBLIC_KEY
VITE_EMAILJS_SERVICE_ID
VITE_EMAILJS_TEMPLATE_ID
```

Same values as your local `.env` (which stays git-ignored). The workflow
checks all six are present and fails the run with a named list if any is
missing — Vite would otherwise bake in `undefined` and publish a build that
loads fine and then breaks at sign-in.

These are secrets only in the "not committed to the repo" sense. As the
section above explains, they ship inside the public JS bundle either way.

**3. Allowlist the deployed domain in both services.**
The site will be served from `https://<user>.github.io/<repo>/`. Until that
domain is allowlisted, sign-in and email sending fail on the deployed site
while still working on `localhost`:

- **Firebase** — Authentication → Settings → Authorized domains → add
  `<user>.github.io`.
- **EmailJS** — Account → Security → add the same domain.

### Note on the base path

`vite.config.js` sets `base: "./"` so the built `index.html` references
`./assets/...` rather than `/assets/...`. A GitHub Pages project site is
served from a subpath, and the default absolute base would look for the
bundle at the domain root and 404 into a blank page. The relative base also
keeps `vite preview`, a custom domain, and a `<user>.github.io` root site all
working without editing the config.

### Note on who can reach this

GitHub Pages sites on a free account are public — the URL is reachable by
anyone who has it, and the `noindex` tag in `index.html` only asks search
engines not to list it. What actually keeps people out of the data is Firebase
Auth (they need credentials to get past the sign-in screen) and your Firestore
security rules. Worth re-reading those rules before putting this on a public
URL; if you'd rather it not be publicly addressable at all, a private host
(Firebase Hosting with App Check, or a private repo on a paid Pages plan) is
the better home for it.
