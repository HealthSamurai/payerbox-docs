---
description: >-
  The member-facing side of the FHIR App Portal: the app gallery and the Data
  sharing page, and what administrators control on each.
---

# Member Portal

The member portal is the part of the FHIR App Portal that plan members use. Members sign in with their portal account, which is linked to their `Patient` record, and find two pages in the top navigation:

| Navigation | What members do there | Documented in |
|---|---|---|
| **App gallery** | Browse the SMART on FHIR apps the plan approved, launch them, see which are connected, revoke access, send feedback | [FHIR App Gallery](fhir-app-gallery.md) |
| **Data sharing** | Opt out of Provider Access, authorize or withdraw Payer-to-Payer exchange, review earlier choices | [Consent Capture](consent-capture.md) |

What administrators control:

| Control | Where |
|---|---|
| Which apps the gallery lists: only apps approved in the Admin Portal | [Admin Portal](../admin-portal.md) |
| Whether the **Data sharing** page appears, and whether members can change their choices there or only see them | [Capture mode](../consent-settings.md#capture-mode) |
| The plan organization, the Payer-to-Payer end date, the non-sensitive option, and the previous payers members can name | [Consent Settings](../consent-settings.md) |
| Whether an authorized representative can sign for a member: `MEMBER_CONSENT_REPRESENTATIVES_ENABLED` on the portal | [Consent Capture](consent-capture.md#authorized-representatives) |
| Approving or rejecting the choices representatives sign | [Consent Reviews](../consent-reviews.md) |
