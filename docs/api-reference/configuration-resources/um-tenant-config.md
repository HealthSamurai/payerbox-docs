---
description: Configuration resource that connects a payer to its utilization management system.
---

# UMTenantConfig

Custom resource that configures forwarding of Prior Auth submissions to a payer's utilization management (UM) system. Its `StructureDefinition` is registered by Payerbox at startup; instances are managed over the FHIR REST API at `<base>/fhir/UMTenantConfig`.

One instance per payer per UM system. Instances are re-read about once a minute, so changes apply without a restart. Narrative overview: [UM System Integration](../../prior-auth/um-integration.md).

## Authentication

`UMTenantConfig` is an administrative resource — access is governed by the same Aidbox access policies as any other resource, and is not part of the PAS partner-facing scope set. See [Authentication](../authentication.md).

## Routing

<table>
<colgroup>
<col style="width: 32%"><col style="width: 8%"><col style="width: 10%"><col style="width: 50%">
</colgroup>
<thead>
<tr><th>Element</th><th>Card.</th><th>Type</th><th>Description</th></tr>
</thead>
<tbody>
<tr><td><code>connector</code></td><td>1..1</td><td>code</td><td><code>guidingcare</code> or <code>pas-passthrough</code>. Any other value invalidates the config</td></tr>
<tr><td><code>insurer.reference</code></td><td>0..1</td><td>string</td><td>Organization reference matched against <code>Claim.insurer</code></td></tr>
<tr><td><code>insurer.identifier.system</code></td><td>0..1</td><td>uri</td><td>Identifier system matched against the submitted insurer Organization</td></tr>
<tr><td><code>insurer.identifier.value</code></td><td>0..1</td><td>string</td><td>Identifier value</td></tr>
</tbody>
</table>

Identifier match is attempted first and requires the insurer `Organization` to be present in the submitted Bundle. Reference match compares the last two path segments, so `Organization/payer-1` and `http://example.org/fhir/Organization/payer-1` are equivalent.

## Endpoint and delivery policy

<table>
<colgroup>
<col style="width: 28%"><col style="width: 7%"><col style="width: 9%"><col style="width: 17%"><col style="width: 39%">
</colgroup>
<thead>
<tr><th>Element</th><th>Card.</th><th>Type</th><th>Default</th><th>Description</th></tr>
</thead>
<tbody>
<tr><td><code>endpoint.baseUrl</code></td><td>0..1</td><td>url</td><td>—</td><td>Base URL of the UM API</td></tr>
<tr><td><code>endpoint.timeoutMs</code></td><td>0..1</td><td>integer</td><td><code>30000</code></td><td>Per-attempt request timeout</td></tr>
<tr><td><code>endpoint.connectTimeoutMs</code></td><td>0..1</td><td>integer</td><td><code>10000</code></td><td>Connect timeout</td></tr>
<tr><td><code>endpoint.retry.maxAttempts</code></td><td>0..1</td><td>integer</td><td><code>5</code></td><td>Delivery attempts before the Task fails</td></tr>
<tr><td><code>endpoint.retry.backoffSeconds</code></td><td>0..*</td><td>integer</td><td><code>[30, 120, 600, 1800]</code></td><td>Delay per attempt; the last value repeats</td></tr>
<tr><td><code>endpoint.reconcile.maxAttempts</code></td><td>0..1</td><td>integer</td><td><code>5</code></td><td>Reconciliation attempts for an ambiguous delivery</td></tr>
<tr><td><code>endpoint.reconcile.delaySeconds</code></td><td>0..1</td><td>integer</td><td><code>300</code></td><td>Delay between reconciliation attempts</td></tr>
<tr><td><code>endpoint.headers.name</code></td><td>1..1</td><td>string</td><td>—</td><td>Gateway header name</td></tr>
<tr><td><code>endpoint.headers.value</code></td><td>0..1</td><td>string</td><td>—</td><td>Literal header value</td></tr>
<tr><td><code>endpoint.headers.valueEnv</code></td><td>0..1</td><td>string</td><td>—</td><td>Environment variable holding the value</td></tr>
</tbody>
</table>

