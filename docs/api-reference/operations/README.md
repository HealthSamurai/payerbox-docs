# Operations

FHIR operations and CDS Hooks endpoints exposed by Payerbox. The general REST surface is documented separately from named operations defined by the Da Vinci IGs.

| Operation | Used by | IG |
|---|---|---|
| [FHIR RESTful API](fhir-restful-api.md) | All API surfaces | FHIR R4 base |
| [`$provider-member-match`](provider-member-match.md) | Provider Access | Da Vinci PDex |
| [`$bulk-member-match` (sync/async)](bulk-member-match.md) | Payer-to-Payer | Da Vinci PDex |
| [`$davinci-data-export`](davinci-data-export.md) | Provider Access, Payer-to-Payer | Da Vinci PDex |
| [`$questionnaire-package`](questionnaire-package.md) | DTR | Da Vinci DTR |
| [`Claim/$submit`](claim-submit.md) | Prior Auth (PAS) | Da Vinci PAS |
| [`Claim/$inquire`](claim-inquire.md) | Prior Auth (PAS) | Da Vinci PAS |
| [`$submit-attachment`](submit-attachment.md) | Prior Auth (PAS attachments) | Da Vinci CDex |
| [CDS Services Discovery](cds-services-discovery.md) | CRD | CDS Hooks |
| [`order-sign`](cds-hook-order-sign.md) | CRD | Da Vinci CRD |
| [`order-select`](cds-hook-order-select.md) | CRD | Da Vinci CRD |
| [`order-dispatch`](cds-hook-order-dispatch.md) | CRD | Da Vinci CRD |
| [`appointment-book`](cds-hook-appointment-book.md) | CRD | Da Vinci CRD |
