---
description: >-
  Member guide to the Data sharing page: opting out of Provider Access,
  authorizing Payer-to-Payer exchange, signing as an authorized
  representative, and reading the history of earlier choices.
---

# Data Sharing

The **Data sharing** page is where a plan member records the two data-sharing choices of [CMS-0057-F](../compliance/cms-0057.md):

- **Provider Access**: whether the plan shares the member's record with the in-network providers who treat them through [Provider Access](../interop-apis/provider-access.md). Sharing is on unless the member opts out.
- **Payer-to-Payer**: whether the plan may request the member's records from their previous or concurrent health plans through [Payer-to-Payer](../interop-apis/payer-to-payer.md). Nothing is requested unless the member opts in.

Members open the page from **Data sharing** in the portal's top navigation after signing in (`/consent`). The page appears only on deployments that enable member consent capture.

![Top of the Data sharing page: the Provider Access card with its Sharing is on status and what a treating provider receives](../../assets/fhir-app-portal/consent/member-data-sharing.avif)

## Overview

On this page a member can:

* **See what is on file** for each choice, and since when it applies
* **Opt out of Provider Access**, or turn sharing back on
* **Authorize Payer-to-Payer exchange** for all information or for non-sensitive information only, naming one or more previous or concurrent plans, and **withdraw** the authorization
* **Sign as themselves or as an authorized representative**, attaching the representative's document of authority
* **Review earlier changes** and what was answered each time

## The two cards

Each choice has its own card. The card says what the choice covers (what a treating provider receives and what is never sent, or what the plan would collect from the other plan), asks the form's question, and shows the choice currently in force. Its status badge reads:

| Card | Status | Meaning |
|---|---|---|
| Provider Access | **Sharing is on** | No opt-out is in force. This is the default; the card says *In force since your coverage started* until the member records a choice. |
| Provider Access | **Not sharing** | An opt-out is in force. |
| Payer-to-Payer | **Not asking** | No authorization is in force. The card says *No permission on file* until the member opts in. |
| Payer-to-Payer | **Permission given** | An authorization is in force until the end date the plan set, for all information or for non-sensitive information only. |
| Either | **Waiting on document check** | A representative recorded a choice that shares more of the record; it applies once the plan has checked the document of authority. |

Below the cards, *What these two choices do not change* reminds the member that apps they connected through the [FHIR App Gallery](fhir-app-gallery.md) keep working, and that neither choice affects their care, coverage, or payments. The plan's contact details close the page for members who would rather record a choice by phone or mail.

## Opt out of Provider Access

