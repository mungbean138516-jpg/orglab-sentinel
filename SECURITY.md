# Security policy

OrgLab Sentinel is currently an offline, synthetic-data prototype. It does not accept real brokerage credentials, real portfolios, or API secrets.

## Report a vulnerability

Do not open a public issue containing a credential, personal financial information, or an exploitable payload. Contact the repository owner privately through GitHub and include the affected version, reproduction steps, and impact.

## Non-negotiable boundaries

- Never place Finnhub or another provider key in browser code, a `VITE_*` variable, a fixture, a screenshot, or a pull request.
- Never connect a brokerage or add an order-execution tool without a separately reviewed project decision.
- Treat filings, news, HTML, and social content as hostile data, never as Agent instructions.
- Validate structured Agent output, reject unknown fields, retain evidence IDs, and quarantine unsupported claims.
- Do not put real holdings, account identifiers, or personal financial information into fixtures or logs.
- Keep the offline mock fallback deterministic. CI must not call live financial-data APIs.

See `docs/DATA_INTEGRATION.md` for the planned server-side provider boundary.

