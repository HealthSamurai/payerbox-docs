# Prior Auth (ePA) APIs

![Prior Authorization flow: three column groups — Provider EHR (CDS Hooks client, SMART on FHIR app, PAS client) on the left, Payerbox (CRD CDS service, SDC questionnaire, PAS endpoint) in the center, Health Plan (data sources, UM system) on the right — with three stage arrows labeled CRD, DTR, PAS between the groups.](../../assets/prior-auth/prior-auth-flow.svg)

Da Vinci electronic Prior Authorization stack. [CMS-0057-F](../compliance/cms-0057.md) requires a FHIR-based Prior Authorization API by January 1, 2027. Payerbox implements the Da Vinci CRD, DTR, and PAS Implementation Guides.

| Page | IG | Role |
|---|---|---|
| [CRD](crd.md) | Da Vinci CRD | Discover whether prior authorization is required at the point of order |
| [DTR](dtr/README.md) | Da Vinci DTR | Collect required documentation via questionnaires driven by CQL |
| [PAS](pas.md) | Da Vinci PAS | Submit the prior authorization request and receive the response |

The three IGs compose: CRD identifies the rule, DTR collects the evidence, PAS submits the request.
