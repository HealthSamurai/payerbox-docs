---
description: >-
  Columns for documents and diagnostic_reports, mapped from the USCDI v3.1
  Clinical Notes data class to US Core 6.1.0 FHIR.
---

# Clinical Notes

## Datasets

[US Core 6.1.0](https://hl7.org/fhir/us/core/STU6.1/) maps each [USCDI](https://isp.healthit.gov/united-states-core-data-interoperability-uscdi#uscdi-v3-1) data element onto a FHIR element.

| Dataset | US Core 6.1.0 target profile(s) |
|---|---|
| [`documents`](#documents) | [US Core DocumentReference](https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-documentreference.html) |
| [`diagnostic_reports`](#diagnostic-reports) | [US Core DiagnosticReport Lab](https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-diagnosticreport-lab.html), [US Core DiagnosticReport Note](https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-diagnosticreport-note.html) |

Notes and reports are the one part of the feed that is not only CSV: the document itself travels as a file in the delivery, and the CSV row points at it.

```
delivery-2026-08-19/
  csv/
    documents.csv
    diagnostic_reports.csv
  attachments/
    DOC-0001.pdf
    DR-0771.pdf
```

`attachment_file` holds the path relative to the delivery root. The folder name and nesting are yours to choose. Put no patient details in file or folder names.

## documents

One row per note. The note itself is the file; this row is its index card.

{% file src="../../assets/data-integration/documents.56055b45.csv" %}
documents.csv Data template with example rows
{% endfile %}

| Column | Required | Format / values | Example |
|---|---|---|---|
| `record_id` | Yes | your stable key for this note | `DOC-0001` |
| `patient_identifier` | Yes | patient key | `MRN-4471903` |
| `type_code` | Yes | LOINC note type, e.g. `11488-4` consult, `18842-5` discharge summary, `34117-2` history and physical, `11506-3` progress note [US Core DocumentReference Type](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/core/ValueSet/us-core-documentreference-type) | `11488-4` |
| `attachment_file` | Yes | path relative to the delivery root | `attachments/DOC-0001.pdf` |
| `document_date` | Recommended | datetime | `2026-04-18T10:00:00-04:00` |
| `author_npi` | Recommended | 10 digits, Luhn-valid over the `80840` prefix | `9999999995` |
| `encounter_id` | If applicable | `encounters` key | `ENC-9912` |
| `is_deleted` | If retracting | `true` retracts this row | `true` |

- `type_code` has a required binding, so the note type must come from that value set. It is large, but the four codes above cover most of what a payer holds.
- Payerbox sets the status to `current` and the category to `clinical-note`, and reads the attachment's content type and size from the stored file. None of those are columns.

## diagnostic_reports

One row per report. The individual results live in `labs` and `clinical_observations` and point back with `diagnostic_report_id`.

{% file src="../../assets/data-integration/diagnostic_reports.a059e996.csv" %}
diagnostic_reports.csv Data template with example rows
{% endfile %}

| Column | Required | Format / values | Example |
|---|---|---|---|
| `record_id` | Yes | your stable key for this report; result rows reference it | `DR-771` |
| `patient_identifier` | Yes | patient key | `MRN-4471903` |
| `report_kind` | Yes | `lab` or `note` | `lab` |
| `status` | Yes | `registered`, `partial`, `preliminary`, `final`, `amended`, `corrected`, `appended`, `cancelled`, `entered-in-error`, `unknown` [diagnostic-report-status](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/ValueSet/diagnostic-report-status%7C4.0.1) | `final` |
| `code` | Yes | LOINC, from the value set the `report_kind` profile binds, with `code_system` | `24323-8` lab, `39053-4` note |
| `category_code` | Recommended | `LAB`, `RAD` and the other v2-0074 service sections | `LAB` |
| `effective_datetime` | Recommended | datetime | `2026-04-18T08:40:00-04:00` |
| `issued` | If available | datetime | `2026-04-18T12:00:00-04:00` |
| `performer_npi` | If available | 10 digits, Luhn-valid over the `80840` prefix | `9999999979` |
| `attachment_file` | If available | path relative to the delivery root | `attachments/DR-0771.pdf` |
| `encounter_id` | If applicable | `encounters` key | `ENC-9912` |
| `is_deleted` | If retracting | `true` retracts this row | `true` |

- `report_kind` picks the profile: `lab` for a laboratory report, `note` for everything else, including radiology and pathology narratives. The two bind `code` to different value sets, so a lab code on a `note` row falls outside the binding and the reverse too. Both bindings are extensible, so the code is not rejected, but a wrong `report_kind` silently produces the wrong profile.
- `attachment_file` carries the narrative report as a file, the same way `documents` does. A lab report with structured results and no narrative needs none.
- This dataset also serves the Laboratory and Diagnostic Imaging data classes, not only Clinical Notes.

These resources are served by [Patient Access](../../interop-apis/patient-access.md), [Provider Access](../../interop-apis/provider-access.md), [Payer-to-Payer](../../interop-apis/payer-to-payer.md), and [Prior Auth](../../prior-auth/README.md).
