# ANNASIS lead Worker — website leads into Pipedrive

Pipedrive's built-in webhooks only send data **out** of Pipedrive, so the website
needs a small receiver. This folder is a free **Cloudflare Worker** that receives
the quiz / Anna chat payload from `js/annasis-engage.js` and creates the records
in Pipedrive:

| Website request | What the Worker creates in Pipedrive |
|---|---|
| **Sales** (`type: "sales"` — fit quiz, Pricing, Book a demo, chat) | Organization (found by name, or created) → Person (found by email, or created; linked to the org, phone, job title) → **Lead** titled with `leadTitle` → **Note** on the Lead with `noteText` |
| **Support** (`type: "support"` — Anna's "Get support") | Organization + Person as above → **Note** on the Person/Organization starting with `[Support]` → **Activity** (type *Task*, due today) "`[Support] <category> – <organization>`". No sales Lead is created. |

It also checks every request: a hidden spam-trap field (honeypot), required
fields (name, valid email, school/organization, and a message for support), and
that the request comes from `annasis.com`, `www.annasis.com`, or the GitHub
Pages preview `aaronsiebert-ux.github.io`. Your Pipedrive API token is stored as
an encrypted Cloudflare secret — it is never in the website or in this folder.

If Pipedrive is unreachable or rejects a record, the Worker answers with an
error and the website sends the visitor to the contact page with a copy-ready
summary, so the lead is not lost.

---

## Deploy it (about 15 minutes, no coding)

You need a computer with **Node.js** (free, <https://nodejs.org> → "LTS" installer).

### 1. Create a free Cloudflare account
Go to <https://dash.cloudflare.com/sign-up>, sign up, and verify your email.
The free Workers plan is plenty for website leads.

### 2. Get your Pipedrive API token
In Pipedrive: click your **profile picture (top right) → Personal preferences →
API** tab (direct link: `https://<your-company>.pipedrive.com/settings/api`).
Copy the **personal API token**. Treat it like a password.

> Leads, notes, and activities will show as created by the user whose token you
> use. You can use a dedicated "Website" user if you prefer.

### 3. Open a terminal in this folder
Download the website files (or this folder), then open Terminal (Mac) or
PowerShell (Windows) and go to the folder:

```bash
cd path/to/annasis-website/tools/pipedrive-lead-worker
```

### 4. Log in to Cloudflare
```bash
npx wrangler login
```
A browser window opens — click **Allow**. (`npx` downloads Cloudflare's
`wrangler` tool the first time; answer `y` if asked to install it.)

### 5. (Optional) Set your Pipedrive company domain
Open `wrangler.toml` in any text editor. If your Pipedrive address is
`https://annasis.pipedrive.com`, set `PIPEDRIVE_DOMAIN = "annasis"`. Leaving it
empty also works (it uses `https://api.pipedrive.com`).

### 6. Deploy the Worker
```bash
npx wrangler deploy
```
At the end it prints the Worker address, for example
`https://annasis-lead.<your-subdomain>.workers.dev`. Copy it.

### 7. Store the Pipedrive token as a secret
```bash
npx wrangler secret put PIPEDRIVE_API_TOKEN
```
Paste the token from step 2 when asked and press Enter. (It is stored encrypted
by Cloudflare; you won't see it again. Run the same command to replace it.)

### 8. Test it (creates test records — delete them afterwards)
From the website folder (Mac/Linux Terminal, or Git Bash on Windows):
```bash
tools/test-lead-webhook.sh https://annasis-lead.<your-subdomain>.workers.dev
```
You should see `HTTP 200` twice. In Pipedrive check **Leads Inbox** for
"Website pricing (Anna) – Test Academy (webhook test)" with a note, and
**Activities** for "[Support] Login / account access – Test Academy (webhook test)".
Then delete the test lead, activity, people, and organization.

You can also try the real website flow on the preview without changing any file:
open

`https://aaronsiebert-ux.github.io/annasis-website/?ae_endpoint=https://annasis-lead.<your-subdomain>.workers.dev`

then use Anna's Pricing or Get support, or the fit quiz's *Talk with Sales*.
The override lasts for that browser tab only and works only on the GitHub Pages
preview (never on www.annasis.com). Add `?ae_endpoint=off` to clear it.

### 9. Turn it on for the website
In `js/annasis-engage.js`, set the Worker address in the config near the top:

```js
lead: {
    endpoint: 'https://annasis-lead.<your-subdomain>.workers.dev',
    ...
```

(or define `window.ANNASIS_ENGAGE_CONFIG = { lead: { endpoint: '…' } }` before
the script loads). Hand the change to the web admin with the rest of the site
files. Until `endpoint` is set, the site keeps sending people to the contact page.

---

## Settings (`wrangler.toml` → `[vars]`, or Cloudflare dashboard → Worker → Settings → Variables)

| Name | Required | Meaning |
|---|---|---|
| `PIPEDRIVE_API_TOKEN` | yes (**secret**) | Pipedrive personal API token. Set with `npx wrangler secret put PIPEDRIVE_API_TOKEN`. Never commit it. |
| `PIPEDRIVE_DOMAIN` | no | Company subdomain (`annasis` → `https://annasis.pipedrive.com/api/v1`). Empty → `https://api.pipedrive.com/v1`. |
| `ALLOWED_ORIGINS` | no | Comma-separated sites allowed to post. Default: `https://annasis.com,https://www.annasis.com,https://aaronsiebert-ux.github.io`. Remove the GitHub Pages origin after launch if you like. |
| `JOB_TITLE_FIELD` | no | Person field for the visitor's role. Default `job_title`. If your Pipedrive has no Job title field, put the API key of a custom Person field here (Settings → Data fields → Person → field → "API key"). The role is in the note either way. |

## Troubleshooting
- **`HTTP 403 Origin not allowed`** — the request didn't come from an allowed site. `test-lead-webhook.sh` sends the preview origin by default; set `ORIGIN=https://www.annasis.com` to test that one.
- **`HTTP 500 Server not configured`** — the secret is missing: run step 7.
- **`HTTP 502 Could not save to Pipedrive`** — the token is wrong/expired or Pipedrive rejected a field. See live logs: `npx wrangler tail`, then submit again.
- **Duplicates** — organizations are matched by exact name and people by exact email, so "St. Mark's" and "St Marks" become two organizations. Merge them in Pipedrive.

## Developer notes
- `worker.js` exports `handleRequest(request, env, fetchImpl)` for testing; `node test.mjs` runs the unit tests with a mocked Pipedrive (no network, no token).
- Pipedrive API v1 calls: `GET /organizations/search`, `POST /organizations`, `GET /persons/search`, `POST /persons`, `PUT /persons/{id}` (fills an empty org/phone only), `POST /leads`, `POST /notes`, `POST /activities`.
- Accepts `text/plain` or `application/json` bodies up to 20 KB; replies with CORS headers for allowed origins and answers `OPTIONS` preflight.
- Payload schema: see `NEXT_VERSION_NOTES.md` → "Lead webhook payload".
