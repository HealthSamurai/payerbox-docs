# DTR

Da Vinci Documentation Templates and Rules. DTR uses FHIR Questionnaire (with CQL-driven prefill and skip logic) to collect the clinical documentation a payer needs to decide a prior authorization.

Payerbox supports two implementation paths.

| Page | Use case |
|---|---|
| [Aidbox as Questionnaire storage](aidbox-questionnaire-package.md) | Server-side packaging of Questionnaire and ValueSet bundles for client-side rendering |
| [DTR SMART App](dtr-smart-app.md) | EHR-launched SMART on FHIR app that renders the questionnaire and runs CQL client-side |

CQL execution happens on the client (the DTR SMART app or another DTR-aware client), not on Aidbox. Aidbox stores Questionnaire, ValueSet, and Library resources; [`$questionnaire-package`](../../api-reference/operations/questionnaire-package.md) returns a Bundle of the Questionnaire with its expanded ValueSets — referenced CQL Libraries are not currently included in the bundle.

Both paths produce a QuestionnaireResponse that becomes input to [PAS](../pas.md).
