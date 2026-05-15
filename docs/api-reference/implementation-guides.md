# Implementation Guides

Payerbox implements the HL7 FHIR R4 base specification and a set of Implementation Guides recommended by CMS for CMS-0057-F and CMS-9115-F compliance.

CMS does not lock IG versions in regulation. The versions below match the [CMS APIs and Implementation Guides page](https://www.cms.gov/priorities/burden-reduction/overview/interoperability/implementation-guides-standards/application-programming-interfaces-apis-relevant-standards-implementation-guides-igs) as of this release.

## Base

| Standard | Version | Spec |
|---|---|---|
| HL7 FHIR | R4 (4.0.1) | [hl7.org/fhir/R4](https://hl7.org/fhir/R4/) |

## Authorization

| IG | Version | Spec | Used by |
|---|---|---|---|
| SMART App Launch | 2.2.0 | [hl7.org/fhir/smart-app-launch/STU2.2](https://hl7.org/fhir/smart-app-launch/STU2.2/) | Patient Access (member-authorized apps) |
| SMART Backend Services Authorization | 2.2.0 | [hl7.org/fhir/smart-app-launch/STU2.2/backend-services.html](https://hl7.org/fhir/smart-app-launch/STU2.2/backend-services.html) | Provider Access, Payer-to-Payer, PAS |

## Clinical data

| IG | Version | Spec | Used by |
|---|---|---|---|
| US Core | 6.1.0 | [hl7.org/fhir/us/core/STU6.1](https://hl7.org/fhir/us/core/STU6.1/) | USCDI v3 alignment, all clinical APIs |

## Patient Access and Payer-to-Payer

| IG | Version | Spec | Used by |
|---|---|---|---|
| CARIN Consumer-Directed Payer Data Exchange (Blue Button) | STU 2.0.0 | [hl7.org/fhir/us/carin-bb/STU2](https://hl7.org/fhir/us/carin-bb/STU2/) | Patient Access — claims and encounters |
| Da Vinci PDex | STU 2.1.0 | [hl7.org/fhir/us/davinci-pdex/STU2.1](https://hl7.org/fhir/us/davinci-pdex/STU2.1/) | Patient Access — clinical, prior-auth data; Provider Access; Payer-to-Payer |
| Da Vinci PDex US Drug Formulary | STU 2.0.1 | [hl7.org/fhir/us/Davinci-drug-formulary/STU2](https://hl7.org/fhir/us/Davinci-drug-formulary/STU2/) | Patient Access — formulary (MA-PD) |

## Provider Directory

| IG | Version | Spec | Used by |
|---|---|---|---|
| Da Vinci PDex Plan Net | STU 1.1.0 | [hl7.org/fhir/us/davinci-pdex-plan-net/STU1.1](https://hl7.org/fhir/us/davinci-pdex-plan-net/STU1.1/) | Provider Directory |

## Bulk export

| IG | Version | Spec | Used by |
|---|---|---|---|
| HL7 FHIR Bulk Data Access | 2.0.0 | [hl7.org/fhir/uv/bulkdata/STU2](https://hl7.org/fhir/uv/bulkdata/STU2/) | Provider Access, Payer-to-Payer (`Group/$export`) |

## Prior Authorization (ePA)

CMS recommends these IGs but does not mandate them. The regulation requires functional behavior; the IGs are the industry path of least resistance.

| IG | Version | Spec | Used by |
|---|---|---|---|
| Da Vinci Coverage Requirements Discovery (CRD) | STU 2.0.1 | [hl7.org/fhir/us/davinci-crd/STU2.0.1](https://hl7.org/fhir/us/davinci-crd/STU2.0.1/) | CRD |
| Da Vinci Documentation Templates and Rules (DTR) | STU 2.0.1 | [hl7.org/fhir/us/davinci-dtr/STU2](https://hl7.org/fhir/us/davinci-dtr/STU2/) | DTR |
| Da Vinci Prior Authorization Support (PAS) | STU 2.1.0 | [hl7.org/fhir/us/davinci-pas/STU2.1](https://hl7.org/fhir/us/davinci-pas/STU2.1/) | PAS |
| Da Vinci Clinical Data Exchange (CDex) | STU 2.1.0 | [hl7.org/fhir/us/davinci-cdex/STU2](https://hl7.org/fhir/us/davinci-cdex/STU2/) | PAS attachments (`$submit-attachment`) |
| CDS Hooks | 2.0 | [cds-hooks.hl7.org/2.0](https://cds-hooks.hl7.org/2.0/) | CRD (transport) |

## Version pinning policy

Payerbox aligns by default with the versions CMS lists as recommended. The bundled IG packages are loaded via Aidbox's `BOX_BOOTSTRAP_FHIR_PACKAGES`; customers who need to support an alternate IG version for a specific use case can change that list at deploy time.

