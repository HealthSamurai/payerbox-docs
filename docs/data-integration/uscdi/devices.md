---
description: >-
  Columns for implantable devices, mapped from the USCDI v3.1 Unique Device
  Identifier(s) data class to US Core 6.1.0 FHIR.
---

# Unique Device Identifiers

## Datasets

[US Core 6.1.0](https://hl7.org/fhir/us/core/STU6.1/) maps each [USCDI](https://isp.healthit.gov/united-states-core-data-interoperability-uscdi#uscdi-v3-1) data element onto a FHIR element.

| Dataset | US Core 6.1.0 target profile(s) |
|---|---|
| [`devices`](#devices) | [US Core Implantable Device](https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-implantable-device.html) |

## devices

One row per implanted device per patient. The USCDI data class covers implantable devices only — other equipment does not belong in this file.

{% file src="../../assets/data-integration/devices.csv" %}
devices.csv Data template with example rows
{% endfile %}

| Column | Required | Format / values | Example |
|---|---|---|---|
| `patient_identifier` | Yes | patient key | `MRN-4471903` |
| `udi_device_identifier` | Yes | DI portion of the UDI | `00643169007222` |
| `udi_carrier_hrf` | Recommended | full UDI barcode string, human-readable form | `(01)00643169007222(17)…` |
| `device_type_code` | Yes | SNOMED CT code, with `device_type_system` [device-kind](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/ValueSet/device-kind%7C4.0.1) | `468063009` Coated femoral stem prosthesis, modular |
| `distinct_identifier` | If available | text | `456` |
| `lot_number` | If available | text | `543211` |
| `serial_number` | If available | text | `842026` |
| `manufacture_date` | If available | datetime | `2019-03-01` |
| `expiration_date` | If available | datetime | `2029-03-01` |

- `udi_device_identifier` is the device identifier (DI): the fixed portion of the UDI that names the make and model. It is the element this data class exists for, so a row without it fails the USCDI intent even though FHIR itself would accept one.
- `udi_carrier_hrf` is the full barcode string in human-readable form: the DI plus the production identifiers — lot, serial, expiration and manufacture dates. US Core exchanges the HRF, and the FDA AccessGUDID and Parse UDI APIs can decompose it. Send it whole when you have it; if your source already stores the parsed parts, the production-identifier columns carry them individually.
- `device_type_code` is SNOMED CT (extensible binding). Send `device_type_system` as `http://snomed.info/sct`.
- `distinct_identifier` applies to human cell and tissue products (HCT/P), where regulation requires a distinct identification code in place of a serial number.

These resources are served by [Patient Access](../../interop-apis/patient-access.md), [Provider Access](../../interop-apis/provider-access.md), [Payer-to-Payer](../../interop-apis/payer-to-payer.md), and [Prior Auth](../../prior-auth/README.md).
