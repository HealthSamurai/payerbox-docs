---
description: >-
  Columns for formulary contacts, mapped to the contact element of the US Drug Formulary STU 2.1.0 Formulary profile: one row per contact.
---

# Formulary Contacts

## Datasets

Part of the [Drug Formulary](README.md) feed, built to [Da Vinci PDex US Drug Formulary STU 2.1.0](https://hl7.org/fhir/us/davinci-drug-formulary/STU2.1/). The feed's data conventions apply.

| Dataset | US Drug Formulary STU 2.1.0 target element | Cardinality |
|---|---|---|
| [`formulary_contacts`](#formulary_contacts) | `contact` of the [Formulary](https://hl7.org/fhir/us/davinci-drug-formulary/STU2.1/StructureDefinition-usdf-Formulary.html) | 0..* |

## formulary_contacts

One row per contact a formulary publishes, most often the printable formulary document. The columns are the same as [`plan_contacts`](payer-plans/plan-contacts.md), keyed to a formulary instead of a plan.

{% file src="../../assets/data-integration/formulary_contacts.b4214da9.csv" %}
formulary_contacts.csv Data template with example rows
{% endfile %}

| Column | Required | Format / values | Example |
|---|---|---|---|
| `contact_id` | Yes | your stable key for the contact | `CT-FORM-2027-A-PDF` |
| `formulary_id` | Yes | key from `formularies` | `FORM-2027-A` |
| `contact_purpose` | Yes | as in [plan contacts](payer-plans/plan-contacts.md#purposes); `FORMULARY` for the printable list | `FORMULARY` |
| `contact_name` | Recommended | text; the name of the office, site or document | `2027 Part D formulary` |
| `phone` | If available | 10 digits; several `;`-separated, up to three | |
| `fax` | If available | 10 digits; several `;`-separated, up to two | |
| `email` | If available | email addresses, `;`-separated, up to two | |
| `url` | If available | web addresses, `;`-separated, up to three | `https://example.org/formularies/form-2027-a.pdf` |
| `address_line1` | If available | text | |
| `address_line2` | If available | text | |
| `city` | If available | text | |
| `state` | If available | 2-letter USPS | |
| `zip` | If available | 5 digits, as a string | |
| `is_deleted` | If retracting | `true` drops the contact from the formulary | `true` |

- A row needs a `contact_name` or at least one telecom value; otherwise it is rejected. A `contact_purpose` outside the list drops the contact and is reported; a phone that is not ten digits is reported and left off.
- The IG expects the printed formulary to be reachable from the resource, for coverage rules the structured formulary items cannot express. Send it as a `FORMULARY` contact with a `url`.

These resources are served by [Patient Access](../../interop-apis/patient-access.md).
