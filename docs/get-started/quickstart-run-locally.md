---
description: Run the full Payerbox local stack — FHIR App Portal, Prior Auth, and Interop APIs on Aidbox with PostgreSQL 18.
---

# Quickstart: Run locally

This guide starts the full Payerbox local stack in one `docker compose` project:

| Component | Image | Role |
|---|---|---|
| **PostgreSQL 18** | `postgres:18` | Database for both Aidbox instances |
| **Admin Aidbox** | `healthsamurai/aidboxone:edge` | FHIR server for admin portal, [Prior Auth](../prior-auth/README.md) (CRD/DTR/PAS), and [Interop APIs](../interop-apis/README.md) (Provider Access, Payer-to-Payer) |
| **Developer Aidbox** | `healthsamurai/aidboxone:edge` | FHIR sandbox for the developer portal and SMART app testing |
| **FHIR App Portal** | `healthsamurai/fhir-app-portal:edge` | [Admin and developer portals](../fhir-app-portal/README.md) |
| **Prior Auth app** | `healthsamurai/prior-auth:edge` | Da Vinci CRD, DTR, and PAS operations — registers on **admin Aidbox** |
| **Interop app** | `healthsamurai/interop:edge` | `$provider-member-match`, `$bulk-member-match`, `$davinci-data-export` — registers on **admin Aidbox** |

Prior Auth and Interop are Aidbox Apps. Clients call **admin Aidbox** (`http://localhost:8080`); Aidbox forwards FHIR operations to the apps over HTTP-RPC. The developer sandbox is a separate Aidbox instance for portal users building SMART apps.

{% hint style="info" %}
This quickstart merges setup from the Aidbox FHIR App Portal guide, CMS Prior Auth guide, and the [Interop](https://github.com/HealthSamurai/interop) service configuration.
{% endhint %}

## Prerequisites

### Docker

* [Docker](https://docs.docker.com/get-docker/) and **Docker Compose** v2.0 or later

### Aidbox licenses

Get two licenses from the [Aidbox User Portal](https://aidbox.app):

1. **Admin license** — admin Aidbox (portal, Prior Auth, Interop)
2. **Developer sandbox license** — developer Aidbox for the SMART app gallery

Each license is a JWT string starting with `eyJhbGciOiJ...`.

### Email provider

The FHIR App Portal requires an email provider for user verification and password reset. Configure Mailgun, SendGrid, Postmark, or SMTP in `.env` (see `env.example`).

## Quick start

{% stepper %}
{% step %}
### Download quickstart files

Create a project directory and copy the quickstart assets from this repository:

```bash
mkdir payerbox-local && cd payerbox-local
curl -LO https://raw.githubusercontent.com/HealthSamurai/payerbox-docs/main/assets/get-started/quickstart/docker-compose.yaml
curl -LO https://raw.githubusercontent.com/HealthSamurai/payerbox-docs/main/assets/get-started/quickstart/env.example
curl -LO https://raw.githubusercontent.com/HealthSamurai/payerbox-docs/main/assets/get-started/quickstart/init-bundle-admin.json
curl -LO https://raw.githubusercontent.com/HealthSamurai/payerbox-docs/main/assets/get-started/quickstart/init-bundle-developer.json
```

{% file src="/assets/get-started/quickstart/docker-compose.yaml" /%}

{% file src="/assets/get-started/quickstart/env.example" /%}

{% file src="/assets/get-started/quickstart/init-bundle-admin.json" /%}

{% file src="/assets/get-started/quickstart/init-bundle-developer.json" /%}
{% endstep %}
{% step %}
### Configure environment

Copy `env.example` to `.env` and set:

* `AIDBOX_ADMIN_LICENSE` and `AIDBOX_DEV_LICENSE`
* Email provider variables (`EMAIL_PROVIDER_*`, `EMAIL_FROM`)
* Secrets (`AUTH_KEYS_SECRET`, `SESSION_SECRET`, `AIDBOX_ADMIN_PASSWORD`)

{% hint style="warning" %}
Do not commit `.env` — it contains license tokens and provider credentials.
{% endhint %}
{% endstep %}
{% step %}
### Start the stack

```bash
docker compose up
```

First startup can take several minutes while Aidbox loads FHIR packages from the init bundle and apps register with admin Aidbox.

Wait until all services report healthy:

```bash
docker compose ps
```
{% endstep %}
{% step %}
### Open the UIs

| Service | URL | Notes |
|---|---|---|
| Admin portal | http://localhost:8095 | Manage members, review apps, app gallery (patient) |
| Developer portal | http://localhost:8096 | Register and test SMART on FHIR apps |
| Admin Aidbox UI | http://localhost:8080 | FHIR API, Prior Auth, Interop — login `admin` / `AIDBOX_ADMIN_PASSWORD` |
| Developer Aidbox UI | http://localhost:8090 | Sandbox FHIR server — login `admin` / `AIDBOX_ADMIN_PASSWORD` |
| Prior Auth app health | http://localhost:8088/health | App container only; API clients use admin Aidbox |
| Interop app health | http://localhost:8089/health | App container only; API clients use admin Aidbox |

Sign in to the **admin portal** with user `portal-admin` and password `password` (created by the admin init bundle).
{% endstep %}
{% endstepper %}

## Init bundles

Admin and developer Aidbox instances use separate databases and init bundles:

| File | Aidbox | Contents |
|---|---|---|
| `init-bundle-admin.json` | `aidbox-admin` | FHIR App Portal admin resources, Da Vinci IGs (PAS, DTR, CRD, PDex, CARIN BB), `Client/prior-auth-app`, `Client/interop-app`, and access policies |
| `init-bundle-developer.json` | `aidbox-dev` | Developer portal clients, sandbox access policies, sample data load |

Both bundles are applied automatically on first start via `BOX_INIT_BUNDLE`.

## Verify Prior Auth

Admin Aidbox loads Da Vinci PAS, DTR, and CRD packages from the init bundle. Explore the [Prior Auth APIs](../prior-auth/README.md) and test against `http://localhost:8080`.

## Verify Interop

Interop registers as `App/interop-app` on admin Aidbox at startup. Test async export and member-match operations through admin Aidbox — see [Provider Access](../interop-apis/provider-access.md) and [Payer-to-Payer](../interop-apis/payer-to-payer.md).

{% hint style="info" %}
`$davinci-data-export` requires GCP bulk storage configured on admin Aidbox (`BOX_FHIR_BULK_STORAGE_*` in `docker-compose.yaml`). The default test bucket works for local smoke tests; production deployments need your own storage credentials.
{% endhint %}

## Stop and reset

```bash
docker compose down      # stop containers, keep data
docker compose down -v   # stop and delete PostgreSQL volume
```

## Next steps

{% content-ref url="demo/fhir-app-portal.md" %}
[Demo: FHIR App Portal](demo/fhir-app-portal.md)
{% endcontent-ref %}

{% content-ref url="demo/ehr-prior-auth.md" %}
[Demo: EHR (Prior Auth)](demo/ehr-prior-auth.md)
{% endcontent-ref %}

{% content-ref url="../prior-auth/README.md" %}
[Prior Auth (ePA) APIs](../prior-auth/README.md)
{% endcontent-ref %}

{% content-ref url="../interop-apis/README.md" %}
[Interop APIs](../interop-apis/README.md)
{% endcontent-ref %}
