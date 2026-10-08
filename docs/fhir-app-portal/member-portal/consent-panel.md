---
description: >-
  How plan members record their Provider Access opt-out and Payer-to-Payer
  authorization on the member portal's Data sharing page, what each choice
  records, and what the plan configures. For administrators and support staff.
---

# Consent Panel

Plan members record the two data-sharing choices of [CMS-0057-F](../../compliance/cms-0057.md) themselves, on the **Data sharing** page of the member portal (**Data sharing** in the top navigation, `/consent`):

- **Provider Access**: whether the plan shares the member's record with the in-network providers who treat them through [Provider Access](../../interop-apis/provider-access.md). Sharing is on unless the member opts out.
- **Payer-to-Payer**: whether the plan may request the member's records from their previous or concurrent health plans through [Payer-to-Payer](../../interop-apis/payer-to-payer.md). Nothing is requested unless the member opts in.

This page describes what members see and do there and what each choice records, so that administrators can configure the feature and support members. The plan's side is configured in [Consent Settings](../consent-settings.md), and choices signed by an authorized representative are checked in [Consent Reviews](../consent-reviews.md). The page appears only where the deployment turns it on; see [Capture mode](../consent-settings.md#capture-mode).

![Top of the Data sharing page: the Provider Access card with its Sharing is on status and what a treating provider receives](../../../assets/fhir-app-portal/consent/member-data-sharing.avif)

## What members can do

