---
description: >-
  Configure which CMS contracts, contract years, and InsurancePlans the MPF
  pipeline publishes, from the Admin Portal's Settings → MPF tab.
---

# MPF Publications

The **Settings → MPF** tab of the Admin Portal controls what the [MPF Pipeline](../run-payerbox/provider-directory-pipeline.md) publishes. A **publication** is one CMS contract in one contract year. Each publication is built into its own folder in the storage bucket, `<contract>/<year>/`, and has its own CMS crawler URL. The daily sync regenerates every publication configured on this page.

Open **Settings → MPF** (`/dashboard/settings/mpf`). The tab is shown only when the portal runs with the module enabled (see [Configure the environment](../run-payerbox/provider-directory-pipeline.md#configure-the-environment)); otherwise the page says *MPF is not enabled on this installation*.

Until something is saved, the page shows one built-in publication seeded from `MPF_DEFAULT_CONTRACT` and `MPF_DEFAULT_YEAR` and notes that it is *currently using the built-in defaults*. **Save** stores the whole page as an override in Aidbox (`DocumentReference/mpf-export-scope` on the admin box). The next sync reads it; no restart or redeploy is needed.

![MPF settings tab with one contract year card holding a single contract and its CMS crawler URL](../../assets/run-payerbox/mpf-settings-publication.avif)

## Fields

| Field | What to enter |
|---|---|
| **Contract year** | The CMS contract year the directory is for, `2024`–`2099`. One card per year; a year cannot appear twice. |
| **Contract ID** | The CMS contract number: `H` followed by digits, e.g. `H2168`. Unique within a year. It becomes the first path segment of the crawler URL. |
| **InsurancePlan IDs** | Aidbox resource ids (not business identifiers) of the `InsurancePlan` resources that belong to this contract, one per line. Letters, digits, `-`, `.` and `_`, up to 64 characters; at least one id; duplicates are dropped. Only plans with `status=active` and the Plan-Net profile are exported. The in-scope network `Organization`s are derived from each plan's `network` references on every run, so there is nothing else to list. |
| **CMS crawler URL** | Read-only: `MPF_PUBLIC_BASE_URL` + `/<contract>/<year>/index.json`. **Copy** copies it. It is marked as a preview until the publication is saved and a sync has run. This is the URL to register with CMS. |

Limits: 10 contract years, 20 contracts per year, 500 plan ids per contract.

## Add a contract

1. In the year card, click **Add contract**.
2. Fill in **Contract ID** and **InsurancePlan IDs**.
3. Click **Save**. The toast *MPF publications updated* confirms the write.
4. Wait for the daily sync, or have an operator [trigger one](../run-payerbox/provider-directory-pipeline.md#sync-one-publication), then open the crawler URL and check that `index.json` lists bundle files.
5. Register the crawler URL with CMS.

## Add a contract year

The typical case: during open enrollment, publish next year's directory while the current year keeps being regenerated.

1. Click **Add contract year** at the bottom of the page. The new card is prefilled with the year after the latest configured one and contains one empty contract.
2. Fill in the contracts as above. Plan ids are not copied from the previous year, so paste them again if the same plans continue.
3. **Save**, sync, verify `index.json` under the new year, and hand the new URL to CMS.

Each year publishes into its own folder, so publishing 2027 never touches the 2026 files.

![A second contract year card with two contracts; the unsaved one shows its crawler URL as a preview, with Add contract year and Save below](../../assets/run-payerbox/mpf-settings-add-year.avif)

## Remove a contract or a year

**Remove contract** and **Remove year** appear once there is more than one contract in the year, or more than one year. They take effect on **Save**. Removing a publication stops future syncs from regenerating it; the already-published files stay in the bucket, because CMS may still be crawling that URL. Deleting them is a manual operator step, see [Delete a retired publication's files](../run-payerbox/provider-directory-pipeline.md#delete-a-retired-publications-files).

## Validation

**Save** is enabled only after a change. The page is checked before it is sent, and the first problem is shown as an error toast, for example:

- `"20a7" is not a valid contract year (2024–2099)`
- `"h2168" is not a valid contract id (H followed by digits, e.g. H2168)`
- `Contract H2168 appears twice in year 2026`
- `H2168/2026: add at least one InsurancePlan id`
- `"plan 1" is not a valid id (letters, digits, "-", ".", "_" — max 64 chars)`

A save rejected with an access error is a deployment issue, not an input problem, see [Save fails with an access error](../run-payerbox/provider-directory-pipeline.md#save-fails-with-an-access-error).

## Related

{% content-ref url="../run-payerbox/provider-directory-pipeline.md" %}
[provider-directory-pipeline.md](../run-payerbox/provider-directory-pipeline.md)
{% endcontent-ref %}

{% content-ref url="admin-portal.md" %}
[admin-portal.md](admin-portal.md)
{% endcontent-ref %}

{% content-ref url="../api-reference/operations/mpf-pipeline-api.md" %}
[mpf-pipeline-api.md](../api-reference/operations/mpf-pipeline-api.md)
{% endcontent-ref %}
