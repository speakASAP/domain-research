# Core Entities

- `DomainSuggestionJob`: a user request to generate candidates from a business description.
- `DomainCandidate`: one proposed fully qualified domain name.
- `DomainCheck`: one availability/lifecycle observation from RDAP or another provider.
- `DomainWatch`: a user's instruction to recheck a domain later.
- `DomainNotification`: a pending/sent/failed notification caused by watch state.

Open:

- `[MISSING: final authenticated user identifier shape]`
- `[MISSING: paid provider account model]`
