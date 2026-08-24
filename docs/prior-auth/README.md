# Prior Auth (ePA) APIs

![Prior Authorization flow, three rows for the three IGs. CRD: the EHR's CDS Hooks client calls Payerbox's CRD service on any of the four supported hooks, and the service forwards to the health plan's decision service for coverage rules. DTR: the EHR launches the DTR app via SMART App Launch, and Payerbox serves the Questionnaire with its FHIRPath prefill expressions. PAS: the EHR's PAS client submits the Claim Bundle to Payerbox's PAS endpoint, which validates it and forwards it to the plan's UM system; the decision lands on the ClaimResponse, which the EHR reads through $inquire or a Subscription notification.](../../assets/prior-auth/prior-auth-flow.svg)

Da Vinci electronic Prior Authorization stack. [CMS-0057-F](../compliance/cms-0057.md) requires a FHIR-based Prior Authorization API by January 1, 2027. Payerbox implements the Da Vinci CRD, DTR, and PAS Implementation Guides.

| Page | IG | Role |
|---|---|---|
| [CRD](crd.md) | Da Vinci CRD | Discover whether prior authorization is required at the point of order |
| [DTR](dtr/README.md) | Da Vinci DTR | Collect required documentation via questionnaires driven by CQL |
| [PAS](pas.md) | Da Vinci PAS | Submit the prior authorization request and receive the response |

The three IGs compose: CRD identifies the rule, DTR collects the evidence, PAS submits the request.
