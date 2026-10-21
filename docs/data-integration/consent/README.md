---
description: >-
  How a member's Provider Access opt-out and Payer-to-Payer opt-in reach
  Payerbox: as flat files Payerbox turns into FHIR, or as FHIR bundles the
  plan's own system writes.
---

# Member Consent

A member **opts out** of [Provider Access](../../interop-apis/provider-access.md) and **opts in** to [Payer-to-Payer](../../interop-apis/payer-to-payer.md). Each decision becomes one FHIR Consent that the APIs read: the [PDex Provider Consent](https://hl7.org/fhir/us/davinci-pdex/STU2.2/StructureDefinition-pdex-provider-consent.html) for the opt-out, the [HRex Consent](https://hl7.org/fhir/us/davinci-hrex/STU1.1/StructureDefinition-hrex-consent.html) for the opt-in. Members can record both choices themselves on the member portal's [Data sharing page](../../fhir-app-portal/member-portal/consent-panel.md); whoever else holds the decisions delivers them in one of two shapes.

**Flat files.** Your consent system exports the decisions as CSV, dataset by dataset, and Payerbox builds the FHIR: the Consents, the coverages a member names, the forms and the documents of authority.

{% content-ref url="csv.md" %}
[Member Consent (CSV)](csv.md)
{% endcontent-ref %}

**FHIR bundles.** Your system already holds the decisions as FHIR and writes the records itself: one transaction per decision, addressed by your own numbers.

{% content-ref url="fhir.md" %}
[Member Consent (FHIR)](fhir.md)
{% endcontent-ref %}

Both end in the same records, read the same way by [Provider Access](../../interop-apis/provider-access.md) and [Payer-to-Payer](../../interop-apis/payer-to-payer.md); the element-level rules are in the [Consent](../../api-reference/resources/consent.md) reference.
