#!/usr/bin/env bash
# Post one sample SALES and one sample SUPPORT payload (the same flat JSON the
# ANNASIS website sends) to a lead webhook, e.g. the Cloudflare Worker in
# tools/pipedrive-lead-worker, a Zapier/Make hook, or a local mock server.
#
#   tools/test-lead-webhook.sh https://annasis-lead.<you>.workers.dev
#   ORIGIN=https://www.annasis.com tools/test-lead-webhook.sh <url>
#
# Sent as text/plain (like the browser). The Origin header defaults to the
# GitHub Pages preview so the Worker's Origin allowlist accepts it.
# NOTE: against the real Worker this creates real Pipedrive records
# ("Test Academy (webhook test)") — delete them afterwards.
set -euo pipefail

URL="${1:-}"
if [ -z "$URL" ]; then
  echo "Usage: $0 <webhook-url>" >&2
  exit 2
fi
ORIGIN="${ORIGIN:-https://aaronsiebert-ux.github.io}"
NOW="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

read -r -d '' SALES <<JSON || true
{
  "type": "sales",
  "source": "chat",
  "name": "Pat Tester",
  "firstName": "Pat",
  "lastName": "Tester",
  "email": "pat.tester@example.org",
  "phone": "555-0100",
  "role": "Business office / finance",
  "organization": "Test Academy (webhook test)",
  "orgType": "Private school",
  "size": "150–400 Students",
  "currentTools": ["FACTS / RenWeb", "QuickBooks"],
  "pains": ["Office double entry"],
  "plan": "",
  "timeline": "",
  "recommendation": "",
  "modules": [],
  "topics": ["Pricing"],
  "supportCategory": "",
  "message": "",
  "leadTitle": "Website pricing (Anna) – Test Academy (webhook test)",
  "noteText": "Sales lead from the ANNASIS website\nSource: ANNASIS website chat (Anna) — pricing request\n\nName: Pat Tester\nEmail: pat.tester@example.org\nPhone: 555-0100\nRole: Business office / finance\nSchool / organization: Test Academy (webhook test)\nOrganization type: Private school\nSize: 150–400 Students\nUses today: FACTS / RenWeb, QuickBooks\n\nPage: https://aaronsiebert-ux.github.io/annasis-website/pricing.html\nSubmitted: ${NOW}",
  "pageUrl": "https://aaronsiebert-ux.github.io/annasis-website/pricing.html",
  "landingPage": "https://aaronsiebert-ux.github.io/annasis-website/index.html?utm_source=test",
  "referrer": "",
  "utm_source": "test",
  "utm_medium": "",
  "utm_campaign": "webhook-test",
  "utm_term": "",
  "utm_content": "",
  "gclid": "",
  "submittedAt": "${NOW}",
  "intent": "pricing",
  "customerStatus": "",
  "questions": [],
  "website": ""
}
JSON

read -r -d '' SUPPORT <<JSON || true
{
  "type": "support",
  "source": "chat",
  "name": "Sam Office",
  "firstName": "Sam",
  "lastName": "Office",
  "email": "sam.office@example.org",
  "phone": "",
  "role": "",
  "organization": "Test Academy (webhook test)",
  "orgType": "",
  "size": "",
  "currentTools": [],
  "pains": [],
  "plan": "",
  "timeline": "",
  "recommendation": "",
  "modules": [],
  "topics": ["Support"],
  "supportCategory": "Login / account access",
  "message": "Test only: password reset email never arrives.",
  "leadTitle": "[Support] Login / account access – Test Academy (webhook test)",
  "noteText": "[Support] Support request from the ANNASIS website\nSource: ANNASIS website chat (Anna)\nCategory: Login / account access\nCustomer: ANNASIS customer (staff)\n\nName: Sam Office\nEmail: sam.office@example.org\nSchool / organization: Test Academy (webhook test)\n\nWhat’s going on:\nTest only: password reset email never arrives.\n\nPage: https://aaronsiebert-ux.github.io/annasis-website/index.html\nSubmitted: ${NOW}",
  "pageUrl": "https://aaronsiebert-ux.github.io/annasis-website/index.html",
  "landingPage": "https://aaronsiebert-ux.github.io/annasis-website/index.html",
  "referrer": "",
  "utm_source": "",
  "utm_medium": "",
  "utm_campaign": "",
  "utm_term": "",
  "utm_content": "",
  "gclid": "",
  "submittedAt": "${NOW}",
  "intent": "support",
  "customerStatus": "ANNASIS customer (staff)",
  "questions": [],
  "website": ""
}
JSON

status=0
for kind in SALES SUPPORT; do
  body="${!kind}"
  echo "== POST ${kind,,} payload → $URL"
  out="$(curl -sS -X POST "$URL" \
    -H "Content-Type: text/plain;charset=UTF-8" \
    -H "Origin: $ORIGIN" \
    --data-binary "$body" \
    -w $'\nHTTP %{http_code}' --max-time 20)" || { echo "network error"; status=1; continue; }
  echo "$out"
  code="$(printf '%s' "$out" | tail -n1 | awk '{print $2}')"
  case "$code" in 2??) ;; *) status=1 ;; esac
  echo
done
exit $status
