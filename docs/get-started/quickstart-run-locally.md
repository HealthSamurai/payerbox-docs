---
description: Run the full Payerbox local stack — FHIR App Portal, Prior Auth, and Interop APIs on Aidbox with PostgreSQL 18.
---

# Quickstart: Run locally

The compose below brings up the full Payerbox stack in one command: PostgreSQL, MinIO, two Aidbox instances preconfigured with the FHIR Implementation Guides required for Prior Auth and Interop APIs, the FHIR App Portal, and the Prior Auth and Interop applications.

## Prerequisites

{% hint style="warning" %}
<img src="../../assets/get-started/docker.avif" alt="Docker logo" data-size="original">

Please **make sure** that both [Docker & Docker Compose](https://docs.docker.com/engine/install/) are installed.
{% endhint %}

You also need two Aidbox licenses from the [Aidbox User Portal](https://aidbox.app) — one per Aidbox instance in the compose:

* License for the `aidbox-admin` instance
* License for the `aidbox-dev` instance

Each license is a JWT string starting with `eyJhbGciOiJ...`. See [Run Aidbox locally](https://www.health-samurai.io/docs/aidbox/getting-started/run-aidbox-locally) in the Aidbox docs for how to obtain one.

## Step 1. Create docker-compose.yaml

Create an empty project directory and save the contents below as `docker-compose.yaml` in it:

```bash
mkdir payerbox-local && cd payerbox-local
```

{% code title="docker-compose.yaml" %}
```yaml
volumes:
  postgres_data: {}
  minio_data: {}

services:
  postgres:
    image: postgres:18
    restart: unless-stopped
    volumes:
      - postgres_data:/var/lib/postgresql
    command:
      - postgres
      - -c
      - shared_preload_libraries=pg_stat_statements
    environment:
      POSTGRES_USER: aidbox
      POSTGRES_PASSWORD: password
      POSTGRES_DB: aidbox
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U aidbox -d postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  minio:
    image: minio/minio
    restart: unless-stopped
    command: server /data --console-address ":9001"
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:9000/minio/health/live || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 10
      start_period: 5s

  minio-init:
    image: minio/mc
    depends_on:
      minio:
        condition: service_healthy
    entrypoint: >
      /bin/sh -c "
      mc alias set local http://minio:9000 minioadmin minioadmin &&
      mc mb --ignore-existing local/pas-attachments &&
      mc mb --ignore-existing local/aidbox-bulk &&
      mc anonymous set download local/pas-attachments &&
      mc anonymous set download local/aidbox-bulk
      "

  aidbox-admin:
    image: healthsamurai/aidboxone:edge
    pull_policy: always
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
      minio-init:
        condition: service_completed_successfully
    ports:
      - "8080:8080"
    environment:
      BOX_LICENSE: PASTE_AIDBOX_ADMIN_LICENSE
      BOX_ADMIN_PASSWORD: password
      BOX_ROOT_CLIENT_SECRET: secret
      BOX_DB_HOST: postgres
      BOX_DB_PORT: "5432"
      BOX_DB_USER: aidbox
      BOX_DB_PASSWORD: password
      BOX_DB_DATABASE: aidbox-admin
      BOX_WEB_PORT: "8080"
      BOX_WEB_BASE_URL: http://localhost:8080
      BOX_FHIR_COMPLIANT_MODE: "true"
      BOX_FHIR_CORRECT_AIDBOX_FORMAT: "true"
      BOX_FHIR_SCHEMA_VALIDATION: "true"
      BOX_FHIR_SEARCH_AUTHORIZE_INLINE_REQUESTS: "true"
      BOX_FHIR_SEARCH_CHAIN_SUBSELECT: "true"
      BOX_FHIR_SEARCH_COMPARISONS: "true"
      BOX_FHIR_CREATEDAT_URL: https://aidbox.app/ex/createdAt
      BOX_SEARCH_INCLUDE_CONFORMANT: "true"
      BOX_BOOTSTRAP_FHIR_PACKAGES: "hl7.fhir.r4.core#4.0.1:hl7.terminology.r4#6.4.0:hl7.fhir.us.core#6.1.0:hl7.fhir.us.carin-bb#2.0.0:hl7.fhir.us.davinci-pdex#2.1.0:hl7.fhir.us.davinci-drug-formulary#2.0.1:hl7.fhir.us.davinci-pdex-plan-net#1.1.0:hl7.fhir.us.davinci-cdex#2.1.0"
      BOX_FHIR_NPM_PACKAGE_REGISTRY: https://fs.get-ig.org/pkgs
      BOX_FHIR_BULK_STORAGE_PROVIDER: aws
      BOX_FHIR_BULK_STORAGE_AWS_ACCOUNT: minio
      BOX_FHIR_BULK_STORAGE_AWS_BUCKET: aidbox-bulk
      BOX_SECURITY_AUDIT_LOG_ENABLED: "true"
      BOX_SECURITY_DEV_MODE: "true"
      BOX_SECURITY_ORGBAC_ENABLED: "true"
      BOX_SECURITY_AUTH_KEYS_SECRET: change-this-secret
      BOX_MODULE_SDC_STRICT_ACCESS_CONTROL: "true"
      BOX_SETTINGS_MODE: read-write
      BOX_INIT_BUNDLE: https://storage.googleapis.com/aidbox-public/smartbox/init-bundle-admin.json
      BOX_MODULE_PROVIDER_DEFAULT_TYPE: ""
      BOX_MODULE_PROVIDER_DEFAULT_URL: ""
      BOX_MODULE_PROVIDER_DEFAULT_USERNAME: ""
      BOX_MODULE_PROVIDER_DEFAULT_FROM: ""
      BOX_MODULE_PROVIDER_DEFAULT_PASSWORD: ""
      BOX_COMPATIBILITY_VALIDATION_JSON__SCHEMA_REGEX: "#{:fhir-datetime}"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 10s
      timeout: 5s
      retries: 30
      start_period: 120s

  aidbox-dev:
    image: healthsamurai/aidboxone:edge
    pull_policy: always
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "8090:8090"
    environment:
      BOX_LICENSE: PASTE_AIDBOX_DEV_LICENSE
      BOX_ADMIN_PASSWORD: password
      BOX_ROOT_CLIENT_SECRET: secret
      BOX_DB_HOST: postgres
      BOX_DB_PORT: "5432"
      BOX_DB_USER: aidbox
      BOX_DB_PASSWORD: password
      BOX_DB_DATABASE: aidbox-dev
      BOX_WEB_PORT: "8090"
      BOX_WEB_BASE_URL: http://localhost:8090
      BOX_FHIR_COMPLIANT_MODE: "true"
      BOX_FHIR_CORRECT_AIDBOX_FORMAT: "true"
      BOX_FHIR_SCHEMA_VALIDATION: "true"
      BOX_FHIR_SEARCH_AUTHORIZE_INLINE_REQUESTS: "true"
      BOX_FHIR_SEARCH_CHAIN_SUBSELECT: "true"
      BOX_FHIR_SEARCH_COMPARISONS: "true"
      BOX_FHIR_CREATEDAT_URL: https://aidbox.app/ex/createdAt
      BOX_SEARCH_INCLUDE_CONFORMANT: "true"
      BOX_BOOTSTRAP_FHIR_PACKAGES: "hl7.fhir.r4.core#4.0.1:hl7.fhir.us.core#6.1.0"
      BOX_SECURITY_AUDIT_LOG_ENABLED: "true"
      BOX_SECURITY_DEV_MODE: "true"
      BOX_MODULE_SDC_STRICT_ACCESS_CONTROL: "true"
      BOX_SETTINGS_MODE: read-write
      BOX_INIT_BUNDLE: https://storage.googleapis.com/aidbox-public/smartbox/init-bundle-developer.json
      BOX_MODULE_PROVIDER_DEFAULT_URL: ""
      BOX_MODULE_PROVIDER_DEFAULT_USERNAME: ""
      BOX_MODULE_PROVIDER_DEFAULT_FROM: ""
      BOX_MODULE_PROVIDER_DEFAULT_PASSWORD: ""
      BOX_COMPATIBILITY_VALIDATION_JSON__SCHEMA_REGEX: "#{:fhir-datetime}"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8090/health"]
      interval: 10s
      timeout: 5s
      retries: 30
      start_period: 120s

  fhir-app-portal:
    image: healthsamurai/fhir-app-portal:edge
    pull_policy: always
    restart: unless-stopped
    depends_on:
      aidbox-admin:
        condition: service_healthy
      aidbox-dev:
        condition: service_healthy
    ports:
      - "8095:8095"
      - "8096:8096"
    environment:
      NODE_ENV: production
      PORTAL_BACKEND_PORT: "8081"
      SESSION_SECRET: changeme-secure-session-secret
      DEPLOYMENT_MODE: prod
      AIDBOX_DEV_URL: http://aidbox-dev:8090
      AIDBOX_ADMIN_URL: http://aidbox-admin:8080
      ADMIN_AIDBOX_PUBLIC_URL: http://localhost:8080
      DEVELOPER_AIDBOX_PUBLIC_URL: http://localhost:8090
      ADMIN_FRONTEND_URL: http://localhost:8095
      DEVELOPER_FRONTEND_URL: http://localhost:8096
      AIDBOX_DEV_PUBLIC_URL: http://localhost:8090
      AIDBOX_ADMIN_PUBLIC_URL: http://localhost:8080
      AIDBOX_ADMIN_CLIENT_ID: smartbox-admin-portal
      AIDBOX_DEV_CLIENT_ID: smartbox-developer-portal
      ADMIN_API_CLIENT_ID: admin-api
      ADMIN_API_CLIENT_SECRET: admin-api-secret-change-in-production
      DEVELOPER_API_CLIENT_ID: developer-api
      DEVELOPER_API_CLIENT_SECRET: developer-api-secret-change-in-production
      CORS_ORIGINS: http://localhost:8095,http://localhost:8096
    healthcheck:
      test:
        [
          "CMD",
          "wget",
          "--quiet",
          "--tries=1",
          "--spider",
          "http://localhost:8095/health",
        ]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s

  prior-auth:
    image: healthsamurai/prior-auth:edge
    pull_policy: always
    restart: unless-stopped
    depends_on:
      aidbox-admin:
        condition: service_healthy
    ports:
      - "8088:8088"
    environment:
      AIDBOX_URL: http://aidbox-admin:8080
      AIDBOX_CLIENT_ID: prior-auth-app
      AIDBOX_CLIENT_SECRET: secret
      AIDBOX_APP_ID: prior-auth-app
      AIDBOX_APP_PORT: "8088"
      AIDBOX_APP_SECRET: secret
      PRIOR_AUTH_APP_URL: http://prior-auth:8088/
      STORAGE_PROVIDER: aws
      STORAGE_ACCOUNT_ID: minio
      STORAGE_BUCKET: pas-attachments
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8088/health"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s

  interop:
    image: healthsamurai/interop:edge
    pull_policy: always
    restart: unless-stopped
    depends_on:
      aidbox-admin:
        condition: service_healthy
    ports:
      - "8089:8088"
    environment:
      AIDBOX_URL: http://aidbox-admin:8080
      AIDBOX_PUBLIC_URL: http://localhost:8080
      AIDBOX_CLIENT_ID: interop-app
      AIDBOX_CLIENT_SECRET: secret
      AIDBOX_APP_ID: interop-app
      AIDBOX_APP_PORT: "8088"
      AIDBOX_APP_HOST: 0.0.0.0
      INTEROP_APP_URL: http://interop:8088
      AIDBOX_APP_SECRET: secret
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8088/health"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
```
{% endcode %}

## Step 2. Fill in the license placeholders

Open `docker-compose.yaml` and replace two values with the JWT licenses you obtained:

| Placeholder | Value |
|---|---|
| `PASTE_AIDBOX_ADMIN_LICENSE` | License JWT for the `aidbox-admin` instance |
| `PASTE_AIDBOX_DEV_LICENSE` | License JWT for the `aidbox-dev` instance |

{% hint style="info" %}
**Email provider is optional.** The FHIR App Portal can send verification emails through Mailgun, SendGrid, Postmark, or SMTP. To enable it, set `BOX_MODULE_PROVIDER_DEFAULT_TYPE`, `BOX_MODULE_PROVIDER_DEFAULT_URL`, `BOX_MODULE_PROVIDER_DEFAULT_USERNAME`, `BOX_MODULE_PROVIDER_DEFAULT_FROM`, and `BOX_MODULE_PROVIDER_DEFAULT_PASSWORD` on both Aidbox services. With the empty defaults shown above, the stack still starts but the portal cannot send sign-up emails.
{% endhint %}

## Step 3. Start the stack

```bash
docker compose up
```

First startup takes several minutes while Aidbox pulls images, downloads FHIR packages, applies the init bundle (Prior Auth/Interop clients, AwsAccount/minio, Da Vinci PAS/DTR/CRD packages), and the Prior Auth and Interop apps register with admin Aidbox.

## Step 4. Open the UIs

| Service | URL |
|---|---|
| Admin Aidbox UI | http://localhost:8080 |
| Developer Aidbox UI | http://localhost:8090 |
| Admin portal | http://localhost:8095 |
| Developer portal | http://localhost:8096 |
| MinIO Console | http://localhost:9001 |

## Try the APIs in Aidbox

Open the **Admin Aidbox UI** at http://localhost:8080 and sign in with `admin` / `password`. From the **REST Console** you can send FHIR requests against Prior Auth and Interop endpoints — all client calls go through this Aidbox instance.

* [Prior Auth (CRD, DTR, PAS)](../prior-auth/README.md)
* [Payer-to-Payer](../interop-apis/payer-to-payer.md)
* [Provider Access](../interop-apis/provider-access.md)

## Explore the portals

Three portals ship with the stack — each has its own audience and its own page in this documentation:

* [**Admin Portal**](../fhir-app-portal/admin-portal.md) at http://localhost:8095. Sign in with `portal-admin` / `password` to manage members, review developer apps, and configure the platform.
* [**Developer Portal**](../fhir-app-portal/developer-portal.md) at http://localhost:8096. Used by external developers to sign up, register SMART on FHIR apps, and test them against the sandbox.
* [**Smart App Gallery**](../fhir-app-portal/smart-app-gallery.md) — the patient-facing catalog of approved SMART apps. See the page for how to access it.

## Stop and reset

```bash
docker compose down      # stop containers, keep data
docker compose down -v   # stop and delete PostgreSQL and MinIO volumes
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
