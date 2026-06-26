# SUB-001 RDAP Provider

RDAP is the default availability and lifecycle evidence provider.

Responsibilities:

- Load and cache IANA RDAP DNS bootstrap data.
- Resolve TLD to an RDAP base URL.
- Query `/domain/{fqdn}`.
- Interpret `404` as likely available with medium confidence.
- Interpret successful domain objects as registered with high confidence.
- Extract expiration events, registrar, and nameservers when present.
- Persist a hash of raw payload, not the raw payload.

Open:

- `[MISSING: supported TLD acceptance matrix]`
- `[MISSING: paid fallback provider]`
