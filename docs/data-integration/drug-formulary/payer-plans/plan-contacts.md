---
description: >-
  Columns for payer plan contacts, mapped to the contact element of the US Drug Formulary STU 2.1.0 Payer Insurance Plan profile: one row per plan contact.
---

# Plan Contacts

## Datasets

Part of the [Payer Plans](README.md) group of the [Drug Formulary](../README.md) feed, built to [Da Vinci PDex US Drug Formulary STU 2.1.0](https://hl7.org/fhir/us/davinci-drug-formulary/STU2.1/). The feed's data conventions apply.

| Dataset | US Drug Formulary STU 2.1.0 target element |
|---|---|
| [`plan_contacts`](#plan_contacts) | `InsurancePlan.contact` of the [Payer Insurance Plan](https://hl7.org/fhir/us/davinci-drug-formulary/STU2.1/StructureDefinition-usdf-PayerInsurancePlan.html) |

## plan_contacts

One row per contact a plan publishes: the member services line, the marketing site, the benefit summary, the printable formulary, a billing or press office. A plan has several, so they are rows here rather than columns on [`payer_plans`](README.md). Each row becomes one `contact` entry on the plan's InsurancePlan.

{% file src="../../../assets/data-integration/plan_contacts.bcd881a6.csv" %}
plan_contacts.csv Data template with example rows
{% endfile %}

| Column | Required | Format / values | Example |
|---|---|---|---|
| `contact_id` | Yes | your stable key for the contact | `CT-DSNP-MEMBERS` |
| `plan_id` | Yes | key from `payer_plans` | `PLAN-DSNP` |
| `contact_purpose` | Yes | see [Purposes](#purposes) | `PATINF` |
| `contact_name` | Recommended | text; the name of the office, site or document | `Member Services` |
| `phone` | If available | 10 digits; several `;`-separated, up to three | `8885551002;8885551099` |
| `fax` | If available | 10 digits; several `;`-separated, up to two | |
| `email` | If available | email addresses, `;`-separated, up to two | `members@example.org` |
| `url` | If available | web addresses, `;`-separated, up to three | `https://example.org/plans/dsnp` |
| `address_line1` | If available | text | `123 Main St` |
| `address_line2` | If available | text | |
| `city` | If available | text | `Anytown` |
| `state` | If available | 2-letter USPS | `NY` |
| `zip` | If available | 5 digits, as a string | `12345` |
| `is_deleted` | If retracting | `true` drops the contact from the plan | `true` |

- A row needs a `contact_name` or at least one of `phone`, `fax`, `email`, `url`; otherwise it describes nothing and is rejected. A `contact_purpose` outside the list drops the contact and is reported; a phone that is not ten digits is reported and left off. `contact_name` becomes the contact's name text, each value in the telecom columns one telecom entry of its system, so a contact may list several numbers, and the address columns the contact's address.
- The IG expects three document contacts on every drug plan: the marketing page, the benefit summary and the printable formulary. Members' apps look for them by purpose, so send each as its own row with a `url`.
- Not collected: the contact's structured name parts (`family`, `given`, `prefix`, `suffix`); the profile marks only `name.text` must-support.
- Several rows may share a purpose, for instance two member lines. They all become contacts; the profile does not rank them.

### Purposes

`contact_purpose` is bound to [PlanContactTypeVS](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/davinci-drug-formulary/ValueSet/PlanContactTypeVS&server=https://tx.health-samurai.io/fhir), which joins the generic FHIR contact types with three the Formulary IG adds.

| Value | Contact is | Defined by |
|---|---|---|
| `PATINF` | member information, the member services line | FHIR contact entity type |
| `MARKETING` | the plan's marketing information page | Formulary IG |
| `SUMMARY` | the plan's summary of drug benefits | Formulary IG |
| `FORMULARY` | the plan's printable formulary | Formulary IG |
| `BILL` | billing | FHIR contact entity type |
| `ADMIN` | administrative | FHIR contact entity type |
| `HR` | human resources | FHIR contact entity type |
| `PAYOR` | payor | FHIR contact entity type |
| `PRESS` | press | FHIR contact entity type |

These resources are served by [Patient Access](../../../interop-apis/patient-access.md).
