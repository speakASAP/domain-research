# BUSINESS.md

completeness_level: complete

## Problem
Alfares teams need a repeatable way to propose, validate, and monitor domain names for products, services, and campaigns without relying on manual guesswork or one-off checks.

## Target users and stakeholders
- Product owners and platform teams selecting service or product names
- Business builders and marketing stakeholders who need brandable domain candidates
- Internal operators who need domain availability and expiry evidence before launch decisions
- Service owners who need watch-based recheck reminders for domains that become available again

## Value proposition
Domain Research reduces the friction of domain-name discovery by recommending candidates from business context, checking lifelong availability signals through RDAP-first evidence, and watching registered domains until they become available.

## Goals
- Generate strong domain candidates from user or service context.
- Validate domain availability and lifecycle status with evidence-backed checks.
- Track watched domains until they are available again.
- Dispatch notifications through the approved notifications boundary once a domain recheck indicates availability.

## Non-goals
- Automatic purchase of a domain without explicit approval or a dedicated provider integration.
- Storing raw registrar or RDAP data beyond the approved lifecycle evidence model.
- Implementing a custom notification delivery stack in the repo itself.
- Replacing core docs-rag or identity workflows with a separate business service boundary.

## Success metrics
- The service proposes candidate domains that are relevant to the user’s business context.
- Availability checks are evidence-backed and repeatable.
- Watch-based rechecks identify domains that become available again.
- Notifications are sent only through the approved notifications workflow after a successful recheck.

## Business constraints
- Domain purchase is a handoff to an approved provider flow rather than a self-implemented purchase engine.
- RDAP-first validation is the default evidence model unless a future approved registrar adapter is enabled.
- Notifications require the approved notifications-microservice contract and explicit recipient policy.
- The service must stay aligned with user ownership and domain lifecycle evidence rather than making assumptions about provider behavior.

## Approval
Status: approved
Approved by: project owner
Approval evidence: owner-confirmation: domain-research-onboarding-approved
