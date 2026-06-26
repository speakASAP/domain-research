# Project Invariants

1. Availability claims require a current provider check and confidence level.
2. Expiry-date reminders schedule a recheck first; notification follows only if the recheck shows availability.
3. Secrets remain in Vault and Kubernetes Secrets, never in source files.
4. Raw RDAP/WHOIS provider payloads are not stored by default.
5. Notifications are delegated to notifications-microservice.
6. AI calls are delegated to ai-microservice.
7. Documentation retrieval uses docs-rag-microservice.
