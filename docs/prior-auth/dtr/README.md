# DTR

Da Vinci Documentation Templates and Rules. DTR uses FHIR Questionnaire (with FHIRPath-driven prefill and skip logic) to collect the clinical documentation a payer needs to decide a prior authorization.

Payerbox supports two implementation paths.

| Page | Use case |
|---|---|
| [Aidbox as Questionnaire storage](aidbox-questionnaire-package.md) | Server-side packaging of Questionnaire and ValueSet bundles for client-side rendering |
| [DTR SMART App](dtr-smart-app.md) | EHR-launched SMART on FHIR app that renders and prefills the questionnaire |

Prefill is hybrid. Aidbox stores the Questionnaire and ValueSet resources; [`$questionnaire-package`](../../api-reference/operations/questionnaire-package.md) returns a Bundle of the Questionnaire, its expanded ValueSets, and a draft QuestionnaireResponse the server has already populated from the `coverage` and `order` launch-context parameters. The DTR SMART app then runs its own populate pass against the EHR context (patient, encounter, observations) and merges the result into the server-populated draft. On both sides, population evaluates the questionnaire's FHIRPath `initialExpression`s (SDC populate) — there is no CQL engine.

Both paths produce a QuestionnaireResponse that becomes input to [PAS](../pas.md).
