# work.naturagloss.com

My client-facing sales page. One page, one job: get a call booked.

Live at [work.naturagloss.com](https://work.naturagloss.com).

The repo is also part of the pitch. The page claims I ship tests, CI, error
monitoring and uptime checks on every project, so this repo does the same.

## Stack

| Part | Choice |
| --- | --- |
| Build | Vite 8 |
| UI | React 19, TypeScript, Tailwind CSS 4 |
| Backend | One Vercel serverless function under `api/` |
| Notifications | Telegram Bot API |
| Errors | Sentry, over plain HTTP, no SDK |
| Tests | Vitest |
| CI | GitHub Actions |
| Hosting | Vercel |

No router and no state library. It is one page.

## Getting started

Requires Node 22 or newer.

```bash
git clone https://github.com/OsamaKH-Cosmoland/osama-work.git
cd osama-work
npm install
cp .env.example .env.local
npm run dev
```

The dev server runs on http://localhost:5173.

`vite dev` does not run the serverless function. To exercise `/api/contact`
locally, run `vercel dev` instead, which serves the static build and the
function together on the same origin.

## Environment variables

Copy `.env.example` to `.env.local` for local work. In production these live in
the Vercel dashboard under Settings, Environment Variables. Nothing here is ever
committed.

| Variable | Required | What it is |
| --- | --- | --- |
| `TELEGRAM_BOT_TOKEN` | yes | Bot token from [@BotFather](https://t.me/BotFather). |
| `TELEGRAM_CHAT_ID` | yes | The chat that receives form submissions. |
| `SENTRY_DSN` | no | Sentry project DSN. Unset means error reporting is skipped, and nothing breaks. |
| `DEBUG_ERRORS` | no | Set to `1` to return the error message and stack in the response body. See below. |

### Getting `TELEGRAM_CHAT_ID`

Send your bot any message first, then open:

```
https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates
```

and copy `result[0].message.chat.id`.

Get this wrong and the endpoint returns `502` with "Could not deliver your
message". The token can be valid while the chat id is not. That cost me an
afternoon.

### `DEBUG_ERRORS`

Off by default and it should stay that way. The endpoint is public, and stack
traces should not be served to visitors. Turn it on only while debugging a
production failure, then remove it:

```bash
curl -sS -X POST https://work.naturagloss.com/api/contact \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test","email":"test@example.com","message":"Checking the endpoint."}'
```

With `DEBUG_ERRORS=1` set, error responses carry a `debug` object with the
name, message and stack.

## Tests

```bash
npm test          # once
npm run test:watch
npm run typecheck # tsc across the app and the serverless function
npm run build     # typecheck plus production bundle
```

95 tests. They cover the form validation rules, the endpoint's status codes,
the Sentry envelope format, and the rendered sections.

Two of them are regression guards rather than unit tests. They assert the
function imports nothing that breaks when bundled, and that the production
dependency list stays at four frontend-only packages. Both exist because of the
outage described below.

## Continuous integration

`.github/workflows/ci.yml` runs on every push to `main` and on pull requests
into it: install, tests, then typecheck and build. A failing test fails the
push.

## Project structure

```
api/                    Serverless function. Vercel compiles everything here.
  contact.ts            POST /api/contact
  _validation.ts        Form validation rules, shared with the frontend
  _sentry.ts            Sentry reporting over HTTP
  *.test.ts             Tests, never deployed as routes
src/
  content.ts            Every word on the page
  sections/             The eight page sections
  components/           Button, Container, Section
```

### Why the function's code lives under `api/`

This is the part worth reading before changing anything in `api/`.

Vercel compiles TypeScript **only under `api/`**, and it **transpiles each file
separately rather than bundling**. Two consequences:

1. **Anything the function imports must live under `api/`.** A module outside it
   is copied verbatim as `.ts`, which Node cannot load. `includeFiles` in
   `vercel.json` does not help, because it copies rather than compiles.
2. **Relative imports need an explicit `.js` extension.** `package.json` sets
   `"type": "module"`, and Node's ESM loader does not guess extensions.
   `./_validation.js` resolves to `_validation.ts` at build time.

Files prefixed with `_` are not turned into routes but are still compiled. That
is why the helpers and the tests are named the way they are. Renaming
`_validation.ts` to `validation.ts` would publish it as a public endpoint.

`api/contact.ts` also imports nothing at module scope except types. Every real
import happens inside the handler, inside a `try/catch`. An import that throws
during module load kills the function before any code runs, and Vercel reports
that only as `FUNCTION_INVOCATION_FAILED` with no stack. Doing it this way turns
that into a logged error that names the module.

A `GET` to `/api/contact` imports nothing and returns `405`. It is the cheapest
way to tell "the function loads" from "the function is broken":

```bash
curl -sS -o /dev/null -w '%{http_code}\n' https://work.naturagloss.com/api/contact
# 405 -> the module loads
# 500 -> it does not
```

### Why Sentry has no SDK

`@sentry/node` pulls in OpenTelemetry, which is CommonJS and calls `require()`
at runtime. Bundled into an ESM serverless function it throws `Dynamic require
of "util" is not supported` while the module is still loading, and the function
dies before the handler exists.

`api/_sentry.ts` posts to Sentry's envelope endpoint with `fetch` instead. Same
DSN, same env var, about 150 lines, no dependency. The function bundle went from
1.4 MB to under 10 KB, which also fixed the cold start on the endpoint that
decides whether I get the lead.

## The contact endpoint

`POST /api/contact`, same origin, no CORS.

```json
{
  "name": "Sarah Bennett",
  "email": "sarah@example.com",
  "company": "Brightfold",
  "budget": "$700 to $1,500",
  "message": "We need a small store for our candle brand."
}
```

| Status | Meaning |
| --- | --- |
| `200` | Sent. Telegram notification delivered. |
| `400` | Validation failed. Body carries one message per bad field. |
| `405` | Not a POST. |
| `502` | Valid submission, but Telegram could not be reached. |
| `500` | Something unexpected. Logged, and sent to Sentry if configured. |

`name`, `email` and `message` are required. `company` is optional. `budget` is
optional but must be one of the listed ranges if sent.

Validation failures are not reported to Sentry. A typo'd email is normal
traffic, and paging yourself for those is how you learn to ignore alerts.

Telegram messages are sent as plain text with no `parse_mode`. Markdown and HTML
modes both need the payload escaped, and a stranger's message field is the worst
place to get escaping wrong.

## Deploying

Vercel is connected to the GitHub repo, so pushing to `main` deploys:

```bash
git push origin main
```

Build settings are the Vite defaults: `npm run build`, output in `dist/`.
Functions in `api/` are picked up automatically. There is no `vercel.json` and
none is needed.

Set the environment variables in the Vercel dashboard for Production before the
first deploy, and redeploy after changing any of them. They are read at runtime,
so an existing deployment will not pick up a new value on its own.

### DNS

Already configured. Recorded here so it can be rebuilt if the zone is ever lost.

| Record | Name | Value |
| --- | --- | --- |
| CNAME | `work` | `77311b89afdb224d.vercel-dns-017.com` |
| A | `@` (apex, the store) | `76.76.21.21` |

The `work` subdomain points at this project. The apex still points at the Natura
Gloss store, which is a separate Vercel project. Adding the subdomain did not
touch the apex.

Vercel issues and renews the TLS certificate automatically once the CNAME
resolves.

## Editing the copy

Every word on the page is in `src/content.ts`. The components only read from it,
so the copy can be changed without touching JSX.

The voice rules are documented at the top of that file. Short sentences, plain
words, always "I" and never "we", no marketing language, no em-dashes, no
exclamation marks. Plain beats clever.

Two things in there are deliberately unfinished:

- `caseStudy.result.metrics` is an empty array with a `TODO` listing where to
  pull each real figure. The section renders correctly while it is empty. Only
  numbers I can defend on a call go in it.
- `about.photo` is `null`. Drop a file in `public/` and set the path. The layout
  works with or without it.
