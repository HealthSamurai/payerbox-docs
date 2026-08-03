---
description: >-
  MPF pipeline endpoint reference: the sync and refresh triggers, the export
  scope settings, and the public directory endpoint.
---

# MPF Endpoints

The endpoints of the MPF provider-directory module. They mount only when the portal runs with `MPF_ENABLED=true`; otherwise every path below answers `404`. What the module publishes: [Provider Directory](../../interop-apis/provider-directory.md#mpf-feed-for-medicare-plan-finder). Setup: [Deploy](../../run-payerbox/deploy.md#mpf-provider-directory-pipeline).

| Endpoint | Purpose |
|---|---|
| `POST /admin/mpf/sync` | Full run: export, filter, bundle, publish |
| `POST /admin/mpf/refresh` | Re-bundle a previous export without re-exporting |
| `GET` / `PUT /admin/mpf/settings` | Read and write the export scope |
| `GET` / `HEAD /mpf-provider-directory/{contract}/{year}/{file}` | Public, the URL CMS crawls |

## Auth

The trigger endpoints take a Bearer token of a `client_credentials` client listed in `MPF_TRIGGER_CLIENT_IDS`. Mint the token from Aidbox:

```http
POST /auth/token
Content-Type: application/json

{ "grant_type": "client_credentials", "client_id": "mpf-sync", "client_secret": "<secret>" }
```

## POST /admin/mpf/sync

The full run: export, filter, bundle, publish. CMS crawls the registered URLs daily, so schedule a daily run.

### Body

All fields are optional. Both only set the publish path, and the export scope stays the one baked into the image.

<table>
<thead><tr><th width="140">Field</th><th>Description</th></tr></thead>
<tbody>
<tr><td><code>contract</code></td><td>Publish path segment. Defaults to the contract baked into the image, so always pass the deployment's own contract.</td></tr>
<tr><td><code>year</code></td><td>Publish path segment. Defaults to the current year. CMS reads one URL per contract and year. During open enrollment, run a second sync with next year's value.</td></tr>
</tbody>
</table>

### Example

{% tabs %}
{% tab title="Request" %}
```http
POST /admin/mpf/sync
Authorization: Bearer <token>
Content-Type: application/json

{ "contract": "H1234", "year": 2026 }
```
{% endtab %}
{% tab title="Response" %}
```json
{
  "status": "accepted",
  "contract": "H1234",
  "year": 2026,
  "generationTime": "2026-06-12T06:15:00.000Z",
  "message": "Sync started: Aidbox $export → poll → pipeline. Watch pod logs for progress."
}
```
{% endtab %}
{% endtabs %}

## POST /admin/mpf/refresh

A debugging shortcut: skips the `$export` (where a full sync spends most of its time) and rebuilds bundles from a previous export. Answers `404` when the folder has no files.

### Body

<table>
<thead><tr><th width="140">Field</th><th>Description</th></tr></thead>
<tbody>
<tr><td><code>folder</code> (required)</td><td>A previous export's folder in the source bucket. The portal re-signs its files through Aidbox and rebuilds the bundles.</td></tr>
<tr><td><code>contract</code></td><td>Same value as of the sync that needs to be re-bundled.</td></tr>
<tr><td><code>year</code></td><td>Same value as of the sync that needs to be re-bundled.</td></tr>
</tbody>
</table>

### Example

{% tabs %}
{% tab title="Request" %}
```http
POST /admin/mpf/refresh
Authorization: Bearer <token>
Content-Type: application/json

{ "folder": "20260610_1ebb44dd-5669-4181-a7b2-1b72d116a7eb" }
```
{% endtab %}
{% tab title="Response" %}
```json
{
  "status": "accepted",
  "contract": "H1234",
  "year": 2026,
  "folder": "20260610_1ebb44dd-5669-4181-a7b2-1b72d116a7eb",
  "generationTime": "2026-06-12T10:30:00.000Z",
  "message": "Refresh started from export folder (re-sign + re-bundle). Watch pod logs."
}
```
{% endtab %}
{% endtabs %}

## Trigger errors

Both triggers share these.

| Status | Meaning |
|---|---|
| `400` | `folder` missing on `/refresh`, a `contract` that is not `H` plus digits, or a `year` outside 2024–2099. |
| `403` | The token's client is not in `MPF_TRIGGER_CLIENT_IDS`. |
| `404` | `/refresh` only: the folder holds no files for the exported resource types. |
| `409` | A run is already in flight. Runs never overlap; retry after the current one finishes. |
| `500` | `MPF_EXPORT_CLIENT_ID` / `MPF_EXPORT_CLIENT_SECRET` unset, or the export scope could not be read. A failing scope read aborts rather than publishing the wrong scope. |

## GET / PUT /admin/mpf/settings

The export scope: which `InsurancePlan` ids and which network `Organization` ids the pipeline keeps. Stored on the admin Aidbox as a `DocumentReference`, so it survives restarts and upgrades, and both triggers resolve it at the start of every run. The Admin Portal edits the same values under **Settings → MPF**.

Same auth as the triggers.

{% tabs %}
{% tab title="GET response" %}
```json
{
  "planIds": ["snp-plan", "map-plan"],
  "networkIds": ["network-a", "network-b"],
  "source": "settings"
}
```
{% endtab %}
{% tab title="PUT request" %}
```json
{
  "planIds": ["snp-plan", "map-plan"],
  "networkIds": ["network-a", "network-b"]
}
```
{% endtab %}
{% endtabs %}

`source` reports where the current values come from: `settings` once saved, `defaults` while the deployment still runs on the ids compiled into the image. `PUT` takes non-empty arrays of FHIR ids for both fields, answers `400` otherwise, and writes an `AuditEvent` on success.

## GET / HEAD /mpf-provider-directory/{contract}/{year}/{file}

Public, no auth: the endpoint CMS crawls. Proxies the storage bucket (which can stay private) and terminates conditional requests, so repeat crawls only download files that changed. `HEAD` returns the same headers without a body. Responses carry `Cache-Control: public, max-age=0, must-revalidate` plus the store's `ETag` and `Last-Modified`. `index.json` lists the bundle URLs.

```http
GET  /mpf-provider-directory/H1234/2026/index.json
HEAD /mpf-provider-directory/H1234/2026/index.json
GET  /mpf-provider-directory/H1234/2026/PractitionerRole-001.json
```

Path segments are validated before anything is fetched, and anything else answers `404`: `contract` is `H` followed by digits, `year` is a four-digit year in the 2000s, and `file` is either `index.json` or `<ResourceType>-<three digits>.json`.

| Status | Meaning |
|---|---|
| `200` | File served. |
| `304` | Unchanged since the crawler's last visit (`If-None-Match` / `If-Modified-Since`). |
| `404` | Unknown path, nothing published yet, or a publish in progress. |
| `502` | Signing or storage failed. The body says which: `Failed to obtain signed download URL` (check the access policy and `MPF_EXPORT_CLIENT_*`) or `Upstream storage error` (check the bucket). |
| `503` | `MPF_STORAGE_*` is not set on the portal. |

{% code title="index.json" %}
```json
{
  "provider_urls": [
    "https://<public base>/H1234/2026/InsurancePlan-001.json",
    "https://<public base>/H1234/2026/Organization-001.json"
  ]
}
```
{% endcode %}
