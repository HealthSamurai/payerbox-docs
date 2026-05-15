# Resources

FHIR resources Payerbox exposes, tagged by the API surface(s) that use them.

The authoritative list per deployment is in the [Capability Statement](capability-statement.md) (`/fhir/metadata`). The table below is the design intent across surfaces.

## Member and coverage

| Resource | Patient Access | Provider Access | Payer-to-Payer | Provider Directory | Prior Auth |
|---|:---:|:---:|:---:|:---:|:---:|
| Patient | ✓ | ✓ | ✓ |  | ✓ |
| Coverage | ✓ | ✓ | ✓ |  | ✓ |
| RelatedPerson | ✓ | ✓ | ✓ |  |  |
| Group |  | ✓ | ✓ |  |  |
| Consent | ✓ | ✓ | ✓ |  |  |

## Clinical (US Core)

| Resource | Patient Access | Provider Access | Payer-to-Payer | Prior Auth |
|---|:---:|:---:|:---:|:---:|
| AllergyIntolerance | ✓ | ✓ | ✓ | ✓ |
| Condition | ✓ | ✓ | ✓ | ✓ |
| Observation | ✓ | ✓ | ✓ | ✓ |
| MedicationRequest | ✓ | ✓ | ✓ | ✓ |
| MedicationStatement | ✓ | ✓ | ✓ |  |
| Procedure | ✓ | ✓ | ✓ |  |
| DiagnosticReport | ✓ | ✓ | ✓ |  |
| Immunization | ✓ | ✓ | ✓ |  |
| CarePlan | ✓ | ✓ | ✓ |  |
| Goal | ✓ | ✓ | ✓ |  |
| Encounter | ✓ | ✓ | ✓ | ✓ |
| ServiceRequest | ✓ | ✓ | ✓ | ✓ |
| DocumentReference | ✓ | ✓ | ✓ | ✓ |
| Device | ✓ | ✓ | ✓ |  |
| Location | ✓ | ✓ | ✓ | ✓ |

## Claims, EOB, prior auth

| Resource | Patient Access | Provider Access | Payer-to-Payer | Prior Auth |
|---|:---:|:---:|:---:|:---:|
| Claim | ✓ (PA only, from 2027) | ✓ | ✓ | ✓ |
| ClaimResponse | ✓ (PA only, from 2027) | ✓ | ✓ | ✓ |
| ExplanationOfBenefit | ✓ | ✓ (no remittance / cost-sharing) | ✓ (no remittance / cost-sharing) |  |
| Task |  | ✓ | ✓ | ✓ |

## Provider directory (Plan Net)

| Resource | Provider Directory | Patient Access (MA-PD) |
|---|:---:|:---:|
| Practitioner | ✓ |  |
| PractitionerRole | ✓ |  |
| Organization | ✓ |  |
| OrganizationAffiliation | ✓ |  |
| Location | ✓ |  |
| HealthcareService | ✓ |  |
| InsurancePlan | ✓ | ✓ |
| Endpoint | ✓ |  |

## Formulary (MA-PD only)

| Resource | Patient Access (MA-PD) |
|---|:---:|
| MedicationKnowledge | ✓ |
| InsurancePlan | ✓ (with formulary extension) |

## DTR (Questionnaire workflow)

| Resource | Used by |
|---|---|
| Questionnaire | DTR `$questionnaire-package` |
| QuestionnaireResponse | DTR completion → PAS submission |
| Library | DTR CQL bundle |
| ValueSet, CodeSystem | DTR Questionnaire constraints |

## Audit and operations

| Resource | Used by |
|---|---|
| AuditEvent | BALP audit log; produced for every member-data access |
| OperationOutcome | Error responses across all surfaces |
| Subscription | Optional — for notifications |
| Bundle | Transaction, batch, search results, and PAS Request/Response |

## Profile conformance

Each resource above is constrained by the relevant IG profile when interacting with a specific surface. For example, `Patient` on Patient Access conforms to `us-core-patient`; `Practitioner` on Provider Directory conforms to `plannet-Practitioner`.

The CapabilityStatement at `<base>/fhir/metadata` lists the exact `supportedProfile` for each resource per surface.

