# A-share data integration boundary

> The roadshow build is intentionally **MOCK-first**. CI and the default demo never call a live provider.

## Target source ownership

| Source | Owning Agent | Planned adapter | Trust role |
| --- | --- | --- | --- |
| Exchange / statutory disclosure | Disclosure Agent | Exchange or authorized disclosure backend | A-level factual confirmation |
| Issuer announcement | Disclosure Agent | Issuer / disclosure backend | A-level issuer statement |
| Enterprise identity and relationships | Disclosure Agent | Tianyancha MCP, server-side auth | B-level corporate corroboration |
| Licensed media | Public-trend Agent | Authorized news adapter | C-level context |
| Public trends and social discussion | Public-trend Agent | Chinese trends MCP | D-level discovery only |

High public-trend heat never overrides an A-level disclosure.

## Why only two specialist Agents

MCP tools are connectors, not decision-making Agents. The public-trend Agent may call a trends tool; the disclosure Agent may call enterprise and official-disclosure tools. Both still emit the same `EvidenceBrief v1.1` contract.

## Why a trusted backend is required

- API keys and ModelScope Hosted Remote URLs are secrets and must never enter React, a `VITE_*` variable, Git, screenshots or recordings.
- Provider content is untrusted input. Restrict domains, redirects, body size and MIME type; sanitize HTML; block private-network requests; treat returned text as data rather than instructions.
- Live adapters need central authorization, licensing checks, rate limits, caching, timeout budgets, retries and trace IDs.
- A public-trend aggregator may be community-maintained and is not an official API for every underlying platform.

The target path is:

```text
browser -> trusted backend / Bailian workflow -> MCP or licensed provider
```

## Normalized adapter output

Every adapter should emit:

- market, exchange, instrument code and entity identity;
- provider and source class;
- publication time, event time, retrieval time and freshness;
- original URL or disclosure number;
- fact, inference and unknown fields;
- verification status and failure reason;
- `data_mode` (`MOCK`, `LIVE_DELAYED`, `LIVE`);
- a stable evidence ID and trace ID.

The Supervisor never fetches a new source. It only receives validated briefs and preserves agreements, conflicts, unknowns and evidence IDs.

## Planned application endpoints

```text
GET /api/events/:ticker?since=...
  -> normalized Event[]

POST /api/runs
  body: { event_id, attention_snapshot_id, organization, fault_seed }
  -> { run_id, status }

GET /api/runs/:run_id
  -> EvidenceBrief[], SupervisorSynthesis, PatchLedger, UserRiskReport
```

Live failure must remain visible. The system must never silently replace a missing live response with a fabricated fact.

## External tools represented in the target design

- [Alibaba Cloud Model Studio MCP introduction](https://help.aliyun.com/zh/model-studio/mcp-introduction/)
- [Tianyancha MCP guide](https://ai.tianyancha.com/guide)
- [CNINFO](https://www.cninfo.com.cn/)
- [mcp-trends-hub package](https://www.npmjs.com/package/mcp-trends-hub)

Availability does not imply authorization, accuracy certification, financial compliance, content licensing or production SLA. Complete setup and secret handling: [`docs/roadshow/11_CONNECTOR_SETUP_AND_SECRETS.md`](roadshow/11_CONNECTOR_SETUP_AND_SECRETS.md).
