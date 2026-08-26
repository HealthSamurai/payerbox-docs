---
description: How Aidbox access policies govern operator roles in Payerbox — what the portal administrator role grants, and an example read-only data engineer role.
---

# Access policies

Every request to Payerbox's Aidbox is authorized by `AccessPolicy` resources. Policies are **allow-only** and evaluated as a union: a request succeeds when at least one policy matches it. There is no deny rule, so restricting what a role can do means not granting it — adding a narrow policy never takes access away from a broader one.

Payerbox policies use the `matcho` engine: a pattern matched against the request. Its keys address the authenticated `user`, the `uri`, the `request-method`, the resolved `operation`, and the request `body`. A request that matches every key in the pattern is allowed.

`AccessPolicy` is an Aidbox administrative resource, not a FHIR one — it lives at the Aidbox base endpoint (`/AccessPolicy`), not under `/fhir`. How callers authenticate in the first place is covered in [Authentication](../authentication.md).

## Roles

A human operator is a `User` resource. Its `roles` element carries the role types that policies match on:

```http
PUT /User/jane
Content-Type: application/json

{
  "id": "jane",
  "email": "jane@example.org",
  "roles": [{"type": "data-engineer"}]
}
```

A user that already exists — provisioned by your identity provider on first sign-in, for example — only needs its `roles` element set.

Nothing registers a role name. A role exists as soon as a policy matches it, so a custom role is just another `type` value. Match it with `$contains`, which holds regardless of how many roles the user carries:

```json
{
  "user": {"roles": {"$contains": {"type": "data-engineer"}}}
}
```

## Portal administrator

The `admin` role backs the Admin Portal. Its policies are named `admin-role-*` and ship in the admin Aidbox init bundle — the same bundle the [local quickstart](../../get-started/quickstart-run-locally.md) boots from, published at [init-bundle-admin.json](https://storage.googleapis.com/payerbox-public/init-bundle-admin.json). You do not create them.

| Resource type | Interactions granted |
|---|---|
| `Client` | Full access |
| `Organization` | Full access |
| `AwsAccount`, `GcpServiceAccount` | Full access |
| `DocumentReference` | Search, read, update |
| `Patient`, `User`, `Group` | Search and read, including the ORGBAC variants |
| `Session`, `AuditEvent`, `Communication` | Search and read |

Everything outside the table is denied. The role reaches no clinical or financial resource types (`Coverage`, `Claim`, `ExplanationOfBenefit`, `Questionnaire`, `Practitioner`, and so on), cannot read or write `AccessPolicy`, and cannot use the SQL endpoints.

## Example: read-only data engineer role

The role below is an **example**, not something Payerbox ships. It gives an analyst read access to the data in the admin Aidbox — over the FHIR API and over SQL — and nothing beyond that. Adapt it to your own threat model before using it.

| Surface | Granted | Denied |
|---|---|---|
| FHIR API (`/fhir/…`) | Read, vread, search (`GET` and `POST`), history, `metadata` | Create, update, patch, delete, transaction and batch |
| SQL API (`POST /$sql`) | Statements that pass the keyword blocklist | Everything the blocklist rejects |
| DB Console (`POST /$psql`) | Statements that pass the keyword blocklist | Everything the blocklist rejects |

The role works **only through the FHIR API**. Aidbox exposes every resource type in its own format at the base endpoint as well (`GET /Patient` alongside `GET /fhir/Patient`), and the example grants FHIR interactions only — so the Aidbox-format endpoints answer `403`. Administrative resources are denied on both endpoints: `Client`, `User`, `Organization`, `AccessPolicy`, and the settings API are all out of reach.

The example carries two `/$psql` policies because the DB Console sends its body either as an object or as a single-element array, and each policy pins one body shape.

<details>

<summary>Click to view the data engineer AccessPolicy bundle</summary>

`AccessPolicy` is an Aidbox resource, so this transaction goes to the Aidbox base endpoint rather than `/fhir`.

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

The SQL guard is a **keyword blocklist, not a SQL parser**. It rejects any statement containing one of the listed words, which over-rejects legitimate reads (`… WHERE status = 'delete'` is refused) and cannot be relied on as a sandbox. The durable control for read-only analytics is a read-only PostgreSQL role or a read replica — treat the policy as a first filter in front of one, not as a replacement.

{% hint style="warning" %}
Read-only is not de-identified. The role reads every resource in the box, PHI included, with no filter by patient, organization, or purpose of use.
{% endhint %}

## Defining your own role

{% stepper %}

{% step %}
**Give the user the role.** Set `roles` on the `User` resource as shown in [Roles](#roles). The value is free-form; pick something that reads clearly in an audit log.
{% endstep %}

{% step %}
**Create the policies.** `PUT` them to the Aidbox base endpoint, or send them as one transaction like the bundle above. In production, keep them in the deployment's init bundle so they are re-applied on every redeploy.
{% endstep %}

{% step %}
**Verify both directions.** With a token issued to that user, call one endpoint the role should reach and one it should not. A policy that grants too much is invisible until you test the negative case.

```bash
# expected: 200
curl -s -o /dev/null -w '%{http_code}\n' \
  -H "Authorization: Bearer $TOKEN" \
  "https://<base>/fhir/Patient?_count=1"

# expected: 403
curl -s -o /dev/null -w '%{http_code}\n' -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"resourceType": "Patient"}' \
  "https://<base>/fhir/Patient"
```
{% endstep %}

{% endstepper %}

Resource types available over the FHIR API are listed in [Resources](../resources.md).