Each header entry needs exactly one of `value` or `valueEnv`.

## Authentication to the UM system

<table>
<colgroup>
<col style="width: 32%"><col style="width: 8%"><col style="width: 10%"><col style="width: 50%">
</colgroup>
<thead>
<tr><th>Element</th><th>Card.</th><th>Type</th><th>Description</th></tr>
</thead>
<tbody>
<tr><td><code>endpoint.auth.type</code></td><td>0..1</td><td>code</td><td><code>oauth2-client-credentials</code>, <code>api-key</code>, or <code>none</code> (default when absent)</td></tr>
<tr><td><code>endpoint.auth.tokenUrl</code></td><td>0..1</td><td>url</td><td>OAuth2 token endpoint</td></tr>
<tr><td><code>endpoint.auth.clientId</code></td><td>0..1</td><td>string</td><td>OAuth2 client id, literal</td></tr>
<tr><td><code>endpoint.auth.clientIdEnv</code></td><td>0..1</td><td>string</td><td>Environment variable holding the client id</td></tr>
<tr><td><code>endpoint.auth.clientSecretEnv</code></td><td>0..1</td><td>string</td><td>Environment variable holding the client secret</td></tr>
<tr><td><code>endpoint.auth.scope</code></td><td>0..1</td><td>string</td><td>OAuth2 scope, literal</td></tr>
<tr><td><code>endpoint.auth.scopeEnv</code></td><td>0..1</td><td>string</td><td>Environment variable holding the scope</td></tr>
<tr><td><code>endpoint.auth.headerName</code></td><td>0..1</td><td>string</td><td>Header carrying the key, for <code>api-key</code></td></tr>
<tr><td><code>endpoint.auth.valueEnv</code></td><td>0..1</td><td>string</td><td>Environment variable holding the key value</td></tr>
</tbody>
</table>

Secrets are always referenced by environment-variable name. There is no element that stores a secret value.

## Transform

<table>
<colgroup>
<col style="width: 32%"><col style="width: 8%"><col style="width: 10%"><col style="width: 50%">
</colgroup>
<thead>
<tr><th>Element</th><th>Card.</th><th>Type</th><th>Description</th></tr>
</thead>
<tbody>
<tr><td><code>insurerReference</code></td><td>0..1</td><td>string</td><td>Organization reference stamped on the outgoing UM Claim. Required in practice — a blank value invalidates the config</td></tr>
<tr><td><code>defaults.authRequester</code></td><td>0..1</td><td>string</td><td>Fallback <code>authRequester</code>. Without it, delivery fails unless the request supplies the value</td></tr>
<tr><td><code>defaults.authType</code></td><td>0..1</td><td>string</td><td>Fallback <code>authType</code></td></tr>
<tr><td><code>defaults.treatmentType</code></td><td>0..1</td><td>string</td><td>Fallback <code>treatmentType</code></td></tr>
<tr><td><code>defaults.authCurrentOwner</code></td><td>0..1</td><td>string</td><td>Sent only when present</td></tr>
<tr><td><code>requiredSupplemental.name</code></td><td>1..1</td><td>string</td><td>Supplemental field the UM tenant template requires</td></tr>
<tr><td><code>requiredSupplemental.value</code></td><td>0..1</td><td>string</td><td>Fallback value when the request carries no matching <code>Claim.supportingInfo</code> entry</td></tr>
<tr><td><code>lobBenId.identifierSystem</code></td><td>0..1</td><td>uri</td><td><code>Coverage.identifier</code> system carrying the member's line-of-business benefit id</td></tr>
<tr><td><code>conceptMaps.name</code></td><td>1..1</td><td>string</td><td>Mapping name from the table below</td></tr>
<tr><td><code>conceptMaps.reference</code></td><td>1..1</td><td>string</td><td><code>ConceptMap</code> reference</td></tr>
<tr><td><code>inquireRefresh</code></td><td>0..1</td><td>boolean</td><td>Fetch the live decision from the UM system on <code>Claim/$inquire</code> (default <code>false</code>)</td></tr>
<tr><td><code>passThroughExtensions</code></td><td>0..1</td><td>boolean</td><td>Forward vendor extensions already present on the inbound Claim (default <code>false</code>)</td></tr>
</tbody>
</table>