{% stepper %}
{% step %}
On the Provider Access card, pick **OPT OUT: do not share my health information with my providers.** To turn sharing back on later, pick **Share my health information with my in-network providers.**
{% endstep %}
{% step %}
The confirmation panel opens. Under **Who is completing this form?** pick **Member (myself)**, or **Authorized representative** (see [Sign as an authorized representative](#sign-as-an-authorized-representative)).
{% endstep %}
{% step %}
Tick the statement under **Signature**, draw the signature in the box (**Clear** starts over), and click **Save this choice**.
{% endstep %}
{% endstepper %}

![The Provider Access choice set to OPT OUT, with the confirmation panel: Member (myself), the signed attestation, a drawn signature, and Save this choice](../../assets/fhir-app-portal/consent/member-provider-access-confirm.avif)

A member's own choice takes effect when it is saved, and the record it replaces stops being in force. From then on, Provider Access responses leave this member's data out.

## Authorize Payer-to-Payer exchange

{% stepper %}
{% step %}
On the Payer-to-Payer card, pick **ALL of my health information, including sensitive/protected information.** or, where the plan offers it, **Only NON-SENSITIVE information. Do not share my sensitive/protected information.**
{% endstep %}
{% step %}
Under **Previous or concurrent health plan**, start typing the plan's name and pick it from the list. Only plans the plan's administrators registered appear (see [Consent Settings](consent-settings.md#previous-payers)). Add the **Member ID with that plan**, say whether that plan was in the member's own name or under someone else, and whether it is a previous plan or one the member has now alongside this one. **Add another plan** names more.
{% endstep %}
{% step %}
Pick who is completing the form, sign, and click **Save this choice**.
{% endstep %}
{% endstepper %}

![The Payer-to-Payer choice set to ALL of my health information, with Lakeside Health Plan picked as the previous plan, a member ID, and Add another plan](../../assets/fhir-app-portal/consent/member-p2p-prior-plan.avif)

The authorization runs until the date the plan sets in [Consent Settings](consent-settings.md), and the form shows that date before the member signs. Once saved, the card lists the plans the member named:

![Payer-to-Payer in force since October 6, 2026 and running until December 31, 2027, with Lakeside Health Plan listed](../../assets/fhir-app-portal/consent/member-p2p-plans.avif)

Picking **Only NON-SENSITIVE information** shows a warning before saving: other plans cannot yet separate specially protected records from the rest, so they hold back the member's whole history and nothing moves today.

To stop, pick **Withdraw my authorization. Do not request my records from my other health plans.**, sign, and save. The plan stops asking from that day; records it already collected stay in the member's file.

## Sign as an authorized representative

Picking **Authorized representative** under **Who is completing this form?** adds:

| Field | What to enter |
|---|---|
| **Representative name and relationship to member** | For example *Sam Lee, son*. |
| **Basis of authority** | **Power of Attorney**, **Legal guardian**, or **Other** with a description. |
| **Upload documentation of your authority** | The power of attorney, guardianship papers or equivalent: a PDF, JPEG or PNG file of up to 10 MB. **Replace document** swaps it before saving. |

![The confirmation panel signed by an authorized representative: name and relationship, Power of Attorney, the uploaded document, the note that the paperwork is checked first, and the signature](../../assets/fhir-app-portal/consent/member-representative-confirm.avif)

What happens next depends on the direction of the change, and the panel says which applies before the representative saves:

| Choice | When it applies |
|---|---|
| Shares less: opting out of Provider Access, withdrawing a Payer-to-Payer authorization | At once. The plan checks the document afterwards. |
| Shares more: turning Provider Access sharing back on, authorizing Payer-to-Payer exchange | After an administrator has checked the document and approved the choice (see [Consent Reviews](consent-reviews.md)). Until then the card shows **Waiting on document check** and the earlier choice stays in force. |

## Earlier changes

**Earlier changes to this choice**, at the bottom of each card, lists every choice recorded for that switch, newest first, with who signed it and its status. **View what was answered** shows the answers as they were submitted.

![Earlier changes on the Provider Access card: a representative's choice Waiting on document check above the member's own opt-out, In force](../../assets/fhir-app-portal/consent/member-provider-access-history.avif)

| Tag | Meaning |
|---|---|
| **In force** | The choice that currently applies. |
| **In force, approved <date>** | A representative's choice that an administrator approved on that date. |
| **No longer in force** | A later choice replaced it. |
| **Waiting on document check** | A representative's choice waiting for review. |
| **Not approved** | The plan did not accept the representative's document. The plan's internal note is never shown to the member. |
| **Ended <date>**, **Takes effect <date>** | A choice whose dates have passed or not started yet. |

After an administrator approves the representative's choice above, the history reads:

![Earlier changes after approval: the representative's choice In force, approved October 6, 2026, and the member's earlier opt-out No longer in force](../../assets/fhir-app-portal/consent/member-provider-access-approved.avif)

## When the plan records choices for members

Some plans record these choices through Member Services instead of on the page. On those deployments the page shows what is on file, the choices cannot be changed, and a note points to the contact details:

![The Data sharing page on a read-only deployment, with the note that the plan records these choices through Member Services](../../assets/fhir-app-portal/consent/member-read-only.avif)

If the plan has not finished setting up consent capture, the page shows the choices on file but saving is blocked with *Data sharing is not configured yet; please call Member Services to record your choice.*

## What a saved choice writes

Each save writes one set of records under the member's own session, all together or not at all: the answered form (a `QuestionnaireResponse`), a consent document that indexes it (a `DocumentReference`), the `Consent` itself, and a `Provenance` record of who signed and how. A representative's save also writes a `RelatedPerson` and a second `DocumentReference` for the uploaded document. If anything fails, nothing is saved, the panel stays open, and the member sees *Sorry, we can't save it now. Please try again later or contact Member Services.*

The `Consent` is what the APIs read. The member's Provider Access opt-out is checked by [`$provider-member-match`](../api-reference/operations/provider-member-match.md) and by every Provider Access export, and the Payer-to-Payer authorization names the plans the plan may ask. The record shapes and the endpoints behind this page are documented in [Member Consent Endpoints](../api-reference/operations/member-consent-api.md).

## Related

{% content-ref url="consent-settings.md" %}
[consent-settings.md](consent-settings.md)
{% endcontent-ref %}

{% content-ref url="consent-reviews.md" %}
[consent-reviews.md](consent-reviews.md)
{% endcontent-ref %}

{% content-ref url="../data-integration/consent/README.md" %}
[README.md](../data-integration/consent/README.md)
{% endcontent-ref %}
