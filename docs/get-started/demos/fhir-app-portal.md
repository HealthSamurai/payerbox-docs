# Demo: FHIR App Portal

Open: [https://fhir-app-portal-payer.smartbox.aidbox.dev/welcome](https://fhir-app-portal-payer.smartbox.aidbox.dev/welcome)

The welcome page splits two flows:

| Audience | Action |
|---|---|
| Plan member | Enroll or sign in to the member portal |
| Third-party app developer | Enroll or sign in to the [Developer Sandbox](https://fhir-app-portal-payer-sandbox.smartbox.aidbox.dev) |

## Demo deployments

Three separate deployments make up this demo:

| Deployment | URL | Role |
|---|---|---|
| Admin Portal + Smart App Gallery | `fhir-app-portal-payer.smartbox.aidbox.dev` | Member-facing welcome and gallery; payer admin sign-in |
| Developer Portal (sandbox) | `fhir-app-portal-payer-sandbox.smartbox.aidbox.dev` | Third-party app registration and test launch |
| Aidbox FHIR endpoint | `fhir-app-portal-payer-sandbox-aidbox.smartbox.aidbox.dev` | FHIR API and SMART authorization endpoints |

## Sandbox FHIR endpoints

The SMART configuration document at the well-known URL advertises every other endpoint. Always discover from it rather than hard-coding:

```
https://fhir-app-portal-payer-sandbox-aidbox.smartbox.aidbox.dev/.well-known/smart-configuration
```

For convenience, the same URLs:

| Purpose | URL |
|---|---|
| FHIR Base | `https://fhir-app-portal-payer-sandbox-aidbox.smartbox.aidbox.dev/fhir` |
| Authorize | `https://fhir-app-portal-payer-sandbox-aidbox.smartbox.aidbox.dev/auth/authorize` |
| Token | `https://fhir-app-portal-payer-sandbox-aidbox.smartbox.aidbox.dev/auth/token` |
| JWKS | `https://fhir-app-portal-payer-sandbox-aidbox.smartbox.aidbox.dev/fhir/.well-known/jwks.json` |

## Sample member

Test launches use the sample patient `Patient/test-pt-1` with US Core sample clinical data preloaded.