The transform elements above are consumed by the `guidingcare` connector. `pas-passthrough` forwards the PAS Bundle unchanged and uses only routing, endpoint and `inquireRefresh`.

### ConceptMap names

<table>
<colgroup>
<col style="width: 24%"><col style="width: 38%"><col style="width: 38%">
</colgroup>
<thead>
<tr><th><code>conceptMaps.name</code></th><th>Translates</th><th>Notes</th></tr>
</thead>
<tbody>
<tr><td><code>claimType-&gt;authClass</code></td><td><code>Claim.type</code> → UM authorization class</td><td>Falls back to <code>outpatient</code></td></tr>
<tr><td><code>service-&gt;authType</code></td><td><code>Claim.item[0].productOrService</code> → <code>authType</code></td><td>Overridden by <code>Claim.subType</code>; falls back to <code>defaults.authType</code></td></tr>
<tr><td><code>service-&gt;treatmentType</code></td><td><code>Claim.item[0].productOrService</code> → <code>treatmentType</code></td><td>Falls back to <code>defaults.treatmentType</code></td></tr>
<tr><td><code>priority-&gt;authPriority</code></td><td><code>Claim.priority</code> → UM priority</td><td>Required — no mapping and no <code>unmapped</code> default fails delivery</td></tr>
<tr><td><code>pos-&gt;label</code></td><td><code>Claim.item[0].locationCodeableConcept</code> → place-of-service label</td><td>May depend on the resolved auth class via <code>dependsOn</code> on property <code>urn:prior-auth:um:authClass</code></td></tr>
<tr><td><code>careTeamRole-&gt;slot</code></td><td><code>Claim.careTeam.role</code> → <code>referred-by</code>, <code>referred-to</code>, <code>rendering</code>, <code>facility</code>, <code>admitting</code></td><td>Target system <code>urn:prior-auth:um:provider-slot</code></td></tr>
<tr><td><code>providerNpi-&gt;gcId</code></td><td>NPI → the UM system's internal provider id</td><td>Falls back to the NPI when unmapped</td></tr>
<tr><td><code>decisionStatus-&gt;reviewAction</code></td><td>UM decision status → X12 005010/306 <code>reviewAction</code></td><td>Falls back to <code>A4</code> (Pended)</td></tr>
</tbody>
</table>

A `ConceptMap` group may declare `unmapped` with `mode: "fixed"` to supply a default target. Targets with equivalence `unmatched` or `disjoint` are ignored.

## Examples

{% tabs %}
{% tab title="pas-passthrough" %}

```json
{
  "resourceType": "UMTenantConfig",
  "id": "payer-1-um",
  "connector": "pas-passthrough",
  "insurer": {
    "reference": "Organization/payer-1",
    "identifier": { "system": "http://hl7.org/fhir/sid/us-npi", "value": "1234567893" }
  },
  "endpoint": {
    "baseUrl": "https://um.example.org/fhir",
    "timeoutMs": 30000,
    "retry": { "maxAttempts": 5, "backoffSeconds": [30, 120, 600, 1800] },
    "auth": {
      "type": "oauth2-client-credentials",
      "tokenUrl": "https://um.example.org/auth/token",
      "clientIdEnv": "UM_PAYER1_CLIENT_ID",
      "clientSecretEnv": "UM_PAYER1_CLIENT_SECRET",
      "scopeEnv": "UM_PAYER1_SCOPE"
    }
  },
  "insurerReference": "Organization/payer-1",
  "inquireRefresh": true
}
```

{% endtab %}
{% tab title="guidingcare" %}

