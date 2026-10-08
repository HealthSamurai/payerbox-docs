---
description: >-
  Configure the member Consent Panel from the Admin Portal's Settings →
  Consent tab: the plan organization, how long a Payer-to-Payer authorization lasts,
  the non-sensitive option, and the registry of previous payers.
---

# Consent Settings

The **Settings → Consent** tab of the Admin Portal sets what the member portal's [Data sharing page](member-portal/consent-panel.md) writes into every consent and which health plans members can name for Payer-to-Payer exchange.

Open **Settings → Consent** (`/dashboard/settings/consent`). The tab is shown only on deployments that enable the Consent Panel.

![Settings → Consent: the capture mode, whether authorized representatives are offered, the plan organization resolved to Example Health Plan, the Payer-to-Payer end date, the non-sensitive option, and Save](../../assets/fhir-app-portal/consent/admin-consent-settings-v2.avif)

## Capture mode

The first card shows the deployment's capture mode. It is part of the deployment, not a setting on this page:

| Mode | Members | Administrators |
|---|---|---|
| **read-write** | Record and change both choices on the Data sharing page. Where representatives are offered, a representative's choice that shares more waits for [review](consent-reviews.md). | This tab, and the **Data sharing** card on Member Details, with its reviews where representatives are offered. |
| **read-only** | See the choices on file; the controls are disabled and the page points to Member Services. | This tab, and the **Data sharing** card on Member Details. |
| off | No Data sharing page. | No Consent tab, no Data sharing card. |

Changing the mode means changing the deployment: an operator adds or removes the member consent access policies shipped with the portal's Aidbox configuration. The portal notices the change within a minute.

The same card says whether an **authorized representative** can sign for a member: *can sign for a member* or *not offered*. That is also part of the deployment: the portal's `MEMBER_CONSENT_REPRESENTATIVES_ENABLED=true` turns it on, and it is off otherwise. Turn it on only if your staff check the uploaded documents of authority in [Consent Reviews](consent-reviews.md). Review any pending choices before turning it off again: they can no longer be approved or rejected while it is off, and they never take effect.

## Fields

| Field | What to enter |
|---|---|
| **Plan organization (Aidbox Organization id)** | The `Organization` resource that stands for your plan. Type its id or name and pick it from the suggestions; the line below confirms *Resolves to: <name>*, or says *No Organization with this id was found.* Every consent references it as `Consent.organization` and as the disclosing or receiving payer, and every consent document names it as custodian. The Organization must declare the HRex Organization profile without a version (`http://hl7.org/fhir/us/davinci-hrex/StructureDefinition/hrex-organization` in `meta.profile`); otherwise members' saves are refused. |
| **Payer-to-Payer authorization valid until** | The date every new Payer-to-Payer authorization ends. HRex requires an end date on the opt-in: the form shows it to the member before they sign, and the record carries it as `provision.period.end`. It cannot be in the past. A change applies to authorizations saved afterwards; ones already on file keep their date. |
| **Offer "non-sensitive information only" on the Payer-to-Payer form** | Whether members may authorize exchange of non-sensitive information only. As the tab notes, until sensitive data is labeled a member who picks it is returned to other payers as consent-constrained and no data moves; the member page warns the member before they save. |

**Save** is enabled after a change and confirms with *Consent settings updated*. The settings are stored on the admin Aidbox and read by the next save on the member page; no restart is needed. Problems are shown as an error toast before anything is sent, for example *The end date must not be in the past.* or *The organization id may contain letters, digits, dashes, dots and underscores only.* An id that matches no Organization is refused by the server with `Organization/<id> not found`.

Until both the plan organization and the end date are set, the tab warns *Not configured yet: members cannot save choices until the plan organization and the Payer-to-Payer end date are set.*, and the member page shows the choices on file but blocks saving.

## Previous payers

The **Previous payers** card holds the health plans a member can pick as a previous or concurrent payer on the Payer-to-Payer form. Members never type a plan's name freely; they pick from this list, and the plan organization above is never offered.

![The Previous payers card: Lakeside Health Plan registered, and Summit Health with its NPI about to be registered, with the hint that the NPI is not registered yet](../../assets/fhir-app-portal/consent/admin-previous-payers-register.avif)

To register a plan, enter its **Organization name** and **NPI**, wait for the hint under the NPI, and click **Register organization**. The hint checks the NPI as you type:

| Hint | Meaning |
|---|---|
| *This NPI is not registered as a previous payer yet.* | Ready to register. |
| *Already registered as <name> (Organization/<id>). Nothing can be created with this NPI.* | Another registered previous payer carries this NPI; the button stays disabled. |
| *Not a valid NPI: ten digits whose last one is the check digit.* | The NPI fails the format or check-digit test. |

Each registration creates an `Organization` that declares the HRex Organization profile, is typed as a payer (`organization-type` `pay`), carries the NPI as its identifier, and is tagged as a registered previous payer. The NPI is unique among registered previous payers only: an Organization loaded by a data feed for another purpose, or the plan's own Organization, does not block a registration with the same NPI. The portal has no edit or delete action for registered payers.

## Audit

Saving the settings writes a **Settings Updated** audit event, and each registration writes **Previous Payer Registered**. Both appear in the Admin Portal's **Audit Logs** with the administrator who made the change.

## Related

{% content-ref url="consent-reviews.md" %}
[consent-reviews.md](consent-reviews.md)
{% endcontent-ref %}

{% content-ref url="member-portal/consent-panel.md" %}
[consent-panel.md](member-portal/consent-panel.md)
{% endcontent-ref %}

{% content-ref url="../api-reference/resources/consent.md" %}
[consent.md](../api-reference/resources/consent.md)
{% endcontent-ref %}
