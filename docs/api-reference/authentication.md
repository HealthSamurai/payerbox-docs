# Authentication

Payerbox supports three OAuth 2.0 flows:

- **[SMART App Launch](#smart-app-launch-member-authorized)** — member-authorized authorization code grant for third-party apps reading a single member's data (Patient Access).
- **[SMART Backend Services](#smart-backend-services-system-to-system)** — system-to-system asymmetric JWT (`private_key_jwt`) for Provider Access, Payer-to-Payer, PAS.
- **[Client Credentials](#client-credentials)** — symmetric client_id + client_secret grant for trusted internal services, sandboxes, and quick integrations.

SMART flows follow the [HL7 SMART App Launch IG 2.2.0](https://hl7.org/fhir/smart-app-launch/STU2.2/). The OAuth 2.0 RFC is [RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749).

## Endpoint discovery

Fetch the SMART configuration document before configuring a client — it advertises the live token / authorization / JWKS URLs, supported scopes, signing algorithms, grant types, and capabilities.

```
GET <base>/.well-known/smart-configuration
```

Key fields Payerbox returns:

<table>
<thead>
<tr><th width="340">Field</th><th>Value</th></tr>
</thead>
<tbody>
<tr><td><code>authorization_endpoint</code></td><td><code>&lt;base&gt;/auth/authorize</code></td></tr>
<tr><td><code>token_endpoint</code></td><td><code>&lt;base&gt;/auth/token</code></td></tr>
<tr><td><code>introspection_endpoint</code></td><td><code>&lt;base&gt;/auth/introspect</code></td></tr>
<tr><td><code>jwks_uri</code></td><td><code>&lt;base&gt;/.well-known/jwks.json</code></td></tr>
<tr><td><code>grant_types_supported</code></td><td><code>authorization_code</code>, <code>client_credentials</code>, <code>password</code>, <code>implicit</code>, <code>urn:ietf:params:oauth:grant-type:token-exchange</code></td></tr>
<tr><td><code>token_endpoint_auth_methods_supported</code></td><td><code>client_secret_basic</code>, <code>client_secret_post</code>, <code>private_key_jwt</code></td></tr>
<tr><td><code>token_endpoint_auth_signing_alg_values_supported</code></td><td><code>RS384</code>, <code>ES384</code></td></tr>
<tr><td><code>code_challenge_methods_supported</code></td><td><code>S256</code></td></tr>
<tr><td><code>capabilities</code></td><td><code>launch-standalone</code>, <code>launch-ehr</code>, <code>client-public</code>, <code>client-confidential-symmetric</code>, <code>client-confidential-asymmetric</code>, <code>permission-patient</code>, <code>permission-user</code>, <code>permission-v1</code>, <code>permission-v2</code>, <code>permission-offline</code>, <code>sso-openid-connect</code></td></tr>
<tr><td><code>scopes_supported</code></td><td><code>openid</code>, <code>profile</code>, <code>email</code>, <code>launch</code>, <code>launch/patient</code>, <code>patient/*.cruds</code>, <code>system/*.cruds</code>, <code>user/*.cruds</code>, <code>fhirUser</code>, <code>offline_access</code>, <code>online_access</code></td></tr>
</tbody>
</table>

## Endpoints

| Endpoint | Used by |
|---|---|
| `<base>/auth/authorize` | SMART App Launch — authorization redirect |
| `<base>/auth/token` | Token issuance (all flows) |
| `<base>/auth/introspect` | RFC 7662 token introspection |
| `<base>/auth/userinfo` | OpenID Connect UserInfo |
| `<base>/.well-known/jwks.json` | Server's public keys (used by clients to validate Payerbox-issued JWTs) |
| `<base>/.well-known/smart-configuration` | SMART discovery document |
| `<base>/fhir/metadata` | FHIR CapabilityStatement |

## SMART App Launch (member-authorized)

Used by third-party apps in the [FHIR App Portal](../fhir-app-portal/README.md). The member discovers an app in the [FHIR App Gallery](../fhir-app-portal/fhir-app-gallery.md), clicks Launch, signs in, and grants the requested scopes.

### Client registration

Each SMART app is registered as an Aidbox `Client` resource with `type: smart-app` and a `code` grant type:

{% tabs %}
{% tab title="Public client (PKCE)" %}
```json
PUT /Client/my-public-smart-app
Content-Type: application/json

{
  "resourceType": "Client",
  "id": "my-public-smart-app",
  "type": "smart-app",
  "active": true,
  "grant_types": ["code"],
  "auth": {
    "authorization_code": {
      "redirect_uri": "https://app.example.com/redirect",
      "token_format": "jwt",
      "access_token_expiration": 3600,
      "refresh_token": true,
      "secret_required": false,
      "pkce": true
    }
  },
  "smart": {"launch_uri": "https://app.example.com/launch"}
}
```
{% endtab %}
{% tab title="Confidential client" %}
```json
PUT /Client/my-confidential-smart-app
Content-Type: application/json

{
  "resourceType": "Client",
  "id": "my-confidential-smart-app",
  "type": "smart-app",
  "active": true,
  "grant_types": ["code"],
  "secret": "<client-secret>",
  "auth": {
    "authorization_code": {
      "redirect_uri": "https://app.example.com/redirect",
      "token_format": "jwt",
      "access_token_expiration": 3600,
      "refresh_token": true,
      "secret_required": true,
      "pkce": true
    }
  },
  "smart": {"launch_uri": "https://app.example.com/launch"}
}
```
{% endtab %}
{% endtabs %}

Public apps (single-page apps, native apps without a server-side component) must use PKCE; confidential apps may opt in to PKCE as defence-in-depth.

### Authorization request

```
GET <base>/auth/authorize?<params>
```

<table>
<thead>
<tr><th width="180">Parameter</th><th>Description</th></tr>
</thead>
<tbody>
<tr><td><code>response_type</code></td><td>Fixed value <code>code</code>.</td></tr>
<tr><td><code>client_id</code></td><td>Client resource id.</td></tr>
<tr><td><code>redirect_uri</code></td><td>Must match the registered <code>Client.auth.authorization_code.redirect_uri</code>.</td></tr>
<tr><td><code>scope</code></td><td>Space-separated SMART scopes. Include <code>launch/patient</code> for standalone or <code>launch</code> for EHR launch, plus <code>openid fhirUser</code> for identity and <code>offline_access</code> to receive a refresh token.</td></tr>
<tr><td><code>aud</code></td><td>FHIR base URL the app intends to call (typically <code>&lt;base&gt;/fhir</code>).</td></tr>
<tr><td><code>state</code></td><td>Opaque value used to prevent CSRF; the server echoes it on the redirect back.</td></tr>
<tr><td><code>code_challenge</code> + <code>code_challenge_method</code></td><td>Required for public apps (PKCE). <code>code_challenge_method</code> is always <code>S256</code>.</td></tr>
<tr><td><code>launch</code></td><td>EHR launch only — the JWT identifier the EHR passed to the app.</td></tr>
</tbody>
</table>

### Standalone launch

The user picks the app from outside the EHR. The app goes straight to `/auth/authorize` with `scope=launch/patient ...`, then exchanges the returned `code` at `/auth/token`.

### EHR launch

The EHR initiates a launch by opening the app at `Client.smart.launch_uri` with `iss=<base>/fhir` and `launch=<launch-jwt>`. The app then performs the same authorization code flow, passing the `launch` value back to `/auth/authorize`.

The `launch` JWT is signed by Aidbox and carries the launch context:

| Claim | Value |
|---|---|
| `client` | SMART client id |
| `user` | Aidbox user id |
| `ctx.patient` | Patient id |
| `exp` | Expiration (seconds since epoch) |

A helper RPC builds a complete launch URL:

```http
POST /rpc
Content-Type: application/json

{
  "method": "aidbox.smart/get-launch-uri",
  "params": {
    "client": "my-public-smart-app",
    "user": "<user-id>",
    "iss": "<base>/fhir",
    "ctx": {"patient": "<patient-id>"}
  }
}
```

### Token request

After receiving the authorization code, exchange it for an access token:

{% tabs %}
{% tab title="Request" %}
```http
POST /auth/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=<code>
&redirect_uri=https://app.example.com/redirect
&client_id=my-public-smart-app
&code_verifier=<verifier>
```

Confidential clients omit `client_id` from the body and authenticate with `Authorization: Basic <base64(client_id:client_secret)>` (or send `client_id` + `client_secret` in the body).
{% endtab %}
{% tab title="Response" %}
```json
{
  "token_type": "Bearer",
  "access_token": "<jwt>",
  "refresh_token": "<jwt>",
  "id_token": "<jwt>",
  "scope": "launch/patient openid fhirUser offline_access patient/*.read",
  "patient": "<patient-id>",
  "expires_in": 3600,
  "need_patient_banner": true
}
```
{% endtab %}
{% endtabs %}

### Refresh token

If the app requested `offline_access` it can refresh the access token without user interaction:

```http
POST /auth/token
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
&refresh_token=<refresh-token>
&client_id=my-public-smart-app
```

## SMART Backend Services (system-to-system)

Used by Provider Access, Payer-to-Payer, and PAS. The client signs a JWT with its private key; Payerbox verifies it against the client's JWKS endpoint registered at onboarding. No client secret is shared.

### Client registration

Each backend partner is registered as an Aidbox `Client` resource with `grant_types: ["client_credentials"]`, `auth.client_credentials.client_assertion_types: ["urn:ietf:params:oauth:client-assertion-type:jwt-bearer"]`, and a `jwks_uri` (or inline `jwks`) carrying the partner's public keys:

```json
PUT /Client/partner-payer
Content-Type: application/json

{
  "resourceType": "Client",
  "id": "partner-payer",
  "active": true,
  "grant_types": ["client_credentials"],
  "auth": {
    "client_credentials": {
      "client_assertion_types": ["urn:ietf:params:oauth:client-assertion-type:jwt-bearer"],
      "token_format": "jwt",
      "access_token_expiration": 300
    }
  },
  "jwks_uri": "https://partner.example.com/.well-known/jwks.json",
  "scope": ["system/*.read"]
}
```

### HL7 B2B authorization extension (UDAP)

Member-match and Payer-to-Payer operations identify the calling organization from the [UDAP HL7 B2B Authorization Extension](https://hl7.org/fhir/us/udap-security/b2b.html#b2b-authorization-extension-object), not from any `Client` field. Aidbox produces the `hl7-b2b` extension on issued access tokens automatically; no extra configuration is required. Payerbox reads it from the token JWT under `extensions.hl7-b2b`:

```json
{
  "sub": "partner-payer",
  "extensions": {
    "hl7-b2b": {
      "version": "1",
      "organization_id": "http://hl7.org/fhir/sid/us-npi#1234567893",
      "purpose_of_use": ["..."]
    }
  }
}
```

`organization_id` is a single string in `<system-uri>#<value>` form, split on the last `#`. Any identifier system works: NPI, NAIC, or CARIN BB `payerid`. Operations that read it:

| Operation | Uses `organization_id` for |
|---|---|
| [`$bulk-member-match`](operations/bulk-member-match.md) | Requesting-payer identity; stamped onto `MatchedMembers`; matched against Consent `provision.actor[role=IRCP]` |
| [`$provider-member-match`](operations/provider-member-match.md) | Caller identity |
| [`$davinci-data-export`](operations/davinci-data-export.md) (`payertopayer`) | Gates the opt-in export and resolves the requesting payer |

A non-admin caller without the claim gets `403`.

### Client assertion JWT

The client signs a short-lived JWT with its private key. Payerbox verifies the signature against the client's JWKS.

**Header**

| Field | Value |
|---|---|
| `alg` | `RS384` or `ES384` |
| `kid` | Key id matching one entry in the client's JWKS |
| `typ` | `JWT` |
| `jku` (optional) | TLS-protected URL of the client's JWK Set — must match `Client.jwks_uri` when present |

**Claims**

| Claim | Value |
|---|---|
| `iss` | Client id |
| `sub` | Client id (same as `iss`) |
| `aud` | Token endpoint URL — `<base>/auth/token` |
| `exp` | Expiration (≤ 5 minutes from now) |
| `jti` | Unique nonce — prevents replay |

### Token request

{% tabs %}
{% tab title="Request" %}
```http
POST /auth/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&scope=system/Patient.read+system/ExplanationOfBenefit.read
&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer
&client_assertion=<signed-JWT>
```
{% endtab %}
{% tab title="Response" %}
```json
{
  "token_type": "Bearer",
  "access_token": "<jwt>",
  "scope": "system/Patient.read system/ExplanationOfBenefit.read",
  "expires_in": 300
}
```
{% endtab %}
{% endtabs %}

### Client JWKS

At onboarding, the partner registers either a `jwks_uri` (preferred — Payerbox refreshes the cached keys per the `Cache-Control` header) or an inline `jwks` array. Each JWK must include `kty` and `kid`; RSA keys also need `n` and `e`, EC keys need `crv`, `x`, and `y`. Key rotation is non-breaking — publish the new key, keep the old one until clients have rotated, then retire the old key.

## Client Credentials

Plain OAuth 2.0 `client_credentials` grant with a pre-shared `client_id` + `client_secret`. Intended for trusted internal services, local stacks, and the quickstart — **not** for production payer-to-payer or provider integrations, which must use SMART Backend Services (asymmetric).

### Client registration

```json
PUT /Client/my-service
Content-Type: application/json

{
  "resourceType": "Client",
  "id": "my-service",
  "active": true,
  "grant_types": ["client_credentials"],
  "secret": "<client-secret>"
}
```

An access policy must grant the client access to whatever resources it will read or write.

### Token request

{% tabs %}
{% tab title="Request (form body)" %}
```http
POST /auth/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&client_id=my-service
&client_secret=<client-secret>
```
{% endtab %}
{% tab title="Request (Basic auth)" %}
```http
POST /auth/token
Authorization: Basic <base64(my-service:<client-secret>)>
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
```
{% endtab %}
{% tab title="Response" %}
```json
{
  "token_type": "Bearer",
  "access_token": "<token>",
  "need_patient_banner": true
}
```
{% endtab %}
{% endtabs %}

Use the returned `access_token` as `Authorization: Bearer <token>` on any FHIR request.

## Scopes

Payerbox supports both SMART v1 and v2 scope syntax (capabilities `permission-v1` and `permission-v2` are both advertised).

| Context | Use |
|---|---|
| `patient/` | Member-scoped (SMART App Launch). The access token's `context.patient` claim identifies which member. |
| `system/` | System-level (Backend Services / Client Credentials). No per-member filter; access is governed by access policies, attribution, and consent. |
| `user/` | User-scoped — used when a logged-in clinician launches an app. |

Permissions:

- **v1** — `read`, `write`, `*` (e.g. `patient/*.read`, `system/Claim.write`).
- **v2** — granular CRUDS letters: `c` (create), `r` (read), `u` (update), `d` (delete), `s` (search). Wildcard `*` allowed (e.g. `patient/*.cruds`, `system/Patient.rs`).

### Scopes with search parameters (v2)

Append a FHIR search query to a v2 read/search scope to narrow what the token can pull:

```
patient/Observation.rs?status=final
```

Aidbox auto-applies the filter to every search and read under that scope. Disallowed inside `c` / `u` / `d` permissions and disallowed with `_include`, `_revinclude`, `_has`, `_assoc`, `_with`.

### Common scope sets

| Surface | Recommended scopes |
|---|---|
| Patient Access app (read-only) | `openid fhirUser patient/*.read offline_access` |
| Provider Access (Backend Services) | `system/*.read` |
| Payer-to-Payer (Backend Services) | `system/*.read` |
| PAS (Backend Services) | `system/Claim.cu system/ClaimResponse.r` |

Full inventory of what a given deployment exposes is in the SMART configuration document's `scopes_supported`.

## Common errors

<table>
<thead>
<tr><th>HTTP</th><th width="200">OAuth error</th><th>Cause</th></tr>
</thead>
<tbody>
<tr><td>400</td><td><code>invalid_request</code></td><td>Missing or malformed parameter</td></tr>
<tr><td>400</td><td><code>invalid_grant</code></td><td>Authorization code expired, already used, or refresh token invalid</td></tr>
<tr><td>400</td><td><code>invalid_client</code></td><td>Unknown <code>client_id</code>, wrong secret, or client assertion signature did not verify against the registered JWKS</td></tr>
<tr><td>400</td><td><code>invalid_scope</code></td><td>Requested scope not allowed for this client</td></tr>
<tr><td>401</td><td><code>invalid_token</code></td><td>Access token expired, revoked, or signature invalid</td></tr>
<tr><td>403</td><td><code>insufficient_scope</code></td><td>Token lacks the required scope for the resource (returned as <code>OperationOutcome</code> from <code>/fhir</code>)</td></tr>
</tbody>
</table>