```json
{
  "resourceType": "UMTenantConfig",
  "id": "payer-2-guidingcare",
  "connector": "guidingcare",
  "insurer": {
    "reference": "Organization/payer-2",
    "identifier": { "system": "http://hl7.org/fhir/sid/us-npi", "value": "9876543210" }
  },
  "endpoint": {
    "baseUrl": "https://um-gateway.example.net/epa",
    "timeoutMs": 90000,
    "retry": { "maxAttempts": 5, "backoffSeconds": [30, 120, 600, 1800] },
    "auth": {
      "type": "oauth2-client-credentials",
      "tokenUrl": "https://login.example.net/oauth2/v2.0/token",
      "clientIdEnv": "UM_PAYER2_CLIENT_ID",
      "clientSecretEnv": "UM_PAYER2_CLIENT_SECRET",
      "scopeEnv": "UM_PAYER2_SCOPE"
    },
    "headers": [
      { "name": "ocp-apim-subscription-key", "valueEnv": "UM_PAYER2_SUBSCRIPTION_KEY" },
      { "name": "tenant-id", "value": "payer-2-tenant" }
    ]
  },
  "insurerReference": "Organization/payer2.example.net",
  "defaults": {
    "authRequester": "CONTRACTED PROVIDER",
    "authType": "Durable Medical Equipment Medicaid (MLTC)",
    "treatmentType": "Durable Medical Equipment"
  },
  "requiredSupplemental": [{ "name": "AOR on File?", "value": "Yes" }],
  "lobBenId": { "identifierSystem": "https://example.net/lobBenID" },
  "conceptMaps": [
    { "name": "claimType->authClass", "reference": "ConceptMap/um-payer2-authclass" },
    { "name": "priority->authPriority", "reference": "ConceptMap/um-payer2-authpriority" },
    { "name": "pos->label", "reference": "ConceptMap/um-payer2-pos" },
    { "name": "careTeamRole->slot", "reference": "ConceptMap/um-payer2-provider-roles" },
    { "name": "providerNpi->gcId", "reference": "ConceptMap/um-payer2-provider-npi" },
    { "name": "decisionStatus->reviewAction", "reference": "ConceptMap/um-payer2-reviewaction" }
  ],
  "inquireRefresh": false,
  "passThroughExtensions": false
}
```

{% endtab %}
{% endtabs %}

## Readiness

Each config compiles to `ready` or `invalid`. An `invalid` config is excluded from routing: its payer's submissions are stored and returned as `queued`, but never delivered. Check `GET /health`:

```json
{
  "um": {
    "tenants": {
      "payer-1-um": { "status": "ready", "gaps": [], "warnings": [] },
      "payer-2-guidingcare": {
        "status": "invalid",
        "gaps": ["env UM_PAYER2_CLIENT_SECRET not set", "ConceptMap/um-payer2-pos not found"],
        "warnings": []
      }
    }
  }
}
```

<table>
<colgroup>
<col style="width: 50%"><col style="width: 50%">
</colgroup>
<thead>
<tr><th>Condition</th><th>Effect</th></tr>
</thead>
<tbody>
<tr><td><code>connector</code> unknown</td><td>Gap — invalid</td></tr>
<tr><td><code>insurerReference</code> blank</td><td>Gap — invalid</td></tr>
<tr><td>Environment variable named by <code>clientSecretEnv</code>, <code>valueEnv</code> or a header <code>valueEnv</code> not set</td><td>Gap — invalid</td></tr>
<tr><td><code>oauth2-client-credentials</code> with neither <code>clientId</code> nor <code>clientIdEnv</code></td><td>Gap — invalid</td></tr>
<tr><td>Referenced <code>ConceptMap</code> missing or not compilable</td><td>Gap — invalid</td></tr>
<tr><td><code>defaults.authRequester</code> absent</td><td>Warning — config stays ready; delivery fails unless the request supplies the value</td></tr>
</tbody>
</table>

Gaps found at delivery time rather than at load time (for example a `Coverage` without the `lobBenId` identifier system) fail that Task and are recorded in `ClaimResponse.error[]`.

{% hint style="info" %}
Header and auth values are read from the environment of the Prior Auth service. Adding a new environment variable requires a restart; changing anything inside the resource does not.
{% endhint %}
