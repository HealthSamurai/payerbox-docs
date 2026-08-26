---
description: >-
  Columns for devices, mapped from the USCDI v3.1 Unique Device Identifier(s)
  data class to US Core 6.1.0 FHIR.
---

# Device

## Datasets

[US Core 6.1.0](https://hl7.org/fhir/us/core/STU6.1/) maps each [USCDI](https://isp.healthit.gov/united-states-core-data-interoperability-uscdi#uscdi-v3-1) element to FHIR.

| Dataset | US Core 6.1.0 target profile(s) |
|---|---|
| [`devices`](#devices) | [US Core Implantable Device](https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-implantable-device.html) |

## devices

Implantable devices carrying a Unique Device Identifier: a stent, a pacemaker, a joint prosthesis. One row per device per patient.

Durable medical equipment and supplies do not belong here. A wheelchair, a CPAP unit, or a box of test strips arrives as an HCPCS-coded line in [`procedures` or `service_requests`](README.md), because USCDI asks this data class only for a patient's implantable devices.

| Column | Required | Format / values | Example |
|---|---|---|---|
| `patient_identifier` | Yes | patient key | `MRN-4471903` |
| `udi_device_identifier` | Yes | DI portion of the UDI, digits [FDA UDI](https://www.fda.gov/medical-devices/unique-device-identification-system-udi-system) | `00643169007222` |
| `device_type_code` | Yes | SNOMED CT device kind, with `device_type_system` [device-kind](https://hl7.org/fhir/R4/valueset-device-kind.html) | `468063009` Coated femoral stem prosthesis, modular |
| `udi_carrier_hrf` | Recommended | full UDI in human-readable form, as printed on the label | `(01)00643169007222(17)280101(10)LOT123(21)SN456` |
| `distinct_identifier` | If available | text, only for a human cell, tissue, or cellular and tissue-based product | `DI-77` |
| `lot_number` | If available | text | `LOT123` |
| `serial_number` | If available | text | `SN456` |
| `manufacture_date` | If available | datetime | `2026-01-15` |
| `expiration_date` | If available | datetime | `2031-01-15` |

- The UDI is the whole point of the row. If your source holds no device identifier, there is nothing for this file to carry, and the device belongs in the clinical record only as the procedure that implanted it.
- Send `udi_device_identifier` whenever you send `udi_carrier_hrf`. A row carrying the human-readable form without the device identifier is rejected.
- `lot_number`, `serial_number`, `manufacture_date`, and `expiration_date` are Production Identifier parts of the UDI. If you parse them out of `udi_carrier_hrf`, send both the parsed columns and the original string.

These resources are served by [Patient Access](../../interop-apis/patient-access.md), [Provider Access](../../interop-apis/provider-access.md), and [Payer-to-Payer](../../interop-apis/payer-to-payer.md).
