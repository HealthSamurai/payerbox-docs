---
description: Public, unauthenticated FHIR API exposing contracted providers, pharmacies, networks, and plans. Conformant to the Da Vinci PDex Plan-Net IG.
---

# Provider Directory API

The [Da Vinci PDex Plan-Net IG](https://hl7.org/fhir/us/davinci-pdex-plan-net/) profiles a payer's network of contracted providers, pharmacies, organizations, locations, and plans as FHIR resources so members and third-party apps can query them without an account. Required under CMS-9115-F since January 1, 2021; CMS-0057-F did not change it. See [Compliance / CMS-9115](../compliance/cms-9115.md) for citations and SLAs.

## What Payerbox covers

- Plan-Net IG preconfigured.
- Public unauthenticated `GET` on the Plan-Net directory resource types (`Practitioner`, `PractitionerRole`, `Organization`, `Location`, `HealthcareService`); everything else stays authenticated.
- `Location.near` geographic search.
- FHIR Bulk Data `$export` for periodic directory snapshots.
- [MPF feed](#mpf-feed-for-medicare-plan-finder) for the CMS Medicare Plan Finder crawler, published daily as static bundles per Medicare Advantage contract and year (optional module).

## Caller and auth

| Property | Value |
|---|---|
| Caller | Public — member portals, app developers, CMS Lookup tools, aggregators |
| Authentication | None for end-users; payer may issue API keys for rate-limiting |
| Base URL | `<base>/fhir` |
| CapabilityStatement | `<base>/fhir/metadata` |

Unauthenticated `GET` is permitted on `Practitioner`, `PractitionerRole`, `Organization`, `Location`, and `HealthcareService`. All other interactions require authentication.

## Resources and profiles

Plan-Net 1.1.0 defines nine profiles. Payerbox ships seed bundles shaped against them; the IG package can be loaded to turn on profile validation.

| FHIR resource | Plan-Net profile | Use |
|---|---|---|
| `Organization` (type=`prov`) | [plannet-Organization](http://hl7.org/fhir/us/davinci-pdex-plan-net/StructureDefinition/plannet-Organization) | Hospitals, clinics, group practices |
| `Organization` (type=`ntwk`) | [plannet-Network](http://hl7.org/fhir/us/davinci-pdex-plan-net/StructureDefinition/plannet-Network) | Named provider networks (HMO, PPO, Medicaid, etc.) |
| `OrganizationAffiliation` | [plannet-OrganizationAffiliation](http://hl7.org/fhir/us/davinci-pdex-plan-net/StructureDefinition/plannet-OrganizationAffiliation) | Org-to-network and org-to-org relationships |
| `Practitioner` | [plannet-Practitioner](http://hl7.org/fhir/us/davinci-pdex-plan-net/StructureDefinition/plannet-Practitioner) | Individual clinicians; NPI, qualifications, languages |
| `PractitionerRole` | [plannet-PractitionerRole](http://hl7.org/fhir/us/davinci-pdex-plan-net/StructureDefinition/plannet-PractitionerRole) | Specialty, location, network, accepting-new-patients, PCP flag |
| `Location` | [plannet-Location](http://hl7.org/fhir/us/davinci-pdex-plan-net/StructureDefinition/plannet-Location) | Practice sites; accessibility, geo position |
| `HealthcareService` | [plannet-HealthcareService](http://hl7.org/fhir/us/davinci-pdex-plan-net/StructureDefinition/plannet-HealthcareService) | Services offered at a location |
| `InsurancePlan` | [plannet-InsurancePlan](http://hl7.org/fhir/us/davinci-pdex-plan-net/StructureDefinition/plannet-InsurancePlan) | Plan name, type, coverage area, network references |
| `Endpoint` | [plannet-Endpoint](http://hl7.org/fhir/us/davinci-pdex-plan-net/StructureDefinition/plannet-Endpoint) | Technical endpoints associated with an organization |

## Data elements

| Element | Carrier |
|---|---|
| Provider name | `Practitioner.name` / `Organization.name` |
| Address | `Location.address` |
| Phone number | `PractitionerRole.telecom` / `Location.telecom` |
| Specialty | `PractitionerRole.specialty` (NUCC) |
| Accepting new patients | `newpatients` extension |
| Accessibility (ADA, telehealth, etc.) | `accessibility` extension |
| Languages spoken | `Practitioner.communication` |
| Primary care provider flag | `primary-care-provider` extension |
| Network membership | `network-reference` extension |
| Board certification | ABMS qualification |

## Pharmacy directory (MA-PD)

Medicare Advantage organizations offering MA-PD also publish pharmacy data through the same API: pharmacy name, address, phone, network pharmacy count, and pharmacy type (retail, mail-order, LTC). Plan-Net 1.1.0 does not define a dedicated pharmacy profile — pharmacies are modeled as `Organization` plus `HealthcareService` with the pharmacy type in `category`.

## Search examples

Mapped to Plan-Net's canonical [use cases](https://hl7.org/fhir/us/davinci-pdex-plan-net/background.html). All FHIR R4 search semantics apply; Plan-Net adds the search parameters used below.

### Find a provider by specialty in a member's network

A member needs an in-network cardiologist. Filter `PractitionerRole` by specialty (NUCC code) and network reference; `_include` the Practitioner and Location to get the full record back in one Bundle.

```bash
GET <base>/fhir/PractitionerRole
  ?specialty=207RC0000X
  &network=Organization/<network-id>
  &_include=PractitionerRole:practitioner
  &_include=PractitionerRole:location
```

Specialty accepts either a NUCC code or free text via the `:text` modifier (`specialty:text=cardiology`).

### Find which insurance plans an organization accepts

Answer "does this practice accept my plan?" via `OrganizationAffiliation`: query affiliations where the practice is the participating organization, then resolve the network to its `InsurancePlan`.

```bash
GET <base>/fhir/OrganizationAffiliation
  ?participating-organization=Organization/<org-id>
  &_include=OrganizationAffiliation:network
```

### Discover an organization's electronic endpoints

For data exchange (FHIR server URL, Direct address, IHE endpoint) belonging to a given Organization:

```bash
GET <base>/fhir/Endpoint?organization=Organization/<org-id>
```

### Find an individual or organization by name

When the caller just needs contact info — no electronic endpoint required:

```bash
GET <base>/fhir/Practitioner?name=Smith&_include=*

GET <base>/fhir/Organization?name=Acme&address-city=Boston
```

### Geographic search ("near me")

`Location.near` is supported for radius queries (coordinate + distance):

```bash
GET <base>/fhir/PractitionerRole
  ?specialty=207RC0000X
  &location.near=<lat>|<lon>|<radius>|[mi_us]
  &_include=PractitionerRole:practitioner
  &_include=PractitionerRole:location
```

## Bulk download

CMS recommends — but does not mandate — periodic full-directory downloads alongside REST search. Payerbox supports FHIR Bulk Data system-level `$export` with `_type=Practitioner,PractitionerRole,Organization,Location,HealthcareService` returning NDJSON, suitable for nightly snapshots a CDN or third party can mirror.

## MPF feed for Medicare Plan Finder

The CMS Medicare Plan Finder does not call the REST API above. It crawls a static feed: a manifest at a fixed URL, plus the FHIR `Bundle` files that manifest points to. Payerbox builds that feed from the same directory data and republishes it on a daily schedule, as an optional module of the [FHIR App Portal](../fhir-app-portal/README.md). Operators set it up in [Deploy](../run-payerbox/deploy.md#mpf-provider-directory-pipeline).

### What gets published

| Artifact | Shape |
|---|---|
| Manifest | `index.json`, a single object: `{"provider_urls": ["<absolute url>", …]}`. A file the manifest does not list is invisible to CMS. |
| Bundle files | `<ResourceType>-001.json`, `-002.json`, and so on. Each is a `Bundle` with `type: collection`, and every `entry` carries a `fullUrl` plus the resource. |
| Path | `<public base>/{contract}/{year}/{file}`. Files roll over at 1000 entries or 250 MiB, whichever comes first. |

Six resource types reach the feed, and the manifest lists them in dependency order: `InsurancePlan`, `Organization`, `Practitioner`, `PractitionerRole`, `Location`, `OrganizationAffiliation`. `HealthcareService` and `Endpoint` stay REST-only, so a consumer that needs services or electronic endpoints has to query the API rather than read the feed.

Each `Bundle` carries the run's generation timestamp in `meta.lastUpdated`, while every resource inside keeps the `meta.lastUpdated` it has in the FHIR engine. CMS tracks change per resource, so preserving the resource-level value is what makes an unchanged provider read as unchanged.

### Scope

The feed is not the whole directory. It carries the plans and networks the deployment declares in scope, and everything the graph pulls in with them: the affiliations and practitioner roles attached to those networks, the facility organizations those affiliations point at, and the practitioners and locations those roles reach. Everything else stays out. The in-scope plan and network ids are set per deployment in the Admin Portal, not baked into the image.

### Cadence and the year segment

CMS registers one URL per contract and calendar year, and crawls it daily with conditional requests, so an unchanged directory costs one round trip per file. Publish one run per day per contract. Around open enrollment, when both the current and next plan year are live, run a second sync with the next year to publish both concurrently.

### Choosing a path

| Path | When |
|---|---|
| Prebuilt pipeline | The published feed matches the six resource types and the scope model above. Configuration is buckets, credentials, and the in-scope ids. |
| Custom export flow | Different resource types, a different scope model, or post-processing between the export and the publish. Reuses the same `$export`, client, policy, and storage setup; a runnable example lives in the [Aidbox examples repository](https://github.com/Aidbox/examples). |

Endpoint contracts, status codes, and the settings API: [MPF Endpoints](../api-reference/operations/mpf-pipeline-api.md).