* **See what is on file** for each choice, and since when it applies
* **Opt out of Provider Access**, or turn sharing back on
* **Authorize Payer-to-Payer exchange** for all information, or for non-sensitive information only where the plan offers it, naming one or more registered previous or concurrent plans; and **withdraw** the authorization
* **Let an authorized representative sign**, with a document of authority, where the deployment offers it (see [Authorized representatives](#authorized-representatives))
* **Review earlier changes** and what was answered each time

## The two cards

Each choice has its own card. The card says what the choice covers (what a treating provider receives and what is never sent, or what the plan would collect from the other plan), asks the form's question, and shows the choice in force. Its status badge reads:

| Card | Status | Meaning |
|---|---|---|
| Provider Access | **Sharing is on** | No opt-out is in force. This is the default; the card says *In force since your coverage started* until the member records a choice. |
| Provider Access | **Not sharing** | An opt-out is in force. |
| Payer-to-Payer | **Not asking** | No authorization is in force. The card says *No permission on file* until the member opts in. |
| Payer-to-Payer | **Permission given** | An authorization is in force until the end date the plan set, for all information or for non-sensitive information only. |
| Either | **Waiting on document check** | A representative recorded a choice that shares more of the record, and it waits for review. |

Below the cards, *What these two choices do not change* reminds the member that apps they connected through the [FHIR App Gallery](fhir-app-gallery.md) keep working, and that neither choice affects their care, coverage, or payments. The plan's contact details, taken from the consent forms, close the page for members who would rather record a choice by phone or mail.

## Provider Access opt-out

{% stepper %}
{% step %}
On the Provider Access card the member picks **OPT OUT: do not share my health information with my providers.**, or **Share my health information with my in-network providers.** to turn sharing back on.
{% endstep %}
{% step %}
A confirmation panel opens. Where representatives are offered, it first asks **Who is completing this form?** with **Member (myself)** and **Authorized representative**.
{% endstep %}
{% step %}
The member ticks the statement under **Signature**, draws a signature, and clicks **Save this choice**.
{% endstep %}
{% endstepper %}

![The Provider Access choice set to OPT OUT, with the confirmation panel: Member (myself), the signed attestation, a drawn signature, and Save this choice](../../../assets/fhir-app-portal/consent/member-provider-access-confirm.avif)

A member's own choice takes effect when it is saved, and the record it replaces stops being in force. From then on, Provider Access responses leave this member's data out.

## Payer-to-Payer authorization

{% stepper %}
{% step %}
On the Payer-to-Payer card the member picks **ALL of my health information, including sensitive/protected information.** or, where the plan offers it, **Only NON-SENSITIVE information. Do not share my sensitive/protected information.**
{% endstep %}
{% step %}
Under **Previous or concurrent health plan** the member types the plan's name and picks it from the list. Only plans registered in [Consent Settings](../consent-settings.md#previous-payers) appear. The member adds their **Member ID with that plan**, whether that plan was in their own name or under someone else, and whether it is a previous plan or one they have now alongside this one. **Add another plan** names more.
{% endstep %}
{% step %}
The member signs and clicks **Save this choice**.
{% endstep %}
{% endstepper %}

![The Payer-to-Payer choice set to ALL of my health information, with Lakeside Health Plan picked as the previous plan, a member ID, and Add another plan](../../../assets/fhir-app-portal/consent/member-p2p-prior-plan.avif)

The authorization runs until the date set in [Consent Settings](../consent-settings.md), which the form shows before the member signs. Once it is saved, the card lists the plans the member named:

![Payer-to-Payer in force since October 6, 2026 and running until December 31, 2027, with Lakeside Health Plan listed](../../../assets/fhir-app-portal/consent/member-p2p-plans.avif)

Picking **Only NON-SENSITIVE information** shows the member a warning before saving: other plans cannot yet separate specially protected records from the rest, so they hold back the member's whole history and nothing moves today.

To stop, the member picks **Withdraw my authorization. Do not request my records from my other health plans.**, signs, and saves. The plan stops asking from that day; records it already collected stay in the member's file.

## Authorized representatives

Representative signing is offered only where the portal runs with `MEMBER_CONSENT_REPRESENTATIVES_ENABLED=true`, for plans whose staff check documents of authority. Elsewhere the panel does not ask who completes the form, the member always signs themselves, and there is nothing to review.

Where it is offered, picking **Authorized representative** adds:

| Field | What the representative enters |
|---|---|
| **Representative name and relationship to member** | For example *Sam Lee, son*. |
| **Basis of authority** | **Power of Attorney**, **Legal guardian**, or **Other** with a description. |
| **Upload documentation of your authority** | The power of attorney, guardianship papers or equivalent: a PDF, JPEG or PNG file of up to 10 MB. |

![The confirmation panel signed by an authorized representative: name and relationship, Power of Attorney, the uploaded document, the note that the paperwork is checked first, and the signature](../../../assets/fhir-app-portal/consent/member-representative-confirm.avif)

When the choice applies depends on its direction, and the panel tells the representative which before they save:

| Choice | When it applies |
|---|---|
| Shares less: opting out of Provider Access, withdrawing a Payer-to-Payer authorization | At once. The plan checks the document afterwards. |
| Shares more: turning Provider Access sharing back on, authorizing Payer-to-Payer exchange | After an administrator has checked the document and approved the choice in [Consent Reviews](../consent-reviews.md). Until then the card shows **Waiting on document check** and the earlier choice stays in force. |

## Earlier changes

**Earlier changes to this choice**, at the bottom of each card, lists every choice recorded for that switch, newest first, with who signed it and its status. **View what was answered** shows the answers as they were submitted.

![Earlier changes on the Provider Access card: a representative's choice Waiting on document check above the member's own opt-out, In force](../../../assets/fhir-app-portal/consent/member-provider-access-history.avif)

| Tag | Meaning |
|---|---|
| **In force** | The choice that currently applies. |
| **In force, approved <date>** | A representative's choice that an administrator approved on that date. |
| **No longer in force** | A later choice replaced it. |
| **Waiting on document check** | A representative's choice waiting for review. |
| **Not approved** | An administrator rejected the representative's choice. The internal note is never shown to the member. |
| **Ended <date>**, **Takes effect <date>** | A choice whose dates have passed or not started yet. |

After an administrator approves the representative's choice above, the history reads:

![Earlier changes after approval: the representative's choice In force, approved October 6, 2026, and the member's earlier opt-out No longer in force](../../../assets/fhir-app-portal/consent/member-provider-access-approved.avif)

## Read-only and unconfigured deployments

Where the plan records these choices through Member Services, the deployment runs in read-only [capture mode](../consent-settings.md#capture-mode): the page shows what is on file, the choices cannot be changed, and a note points the member to the contact details.

![The Data sharing page on a read-only deployment, with the note that the plan records these choices through Member Services](../../../assets/fhir-app-portal/consent/member-read-only.avif)

Until the plan organization and the Payer-to-Payer end date are set in [Consent Settings](../consent-settings.md), the page shows the choices on file but saving is blocked with *Data sharing is not configured yet; please call Member Services to record your choice.*

## What a saved choice records

Each save writes one set of FHIR records under the member's own session, all together or not at all:

- the answered form, a `QuestionnaireResponse`;
- a consent document that indexes it, a `DocumentReference`;
- the `Consent` itself;
- a `Provenance` record of who signed and how;
- for a representative, also a `RelatedPerson` and a second `DocumentReference` for the uploaded document.

If anything fails, nothing is saved, the panel stays open, and the member sees *Sorry, we can't save it now. Please try again later or contact Member Services.*

The `Consent` is what the APIs read: the Provider Access opt-out is checked by [`$provider-member-match`](../../api-reference/operations/provider-member-match.md) and by every Provider Access export, and the Payer-to-Payer authorization names the plans the plan may ask. The records, their profiles and how to query them are in the [Consent](../../api-reference/resources/consent.md) reference.

## Related

{% content-ref url="../consent-settings.md" %}
[consent-settings.md](../consent-settings.md)
{% endcontent-ref %}

{% content-ref url="../consent-reviews.md" %}
[consent-reviews.md](../consent-reviews.md)
{% endcontent-ref %}

{% content-ref url="../../api-reference/resources/consent.md" %}
[consent.md](../../api-reference/resources/consent.md)
{% endcontent-ref %}
