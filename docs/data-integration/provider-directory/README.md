---
description: >-
  Columns for the provider directory feed, mapped to PDex Plan-Net STU 1.2.0.
---

# Provider Directory

## Datasets

Built to [Plan-Net STU 1.2.0](https://hl7.org/fhir/us/davinci-pdex-plan-net/STU1.2/).

| Dataset | Plan-Net STU 1.2.0 target profile(s) |
|---|---|
| [`providers`](#providers) | [Practitioner](https://hl7.org/fhir/us/davinci-pdex-plan-net/STU1.2/StructureDefinition-plannet-Practitioner.html), [PractitionerRole](https://hl7.org/fhir/us/davinci-pdex-plan-net/STU1.2/StructureDefinition-plannet-PractitionerRole.html), [Location](https://hl7.org/fhir/us/davinci-pdex-plan-net/STU1.2/StructureDefinition-plannet-Location.html) |
| [`facilities`](#facilities) | [Organization](https://hl7.org/fhir/us/davinci-pdex-plan-net/STU1.2/StructureDefinition-plannet-Organization.html), [OrganizationAffiliation](https://hl7.org/fhir/us/davinci-pdex-plan-net/STU1.2/StructureDefinition-plannet-OrganizationAffiliation.html), [Location](https://hl7.org/fhir/us/davinci-pdex-plan-net/STU1.2/StructureDefinition-plannet-Location.html) |
| [`networks`](#networks) | [Network](https://hl7.org/fhir/us/davinci-pdex-plan-net/STU1.2/StructureDefinition-plannet-Network.html) |
| [`plans`](#plans) | [InsurancePlan](https://hl7.org/fhir/us/davinci-pdex-plan-net/STU1.2/StructureDefinition-plannet-InsurancePlan.html) |

## providers

One row per unique NPI, practice location, plan and specialty. A provider at two locations in two plans produces several rows.

| Column | Required | Format / values | Example |
|---|---|---|---|
| `npi` | Yes | 10 digits | `1234567893` |
| `first_name` | Yes | text | `Jane` |
| `last_name` | Yes | text | `Smith` |
| `middle_name` | No | text | `G` |
| `name_prefix` | No | Mr. / Mrs. / Ms. / Dr. | `Dr.` |
| `name_suffix` | No | Jr. / Sr. / II / III | `Jr.` |
| `sex` | No | `Male`, `Female` | `Female` |
| `languages` | Recommended | BCP 47 or English name, `;`-separated. Add `:level` per language for Plan-Net proficiency | `en;es` |
| `specialty_nucc` | Yes | NUCC taxonomy code(s), `;`-separated [Healthcare Provider Taxonomy](https://vsac.nlm.nih.gov/valueset/2.16.840.1.114222.4.11.1066/expansion) | `207RI0200X` |
| `provider_role` | Recommended | `physician`, `NP`, `PA`, `nurse`, `dentist` [PractitionerRoleVS](https://hl7.org/fhir/us/davinci-pdex-plan-net/STU1.2/ValueSet-PractitionerRoleVS.html) | `physician` |
| `board_certification` | If available | qualification code or name | `Board Certified, Cardiology` |
| `plan_id` | Yes | key from `plans`; one plan per row | `PLAN-DSNP` |
| `network_id` | Yes | key from `networks` | `NET-001` |
| `organization_npi` | If applicable | 10 digits; blank for a solo practitioner with no group NPI | `1407006835` |
| `accepting_new_patients` | Recommended | `accepting`, `not-accepting`, `existing-only`, `existing+family` [AcceptingPatientsVS](https://hl7.org/fhir/us/davinci-pdex-plan-net/STU1.2/ValueSet-AcceptingPatientsVS.html) | `accepting` |
| `location_name` | Yes | text; Plan-Net requires a name on every location | `Riverdale Family Practice` |
| `address_line1` | Yes | text | `225 Broadway` |
| `address_line2` | No | text | `Suite 120` |
| `city` | Yes | text | `New York` |
| `state` | Yes | 2-letter USPS | `NY` |
| `zip` | Yes | 5 digits, as a string; required for CMS radius search | `10007` |
| `county` | If available | text | `Bronx` |
| `latitude` | If available | decimal, WGS84 | `40.7127` |
| `longitude` | If available | decimal, WGS84 | `-74.0059` |
| `phone` | Yes | 10 digits | `2125551212` |
| `location_type` | Recommended | `office`, `clinic`, `hospital`, `pharmacy`, `urgent-care` [v3-RoleCode](https://terminology.hl7.org/CodeSystem-v3-RoleCode.html) | `office` |
| `hours_of_operation` | If available | `day open-close`, `;`-separated | `mon 09:00-17:00;tue 09:00-17:00` |

## facilities

One row per facility NPI, plan and network.

| Column | Required | Format / values | Example |
|---|---|---|---|
| `npi` | Yes | 10 digits | `1407006835` |
| `facility_name` | Yes | text | `Example Hospital` |
| `facility_type_nucc` | Yes | NUCC organization taxonomy code(s), `;`-separated [OrgTypeVS](https://hl7.org/fhir/us/davinci-pdex-plan-net/STU1.2/ValueSet-OrgTypeVS.html) | `282N00000X` |
| `affiliation_type` | Recommended | `provider`, `pharmacy`, `lab`, `dme`, `urgent`, `hospice` [OrganizationAffiliationRoleVS](https://hl7.org/fhir/us/davinci-pdex-plan-net/STU1.2/ValueSet-OrganizationAffiliationRoleVS.html) | `provider` |
| `parent_org_npi` | If available | 10 digits, if part of a larger system | `1234567893` |
| `plan_id` | Yes | key from `plans` | `PLAN-ISNP` |
| `network_id` | Yes | key from `networks` | `NET-002` |
| `ccn` | If Medicare-certified | 6 digits | `999999` |
| `ncpdp_id` | If a pharmacy | 7 digits | `9999999` |
| `location_name` | Recommended | text; defaults to `facility_name` if there is no distinct site name | `Example Hospital` |
| `address_line1` | Yes | text | `123 Park Ave` |
| `address_line2` | No | text | `Floor 3` |
| `city` | Yes | text | `Bronx` |
| `state` | Yes | 2-letter USPS | `NY` |
| `zip` | Yes | 5 digits, as a string | `10463` |
| `county` | If available | text | `Bronx` |
| `latitude` | If available | decimal, WGS84 | `40.8801` |
| `longitude` | If available | decimal, WGS84 | `-73.9100` |
| `phone` | Yes | 10 digits | `7185551212` |

- `ccn` and `ncpdp_id` identify the site itself. Send either where you have one: Payerbox keys the Location on it, and unlike an address it survives being reworded between extracts. Without one the address is the key, so send it the same way each time.

## networks

The authoritative list of networks, so `network_id` stays consistent across datasets. One row per network.

| Column | Required | Format / values | Example |
|---|---|---|---|
| `network_id` | Yes | the exact id used in provider and facility rows | `NET-001` |
| `network_name` | Yes | text | `North Region Health System` |

## plans

Defines each plan once, so provider and facility rows carry only `plan_id`. One row per plan.

| Column | Required | Format / values | Example |
|---|---|---|---|
| `plan_id` | Yes | the exact id used in provider and facility rows | `PLAN-DSNP` |
| `plan_name` | Yes | text | `Example Health D-SNP` |
| `plan_type` | Yes | `MA`, `MAPD`, `D-SNP`, `I-SNP`, `Medicaid`, `Commercial` | `D-SNP` |
| `line_of_business` | Recommended | code and/or label | `Medicare Advantage` |
| `plan_identifier` | If MA | `H#####-###-###`, contract-plan-segment; blank for non-MA plans | `H6776-001-000` |
| `contract_year` | If applicable | YYYY | `2027` |
| `network_id` | Yes | one or more keys from `networks`, `;`-separated | `NET-001;NET-002` |
| `owned_by_org_npi` | Yes | 10 digits, the plan sponsor | `1234567893` |
| `administered_by_org_npi` | Yes | 10 digits | `1234567893` |

These resources are served by the [Provider Directory API](../../interop-apis/provider-directory.md).
