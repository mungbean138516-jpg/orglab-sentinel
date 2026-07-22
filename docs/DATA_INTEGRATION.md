# Data integration boundary

The roadshow build is intentionally **mock-first**. Local fixtures are the default and CI must never depend on a live financial-data provider.

## Target source ownership

| Source | Owning Agent | Planned adapter | Trust role |
| --- | --- | --- | --- |
| Company news | News Agent | Finnhub through a server-side proxy | Secondary trigger; retain publisher, URL, time, and provider ID |
| SEC 10-K, 10-Q, 8-K | Data/Filing Agent | SEC Submissions API and filing documents | Primary filing evidence |
| XBRL facts | Data/Filing Agent | SEC Company Facts / filing facts | Structured facts with taxonomy, concept, unit, period, form, and accession |
| Social posts | News Agent | No live adapter in V1 | Unverified trigger; quarantine by default |

The Supervisor never fetches a new source. It receives validated `EvidenceBrief` records and must preserve agreements, conflicts, unknowns, and evidence IDs.

## Why a backend is required

- SEC `data.sec.gov` does not provide browser CORS support. Requests must identify the application with a declared User-Agent, use central rate limiting and caching, and handle timeouts and HTTP 429 responses.
- A Finnhub token is a secret. It must remain in server-side environment/secret storage and be sent in an outbound header. It must never be placed in Vite code or a `VITE_*` variable.
- Provider content is untrusted input. The backend should restrict protocols/domains, redirects, body size, and MIME type; sanitize HTML; block private-network requests; and pass extracted text to the model as data rather than instructions.

Official references:

- [SEC EDGAR APIs](https://www.sec.gov/search-filings/edgar-application-programming-interfaces)
- [SEC fair-access and request guidance](https://www.sec.gov/search-filings/edgar-search-assistance/accessing-edgar-data)
- [SEC RSS feeds](https://www.sec.gov/about/rss-feeds)
- [Finnhub company news](https://finnhub.io/docs/api/company-news)
- [Finnhub rate limits](https://finnhub.io/docs/api/rate-limit)

## Planned endpoint contract

The browser should call an application endpoint, not providers directly:

```text
GET /api/events/:ticker?since=...
  -> normalized Event[]

POST /api/runs
  body: { event_id, holdings_snapshot_id, organization, fault_seed }
  -> { run_id, status }

GET /api/runs/:run_id
  -> EvidenceBrief records, SupervisorSynthesis, Patch ledger, UserRiskReport
```

Every record must include `data_mode` (`MOCK`, `LIVE_DELAYED`, or `LIVE`), an as-of time, provider, freshness, and evidence identifiers. Live failure must be visible; the system must never silently replace missing live evidence with a fabricated fact.
