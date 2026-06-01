# DTR

Da Vinci Documentation Templates and Rules. DTR uses FHIR Questionnaire (with FHIRPath-driven prefill and skip logic) to collect the clinical documentation a payer needs to decide a prior authorization.

Payerbox supports two implementation paths.

| Page | Use case |
|---|---|
| [Aidbox as Questionnaire storage](aidbox-questionnaire-package.md) | Server-side packaging of Questionnaire and ValueSet bundles for client-side rendering |
| [DTR SMART App](dtr-smart-app.md) | EHR-launched SMART on FHIR app that renders the questionnaire and prefills it client-side |

Prefill runs on the client (the DTR SMART app or another DTR-aware client), not on Aidbox: the questionnaire's FHIRPath `initialExpression`s are evaluated client-side (SDC `$populate`), with no CQL engine. Aidbox stores the Questionnaire and ValueSet resources; [`$questionnaire-package`](../../api-reference/operations/questionnaire-package.md) returns a Bundle of the Questionnaire with its expanded ValueSets.

Both paths produce a QuestionnaireResponse that becomes input to [PAS](../pas.md).
