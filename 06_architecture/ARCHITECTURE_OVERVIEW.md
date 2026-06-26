# Architecture Overview

```text
User UI
  -> Domain Research API
    -> ai-microservice for candidate expansion
    -> RDAP/provider adapters for availability evidence
    -> Postgres for jobs, checks, watches, notifications
    -> notifications-microservice for delivery
    -> logging-microservice for structured logs
    -> docs-rag-microservice for documentation retrieval and future ingestion
```

Recurring checks are Kubernetes CronJobs that call protected internal endpoints. This avoids hidden in-process schedulers and matches existing Alfares CronJob patterns.
