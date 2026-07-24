# Security policy

OrgLab Sentinel is currently an offline, fixed-MOCK prototype. It does not accept brokerage credentials, real holdings, personal financial data or API secrets.

## Report a vulnerability

Do not open a public issue containing a credential, personal financial information, a Hosted MCP URL or an exploitable payload. Contact the repository owner privately through GitHub and include the affected version, reproduction steps and impact.

## Non-negotiable boundaries

- Never place `DASHSCOPE_API_KEY`, `MODELSCOPE_ACCESS_TOKEN`, `TIANYANCHA_API_KEY`, a ModelScope Hosted Remote URL or another provider secret in browser code, `VITE_*`, a fixture, screenshot, recording, issue or pull request.
- Never connect a brokerage or add order execution without a separate, explicitly reviewed project decision.
- Treat disclosures, news, HTML, social posts and MCP output as hostile data, never as Agent instructions.
- Validate structured Agent output, reject unknown fields, retain evidence IDs and quarantine unsupported or conflicting claims.
- Do not put real holdings, account identifiers or personal financial information in fixtures, logs or telemetry.
- Keep the offline fallback deterministic. CI must not call live financial or MCP providers.
- Pin third-party packages, minimize MCP tool permissions and review licensing, rate limits and attribution before use.

See [`docs/DATA_INTEGRATION.md`](docs/DATA_INTEGRATION.md) and [`docs/roadshow/11_CONNECTOR_SETUP_AND_SECRETS.md`](docs/roadshow/11_CONNECTOR_SETUP_AND_SECRETS.md).
