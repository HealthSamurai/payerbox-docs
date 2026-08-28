---
description: How Aidbox access policies govern operator roles in Payerbox, what the portal administrator role grants, and an example read-only data engineer role.
---

# Access policies

Every request to Payerbox's Aidbox is authorized by `AccessPolicy` resources. Policies are **allow-only** and evaluated as a union: a request succeeds when at least one policy matches it. There is no deny rule, so a role is restricted by what you never grant it.

Payerbox policies use the `matcho` engine: a pattern over the authenticated `user`, the `uri`, the `request-method`, the resolved `operation` and the request `body`. A request matching every key in the pattern is allowed.

`AccessPolicy` is an Aidbox resource, not a FHIR one, so it lives at the Aidbox base endpoint (`/AccessPolicy`) rather than under `/fhir`. For how callers authenticate, see [Authentication](../authentication.md).

## Roles

A human operator is a `User` resource, and its `roles` element is what policies match on:

```http
PUT /User/jane
Content-Type: application/json

{
  "id": "jane",
  "email": "jane@example.org",
  "roles": [{"type": "data-engineer"}]
}
```

A user your identity provider already provisioned on first sign-in only needs its `roles` element set.

Role names are not registered anywhere: a role exists as soon as a policy matches it. Match it with `$contains`, which holds regardless of what other roles the user carries:

```json
{
  "user": {"roles": {"$contains": {"type": "data-engineer"}}}
}
```

## Portal administrator

The `admin` role backs the Admin Portal. Its policies are named `admin-role-*` and ship in the admin Aidbox init bundle, the same bundle the [local quickstart](../../get-started/quickstart-run-locally.md) boots from, published as [init-bundle-admin.json](https://storage.googleapis.com/payerbox-public/init-bundle-admin.json). You do not create them.

| Resource type | Interactions granted |
|---|---|
| `Client` | Full access |
| `Organization` | Full access |
| `AwsAccount`, `GcpServiceAccount` | Full access |
| `DocumentReference` | Search, read, update |
| `Patient`, `User`, `Group` | Search and read, including the ORGBAC variants |
| `Session`, `AuditEvent`, `Communication` | Search and read |

Everything outside the table is denied, including every clinical and financial resource type (`Coverage`, `Claim`, `ExplanationOfBenefit`, `Questionnaire`, `Practitioner`), `AccessPolicy` itself and the SQL endpoints.

## Example: read-only data engineer role

The role below is an **example**, not something Payerbox ships. It gives a data engineer read access to the admin Aidbox over the FHIR API and over SQL, and nothing else.

| Surface | Granted | Denied |
|---|---|---|
| FHIR API (`/fhir/…`) | Read, vread, search (`GET` and `POST`), instance and type history | Create, update, patch, delete, transaction and batch |
| DB Console (`POST /$psql`) | A single `SELECT` or read-only `WITH` statement | Everything else, including any statement the pattern does not recognise |

The role works **only through the FHIR API**. Aidbox also exposes each resource type in its own format at the base endpoint (`GET /Patient` alongside `GET /fhir/Patient`), and the example grants FHIR interactions only, so those endpoints answer `403`. `Client`, `User`, `Organization`, `AccessPolicy` and the settings API are out of reach on both endpoints. The capability statement needs no grant at all: `/fhir/metadata` is public.

The SQL policy matches the query text with a positive pattern rather than a list of forbidden words. Anything that is not a recognised read is denied, so a body Aidbox accepts in another shape, such as the jdbc array `["SELECT …", param]` that `$sql` takes, matches nothing and is rejected.

<details>

<summary>Click to view the data engineer AccessPolicy bundle</summary>

```http
POST /
Content-Type: application/json

{
  "resourceType": "Bundle",
  "type": "transaction",
  "entry": [
    {
      "request": {"method": "PUT", "url": "/AccessPolicy/data-engineer-fhir-read"},
      "resource": {
        "resourceType": "AccessPolicy",
        "id": "data-engineer-fhir-read",
        "engine": "matcho",
        "description": "Data engineer role: read-only FHIR API",
        "matcho": {
          "user": {"roles": {"$contains": {"type": "data-engineer"}}},
          "operation": {
            "id": {
              "$one-of": [
                "FhirRead",
                "FhirVread",
                "FhirSearch",
                "FhirPostSearch",
                "FhirHistory",
                "FhirHistoryType"
              ]
            }
          }
        }
      }
    },
    {
      "request": {"method": "PUT", "url": "/AccessPolicy/data-engineer-psql-read"},
      "resource": {
        "resourceType": "AccessPolicy",
        "id": "data-engineer-psql-read",
        "engine": "matcho",
        "description": "Data engineer role: read-only DB Console",
        "matcho": {
          "user": {"roles": {"$contains": {"type": "data-engineer"}}},
          "uri": "/$psql",
          "request-method": "post",
          "body": {
            "query": "#(?is)^\\s*(select|with)\\b(?!.*;)(?!.*(--|/\\*))(?!.*\\binto\\b)(?!.*\\bdelete\\s+from\\b)(?!.*\\bdo\\b\\s*(\\$|'|language))(?!.*\\b(alter|analyze|call|checkpoint|cluster|copy|create|drop|execute|grant|import|insert|load|lock|merge|prepare|reassign|refresh|reindex|revoke|set|truncate|update|vacuum)\\b).*$"
          }
        }
      }
    }
  ]
}
```

</details>

### Limitations

The SQL pattern is **not a SQL parser**. It allows a statement that starts with `SELECT` or `WITH` and carries no statement separator, no comment, and no write keyword. That shape covers ordinary analytics, and it rejects stacked statements, data-modifying CTEs and `SELECT … INTO`. It cannot see inside a function, so `SELECT some_function()` runs whatever that function does, and Aidbox connects to PostgreSQL as a superuser. Two consequences worth stating plainly: the pattern refuses a few valid reads, such as `SELECT … FOR UPDATE`, and it is not a sandbox. The boundary for read-only analytics is a non-privileged PostgreSQL role or a read replica, with the policy as the filter in front of it.

Aidbox itself treats `$psql` as superuser-equivalent and logs every statement to `pg_stat_activity`, the query log and `AuditEvent`. Grant it only to roles you would trust with the database.

{% hint style="warning" %}
Read-only is not de-identified. The role reads every resource in the box, PHI included, with no filter by patient, organization or purpose of use.
{% endhint %}

## Defining your own role

{% stepper %}

{% step %}
**Give the user the role.** Set `roles` on the `User` resource as shown in [Roles](#roles). The value is free-form.
{% endstep %}

{% step %}
**Create the policies.** `PUT` them to the Aidbox base endpoint, or send one transaction like the bundle above. In production keep them in the deployment's init bundle, so they are re-applied on every redeploy.
{% endstep %}

{% step %}
**Verify both directions.** With a token issued to that user, call an endpoint the role should reach, expecting `200`:

```http
GET /fhir/Patient?_count=1
Authorization: Bearer <access-token>
```

Then one it should not, expecting `403`:

```http
POST /fhir/Patient
Authorization: Bearer <access-token>
Content-Type: application/json

{"resourceType": "Patient"}
```
{% endstep %}

{% endstepper %}

Resource types available over the FHIR API are listed in [Resources](../resources.md).
