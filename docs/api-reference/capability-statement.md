# Capability Statement

Every FHIR server publishes a CapabilityStatement at `/metadata` describing the resources, operations, search parameters, and authentication it supports. Use it to verify what a particular Payerbox deployment exposes before calling it.

## Endpoints

Each API surface has its own FHIR endpoint and its own CapabilityStatement.

| Surface | Endpoint | CapabilityStatement |
|---|---|---|
| Patient Access | `<base>/fhir` | `<base>/fhir/metadata` |
| Provider Access | `<base>/fhir` (same) | `<base>/fhir/metadata` |
| Payer-to-Payer | `<base>/fhir` (same) | `<base>/fhir/metadata` |
| Provider Directory | `<base>/fhir` (same, public read) | `<base>/fhir/metadata` |
| PAS | `<base>/fhir` (same) | `<base>/fhir/metadata` |

A single CapabilityStatement covers all surfaces of one deployment; individual operations and resources are tagged by which IG profile they implement.

## Fetching

```bash
curl -H "Accept: application/fhir+json" <base>/fhir/metadata
```

Response is a `CapabilityStatement` resource. Key sections:

| Field | Use |
|---|---|
| `fhirVersion` | Always `4.0.1` (R4) |
| `format` | Supported wire formats — `json`, `xml` |
| `rest[].security` | OAuth 2.0 / SMART endpoints (authorize, token, JWKS) |
| `rest[].resource[]` | Per-resource interactions, search parameters, supported profiles |
| `rest[].operation[]` | System-level operations (e.g., `$bulk-member-match`) |
| `rest[].resource[].operation[]` | Resource-level operations (e.g., `Claim/$submit`) |
| `instantiates` | Canonical URLs of IGs this server implements |

## Live demo CapabilityStatement

The hosted FHIR App Portal demo's Aidbox publishes its CapabilityStatement at:

```
https://fhir-app-portal-payer-sandbox-aidbox.smartbox.aidbox.dev/fhir/metadata
```

## What profiles to expect

Payerbox CapabilityStatement declares conformance to:

| Profile family | Source IG |
|---|---|
| US Core profiles | [US Core 6.1.0](https://hl7.org/fhir/us/core/STU6.1/) |
| CARIN Blue Button profiles | [CARIN BB STU 2.0.0](https://hl7.org/fhir/us/carin-bb/STU2/) |
| PDex profiles | [Da Vinci PDex STU 2.1.0](https://hl7.org/fhir/us/davinci-pdex/STU2.1/) |
| Plan Net profiles | [PDex Plan Net STU 1.1.0](https://hl7.org/fhir/us/davinci-pdex-plan-net/STU1.1/) |
| PAS Request/Response Bundle profiles | [Da Vinci PAS STU 2.1.0](https://hl7.org/fhir/us/davinci-pas/STU2.1/) |

Full IG matrix: [Implementation Guides](implementation-guides.md).

## Validation

Use the CapabilityStatement to validate clients programmatically:

```bash
# Fetch and pretty-print
curl -s <base>/fhir/metadata | jq '.rest[0].resource[] | {type, profile, supportedProfile}'
```

