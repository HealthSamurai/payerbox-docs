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

The role below is an **example**, not something Payerbox ships. It gives an analyst read access to the admin Aidbox over the FHIR API and over SQL, and nothing else.

| Surface | Granted | Denied |
|---|---|---|
| FHIR API (`/fhir/…`) | Read, vread, search (`GET` and `POST`), history, `metadata` | Create, update, patch, delete, transaction and batch |
| SQL API (`POST /$sql`) | Statements that pass the keyword blocklist | Everything the blocklist rejects |
| DB Console (`POST /$psql`) | Statements that pass the keyword blocklist | Everything the blocklist rejects |

The role works **only through the FHIR API**. Aidbox also exposes each resource type in its own format at the base endpoint (`GET /Patient` alongside `GET /fhir/Patient`), and the example grants FHIR interactions only, so those endpoints answer `403`. `Client`, `User`, `Organization`, `AccessPolicy` and the settings API are out of reach on both endpoints.

Two `/$psql` policies are needed because the DB Console sends its body either as an object or as a single-element array, and each policy pins one shape.

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
                "FhirVRead",
                "FhirSearch",
                "FhirPostSearch",
                "FhirSearchSystem",
                "FhirHistoryInstance",
                "FhirHistoryType",
                "FhirHistorySystem",
                "FhirCapabilities"
              ]
            }
          }
        }
      }
    },
    {
      "request": {"method": "PUT", "url": "/AccessPolicy/data-engineer-sql-read"},
      "resource": {
        "resourceType": "AccessPolicy",
        "id": "data-engineer-sql-read",
        "engine": "matcho",
        "description": "Data engineer role: read-only SQL API",
        "matcho": {
          "user": {"roles": {"$contains": {"type": "data-engineer"}}},
          "uri": "/$sql",
          "request-method": "post",
          "body": {
            "$not": "#(?i)\\b(alter|copy|create|delete|drop|grant|insert|into|lock|merge|program|refresh|reindex|revoke|set|truncate|update|vacuum)\\b"
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
        "description": "Data engineer role: read-only DB Console, object body",
        "matcho": {
          "user": {"roles": {"$contains": {"type": "data-engineer"}}},
          "uri": "/$psql",
          "request-method": "post",
          "body": {
            "query": {
              "$not": "#(?i)\\b(alter|copy|create|delete|drop|grant|insert|into|lock|merge|program|refresh|reindex|revoke|set|truncate|update|vacuum)\\b"
            }
          }
        }
      }
    },
    {
      "request": {"method": "PUT", "url": "/AccessPolicy/data-engineer-psql-read-arr"},
      "resource": {
        "resourceType": "AccessPolicy",
        "id": "data-engineer-psql-read-arr",
        "engine": "matcho",
        "description": "Data engineer role: read-only DB Console, array body",
        "matcho": {
          "user": {"roles": {"$contains": {"type": "data-engineer"}}},
          "uri": "/$psql",
          "request-method": "post",
          "body": [
            {
              "query": {
                "$not": "#(?i)\\b(alter|copy|create|delete|drop|grant|insert|into|lock|merge|program|refresh|reindex|revoke|set|truncate|update|vacuum)\\b"
              }
            }
          ]
        }
      }
    }
  ]
}
```

</details>

### Limitations

The SQL guard is a **keyword blocklist, not a SQL parser**. It rejects any statement containing one of the listed words, so legitimate reads such as `... WHERE status = 'delete'` are refused too, and it is no sandbox. Back it with a read-only PostgreSQL role or a read replica.

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
