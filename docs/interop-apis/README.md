# Interop APIs

FHIR APIs that satisfy CMS-0057-F and CMS-9115-F for payer-to-consumer data exchange.

| Page | Rule of origin | Caller | Auth |
|---|---|---|---|
| [Patient Access](patient-access.md) | CMS-9115-F, extended by CMS-0057-F | Member-authorized third-party app | SMART App Launch |
| [Provider Access](provider-access.md) | CMS-0057-F | In-network provider system | SMART Backend Services |
| [Payer-to-Payer](payer-to-payer.md) | CMS-0057-F (replaces 9115 P2P) | Receiving payer | SMART Backend Services |
| [Provider Directory](provider-directory.md) | CMS-9115-F | Any consumer | Public read |

Authentication flows live in [API Reference / Authentication](../api-reference/authentication.md). Operation definitions live in [API Reference / Operations](../api-reference/operations/README.md). Regulatory anchors live in [Compliance](../compliance/README.md).
