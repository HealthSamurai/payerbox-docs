---
description: >-
  MPF pipeline endpoint reference: the sync and refresh triggers and the
  public directory endpoint.
---

# MPF Endpoints

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

## GET /mpf-provider-directory/{contract}/{year}/{file}

Public, no auth: the endpoint CMS crawls. Proxies the storage bucket (which can stay private) and supports conditional GET, so repeat crawls only download files that changed. `index.json` lists the bundle URLs. The resources inside the bundles conform to the Plan-Net profiles.

```http
GET /mpf-provider-directory/H1234/2026/index.json
GET /mpf-provider-directory/H1234/2026/PractitionerRole-001.json
```

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
