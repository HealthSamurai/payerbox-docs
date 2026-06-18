---
description: Deploy the full Payerbox stack to a Kubernetes cluster with the payerbox umbrella Helm chart — FHIR App Portal, Interop APIs, Prior Auth, and two Aidbox FHIR servers.
---

# Deploy

The **`payerbox`** umbrella Helm chart deploys the whole Payerbox stack into a single namespace
with one release:

- **FHIR App Portal** — admin + developer portals
- **Interop APIs** — Patient / Provider / Payer-to-Payer / Provider Directory
- **Prior Auth** — CRD / DTR / PAS
- **Two Aidbox FHIR servers** — `aidbox-admin` (production data) and `aidbox-sandbox` (developer/test data)

You do **not** need Aidbox installed beforehand — the chart brings both Aidbox instances. The chart
deploys only the applications and Aidbox; you provide the **database**, **Secrets**, **ingress/TLS**,
and **Aidbox licenses** (everything below). For the component topology, see
[Architecture](architecture.md).

## Prerequisites

| Requirement | Notes |
|---|---|
| **Kubernetes cluster** + `kubectl` | any conformant cluster (managed or self-hosted) |
| **Helm** 3.14+ | `helm version` |
| **PostgreSQL** with two databases (`portal`, `sandbox`) | [CloudNativePG](https://cloudnative-pg.io/) is the reference; any reachable Postgres works |
| **Ingress controller** (e.g. ingress-nginx) | for external access to the portals and Aidbox |
| **cert-manager** + a `ClusterIssuer` | TLS certificates for the public hostnames |
| **Two Aidbox licenses** | one for `aidbox-admin`, one for `aidbox-sandbox` |
| **DNS** for four hostnames | the two portals and the two Aidbox instances |

{% hint style="warning" %}
Each Aidbox instance needs its own **license** — a JWT string starting with `eyJhbGciOiJ...`.
Obtain them from the Aidbox User Portal at [aidbox.app](https://aidbox.app). Aidbox will not boot
without a valid `BOX_LICENSE`.
{% endhint %}

Pick the four hostnames you'll serve and create DNS records pointing at your ingress controller's
load-balancer address. This guide uses these placeholders — substitute your own throughout:

| Hostname | Serves |
|---|---|
| `portal.example.com` | admin portal |
| `portal-sandbox.example.com` | developer portal |
| `aidbox.example.com` | admin Aidbox |
| `aidbox-sandbox.example.com` | sandbox Aidbox |

## Step 1 — PostgreSQL

The two Aidbox instances need two databases — **`portal`** (admin) and **`sandbox`** — owned by a
role whose password is also placed in the Aidbox Secrets (Step 2). The chart's default
`BOX_DB_HOST` is `payerbox-db-rw` (the read-write Service of a CloudNativePG `Cluster` named
`payerbox-db`); override it if your database is named or located differently.

Install the CloudNativePG operator (skip if you already run it, or if you use a managed/external
Postgres):

```bash
kubectl apply --server-side -f \
  https://raw.githubusercontent.com/cloudnative-pg/cloudnative-pg/v1.29.1/releases/cnpg-1.29.1.yaml
kubectl -n cnpg-system wait --for=condition=Available deploy/cnpg-controller-manager --timeout=180s
```

Create the namespace and a basic-auth Secret for the database role (username **must** be `aidbox`):

```bash
kubectl create namespace payerbox
DBPASS=$(openssl rand -hex 16)
kubectl -n payerbox create secret generic payerbox-db-credentials \
  --type=kubernetes.io/basic-auth --from-literal=username=aidbox --from-literal=password="$DBPASS"
```

Create a database cluster with both databases (single instance shown; for a production-grade spec
with replicas and backups, see the chart's `PREREQUISITES.md`):

```bash
kubectl -n payerbox apply -f - <<'YAML'
apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: payerbox-db                 # -> Service payerbox-db-rw  (== BOX_DB_HOST)
spec:
  instances: 1
  bootstrap:
    initdb:
      database: portal
      owner: aidbox
      secret: { name: payerbox-db-credentials }
      postInitSQL:
        - CREATE DATABASE sandbox OWNER aidbox;   # second Aidbox DB
  storage:
    size: 10Gi
    # storageClass: <your-storage-class>          # omit to use the cluster default
YAML

kubectl -n payerbox wait --for=condition=Ready cluster/payerbox-db --timeout=300s
```

## Step 2 — Secrets

The chart consumes these Secrets via `envFrom` — they must exist **before** install. The names
below are the chart defaults.

| Secret | Used by | Required keys |
|---|---|---|
| `aidbox-admin-env` | admin Aidbox | `BOX_LICENSE`, `BOX_DB_USER`, `BOX_DB_PASSWORD`, `BOX_ADMIN_PASSWORD`, `BOX_ROOT_CLIENT_SECRET`, `ADMIN_API_CLIENT_SECRET`, `INTEROP_APP_CLIENT_SECRET`, `PRIOR_AUTH_APP_CLIENT_SECRET` |
| `aidbox-sandbox-env` | sandbox Aidbox | `BOX_LICENSE`, `BOX_DB_USER`, `BOX_DB_PASSWORD`, `BOX_ADMIN_PASSWORD`, `BOX_ROOT_CLIENT_SECRET`, `DEVELOPER_API_CLIENT_SECRET` |
| `fhir-app-portal-secrets` | FHIR App Portal | `SESSION_SECRET`, `ADMIN_API_CLIENT_SECRET`, `DEVELOPER_API_CLIENT_SECRET` |
| `interop-secrets` | Interop APIs | `AIDBOX_CLIENT_SECRET`, `AIDBOX_APP_SECRET` |
| `prior-auth-secrets` | Prior Auth | `AIDBOX_CLIENT_SECRET`, `AIDBOX_APP_SECRET` |

{% hint style="warning" %}
**Two consistency rules** — the deployment silently fails to authenticate if either is broken:

1. `aidbox-*-env.BOX_DB_USER` / `BOX_DB_PASSWORD` **must equal** the PostgreSQL role from Step 1.
2. The client secrets in `aidbox-admin-env` **must equal** the matching app Secret —
   `ADMIN_API_CLIENT_SECRET` ↔ `fhir-app-portal-secrets`, `INTEROP_APP_CLIENT_SECRET` ↔
   `interop-secrets.AIDBOX_CLIENT_SECRET`, `PRIOR_AUTH_APP_CLIENT_SECRET` ↔
   `prior-auth-secrets.AIDBOX_CLIENT_SECRET`.
{% endhint %}

For production, manage these with the [External Secrets Operator](https://external-secrets.io/) or
sealed-secrets so values come from your secret manager. For a quick start you can create them by
hand — reusing the `$DBPASS` from Step 1 and a few shared client-secret values:

```bash
NS=payerbox
mkenv(){ kubectl -n $NS create secret generic "$1" "${@:2}" --dry-run=client -o yaml | kubectl apply -f -; }

mkenv aidbox-admin-env \
  --from-literal=BOX_DB_USER=aidbox --from-literal=BOX_DB_PASSWORD="$DBPASS" \
  --from-literal=BOX_LICENSE=REPLACE_ME --from-literal=BOX_ADMIN_PASSWORD="$(openssl rand -hex 12)" \
  --from-literal=BOX_ROOT_CLIENT_SECRET="$(openssl rand -hex 16)" \
  --from-literal=ADMIN_API_CLIENT_SECRET=admin-api-secret \
  --from-literal=INTEROP_APP_CLIENT_SECRET=interop-secret \
  --from-literal=PRIOR_AUTH_APP_CLIENT_SECRET=prior-auth-secret

mkenv aidbox-sandbox-env \
  --from-literal=BOX_DB_USER=aidbox --from-literal=BOX_DB_PASSWORD="$DBPASS" \
  --from-literal=BOX_LICENSE=REPLACE_ME --from-literal=BOX_ADMIN_PASSWORD="$(openssl rand -hex 12)" \
  --from-literal=BOX_ROOT_CLIENT_SECRET="$(openssl rand -hex 16)" \
  --from-literal=DEVELOPER_API_CLIENT_SECRET=developer-api-secret

mkenv fhir-app-portal-secrets \
  --from-literal=SESSION_SECRET="$(openssl rand -hex 32)" \
  --from-literal=ADMIN_API_CLIENT_SECRET=admin-api-secret \
  --from-literal=DEVELOPER_API_CLIENT_SECRET=developer-api-secret
mkenv interop-secrets    --from-literal=AIDBOX_CLIENT_SECRET=interop-secret    --from-literal=AIDBOX_APP_SECRET="$(openssl rand -hex 16)"
mkenv prior-auth-secrets --from-literal=AIDBOX_CLIENT_SECRET=prior-auth-secret --from-literal=AIDBOX_APP_SECRET="$(openssl rand -hex 16)"
```

`BOX_LICENSE` is a placeholder here — you'll set the real licenses in Step 4.

## Step 3 — Install the chart

Add the Helm repository:

```bash
helm repo add healthsamurai https://healthsamurai.github.io/helm-charts
helm repo update healthsamurai
```

Create a `values.yaml` with your hostnames and URLs. This example serves the portals through
**nginx Ingress** with cert-manager TLS:

{% code title="values.yaml" %}
```yaml
# --- Aidbox: public hosts + ingress. host drives BOX_WEB_BASE_URL and the OAuth token issuer. ---
aidbox-admin:
  host: aidbox.example.com
  ingress:
    enabled: true
    className: nginx
    annotations: { cert-manager.io/cluster-issuer: letsencrypt }
  config:
    # Substituted into the admin Aidbox init-bundle (OAuth client redirect/asset URLs).
    ADMIN_FRONTEND_URL: https://portal.example.com

aidbox-sandbox:
  host: aidbox-sandbox.example.com
  ingress:
    enabled: true
    className: nginx
    annotations: { cert-manager.io/cluster-issuer: letsencrypt }
  config:
    DEVELOPER_FRONTEND_URL: https://portal-sandbox.example.com
    ADMIN_AIDBOX_PUBLIC_URL: https://aidbox.example.com   # admin Aidbox token issuer (cross-instance trust)
    # AIDBOX_ADMIN_URL defaults to http://aidbox-admin-api (in-cluster) — usually no override

# --- FHIR App Portal: nginx Ingress for both portal hostnames + the URLs it advertises. ---
fhir-app-portal:
  portalHost: portal.example.com
  sandboxHost: portal-sandbox.example.com
  tlsSecretName: fhir-portal-tls
  route:                       # the portal defaults to Gateway API; use Ingress instead here
    portal: { enabled: false }
    dev-portal: { enabled: false }
  ingress:
    enabled: true
    className: nginx
    annotations:
      cert-manager.io/cluster-issuer: letsencrypt
  config:
    CORS_ORIGINS: "https://portal.example.com,https://portal-sandbox.example.com"
    ADMIN_FRONTEND_URL: "https://portal.example.com"
    DEVELOPER_FRONTEND_URL: "https://portal-sandbox.example.com"
    AIDBOX_ADMIN_PUBLIC_URL: "https://aidbox.example.com"
    ADMIN_AIDBOX_PUBLIC_URL: "https://aidbox.example.com"
    AIDBOX_DEV_PUBLIC_URL: "https://aidbox-sandbox.example.com"
    DEVELOPER_AIDBOX_PUBLIC_URL: "https://aidbox-sandbox.example.com"

# interop / prior-auth are ClusterIP-internal by default — no external host needed.
```
{% endcode %}

Install:

```bash
helm upgrade --install payerbox healthsamurai/payerbox \
  --namespace payerbox \
  --values values.yaml
```

## Step 4 — Add the licenses and verify

Set the real Aidbox licenses, then roll the Aidbox pods to pick them up:

```bash
ADMIN_LIC='eyJhbGciOiJ...'      # license for aidbox-admin
SANDBOX_LIC='eyJhbGciOiJ...'    # license for aidbox-sandbox
kubectl -n payerbox patch secret aidbox-admin-env   --type=merge -p "{\"stringData\":{\"BOX_LICENSE\":\"$ADMIN_LIC\"}}"
kubectl -n payerbox patch secret aidbox-sandbox-env --type=merge -p "{\"stringData\":{\"BOX_LICENSE\":\"$SANDBOX_LIC\"}}"
kubectl -n payerbox rollout restart deploy/aidbox-admin deploy/aidbox-sandbox

kubectl -n payerbox get pods -w
```

Expected — six pods, all `1/1 Running`:

```text
aidbox-admin       1/1 Running
aidbox-sandbox     1/1 Running
fhir-app-portal    1/1 Running
interop            1/1 Running
prior-auth         1/1 Running
payerbox-db-1      1/1 Running
```

Confirm Aidbox booted and the portal answers:

```bash
kubectl -n payerbox logs deploy/aidbox-admin --tail=5     # "Aidbox instance is up and running on: ..."
curl -sI https://aidbox.example.com/health                # 200
curl -sI https://portal.example.com/                      # 200 (allow ~1-2 min for the TLS cert)
```

Then open `https://portal.example.com` (admin) and `https://portal-sandbox.example.com` (developer)
in a browser.

## Routing and TLS

Each component picks its own routing:

- **FHIR App Portal** supports both **nginx Ingress** (used above) and **Gateway API**. To use
  Gateway API instead, install the Gateway API CRDs + a controller and a parent `Gateway`, then set
  `fhir-app-portal.route.portal.enabled: true` (and `dev-portal`) with `parentRefs` pointing at your
  Gateway, leaving `ingress.enabled: false`.
- **Aidbox admin/sandbox** are exposed via **Ingress** only.
- **interop / prior-auth** stay internal; enable an ingress or route only if you need direct
  external access to them.

TLS is issued by **cert-manager** from the `cert-manager.io/cluster-issuer` annotation — the first
request may take a minute or two while the certificate is issued.

## Troubleshooting

{% hint style="info" %}
**`permission denied to create extension "pg_stat_statements"` in the Aidbox log is harmless.**
It's an optional extension; Aidbox logs the warning and continues to boot. Pre-create it as a
PostgreSQL superuser only if you specifically want it.
{% endhint %}

- **A pod isn't `Running`** — `kubectl -n payerbox describe pod <name>` and `logs <name>`. The most
  common causes are a missing/placeholder `BOX_LICENSE`, a database-credential mismatch (Step 2
  rule 1), or insufficient memory (each Aidbox wants ~1–2 GiB).
- **Login redirects to the wrong host, or to `example.com`** — the portal builds its URLs from
  `fhir-app-portal.config` at container start. After changing those values, restart the portal:
  `kubectl -n payerbox rollout restart deploy/fhir-app-portal`.
- **OAuth and cross-instance auth** depend on the Aidbox init-bundle being substituted with your
  real hosts. The chart does this automatically at every pod start (no manual step), driven by the
  `aidbox-*.config` values above — so make sure those URLs match your hostnames.

## Upgrade and uninstall

```bash
# upgrade (re-applies values; Aidbox init-bundles re-render on the new pods automatically)
helm upgrade payerbox healthsamurai/payerbox -n payerbox --values values.yaml

# uninstall (leaves the database and Secrets in place)
helm uninstall payerbox -n payerbox
```

## Next steps

- [Architecture](architecture.md) — component topology, network, and the authentication chain
- [Maintain](maintain/README.md) — day-2 operations, observability, and upgrades
- [Interop APIs](../interop-apis/README.md) · [Prior Auth (ePA) APIs](../prior-auth/README.md) · [FHIR App Portal](../fhir-app-portal/README.md)
