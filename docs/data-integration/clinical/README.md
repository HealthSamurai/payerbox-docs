---
description: >-
  The 24 clinical CSV files, by USCDI v3.1 data class and the US Core 6.1.0
  profile each becomes.
---

# Clinical Data

| # | File | USCDI v3.1 data class | US Core 6.1.0 target profile(s) |
|---|---|---|---|
| 1 | `patients.csv` | [Patient Demographics](patient-demographics.md#patients-csv) | Patient (+ race, ethnicity, sex, tribal extensions) |
| 2 | `related_persons.csv` | [Patient Demographics (Related Person)](patient-demographics.md#related-persons-csv) | RelatedPerson |
| 3 | `practitioners.csv` | Care Team Members (ref), may come from [Provider Directory](../provider-directory/README.md) | Practitioner; PractitionerRole |
| 4 | `organizations.csv` | Care Team / Provenance (ref), may come from [Provider Directory](../provider-directory/README.md) | Organization |
| 5 | `locations.csv` | Encounter (ref), may come from [Provider Directory](../provider-directory/README.md) | Location |
| 6 | `allergies.csv` | Allergies and Intolerances | AllergyIntolerance |
| 7 | `conditions.csv` | Problems, Encounter Diagnosis, Health Concerns, SDOH | Condition (Problems/Health-Concerns + Encounter-Diagnosis) |
| 8 | `medications.csv` | Medications | MedicationRequest (+ Medication) |
| 9 | `medication_dispenses.csv` | Medications (Fill Status) | MedicationDispense |
| 10 | `immunizations.csv` | Immunizations | Immunization |
| 11 | `procedures.csv` | Procedures | Procedure |
| 12 | `service_requests.csv` | Procedures (Referral), SDOH Interventions | ServiceRequest |
| 13 | `encounters.csv` | Encounter Information | Encounter |
| 14 | `care_team.csv` | Care Team Members | CareTeam |
| 15 | `care_plans.csv` | Assessment and Plan of Treatment | CarePlan |
| 16 | `goals.csv` | Goals | Goal |
| 17 | `coverage.csv` | [Health Insurance Information](health-insurance.md#coverage-csv) | Coverage |
| 18 | `documents.csv` | Clinical Notes | DocumentReference |
| 19 | `diagnostic_reports.csv` | Clinical Notes, Laboratory, Diagnostic Imaging (report level) | DiagnosticReport (Lab + Report/Note) |
| 20 | `devices.csv` | Unique Device Identifier(s) | Implantable Device |
| 21 | `vital_signs.csv` | Vital Signs | Observation (Vital Signs family) |
| 22 | `labs.csv` | Laboratory | Observation (Lab Result) + Specimen |
| 23 | `social_history.csv` | Health Status/Assessments (Smoking, Pregnancy) + Patient Demographics (Occupation) | Observation (Social History profiles) |
| 24 | `clinical_observations.csv` | Clinical Tests, Diagnostic Imaging (result), Health Status/Assessments, Screening/SDOH | Observation (Clinical Result / Screening Assessment / Simple) |
