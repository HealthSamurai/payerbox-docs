# Interop APIs

The Interop APIs are the four FHIR APIs Payerbox publishes for the interoperability obligations under [CMS-9115-F](../compliance/cms-9115.md) and [CMS-0057-F](../compliance/cms-0057.md) (phased compliance dates documented in the compliance pages): members access their own data, in-network providers pull attributed-member data, prior payers hand off history at enrollment, and the public reads the network directory.

| API | Audience | What it does |
|---|---|---|
| [Patient Access](patient-access.md) | Plan members through third-party SMART on FHIR apps | Pull a member's own clinical, claims, and prior-authorization data |
| [Provider Access](provider-access.md) | In-network treating providers | Pull clinical + claims + PA data in bulk for the payer's members the provider treats |
| [Payer-to-Payer](payer-to-payer.md) | Prior payer and the new payer at enrollment | Transfer a member's history from the prior payer to the new one (opt-in) |
| [Provider Directory](provider-directory.md) | Public (unauthenticated) | Read-only listing of the payer's network: practitioners, locations, organizations |
