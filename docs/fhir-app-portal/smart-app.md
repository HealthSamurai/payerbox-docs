---
description: >-
  Register, test, and submit an interactive SMART on FHIR application in the
  Developer Portal.
---

# SMART App

A SMART App is an interactive SMART on FHIR client: a user launches it in a browser and it authenticates with the `authorization_code` grant. Register one from the **Smart Apps** section of the [Developer Portal](developer-portal.md) dashboard.

## Register a SMART App

1. From the dashboard, click **Register New** under **Smart Apps**
2. Fill in the app details:
   * **App name**: your application name
   * **Confidentiality**: public or confidential; a confidential client is issued a secret
   * **Redirect URL**: where users return after authorization
   * **Launch URL**: your app's SMART launch endpoint
3. Set the **SMART on FHIR scopes** the app requests (`patient/*`, `user/*`, plus launch and OIDC scopes)
4. Click **Create App**

You're redirected to the app's draft page to review, edit, or delete it.

## Test your app

Before submitting, test the app in the sandbox:

1. Copy the **Client ID** from the app's page
2. Configure your app to use this Client ID
3. Click **Test Launch** in the portal

The test launch uses sample patient data (`Patient/test-pt-1`) and redirects to your launch URL with the required SMART context.

## Submit for review

When the app is ready:

1. Open the app's draft page
2. Click **Submit for Review**
3. Status changes to **Under Review**

Administrators review it from the [Admin Portal](admin-portal.md) and approve or reject.

## App status

| Status | Description |
|---|---|
| **Draft** | Created, not yet submitted |
| **Under Review** | Submitted, waiting for admin decision |
| **Active** | Approved and live in the [FHIR App Gallery](fhir-app-gallery.md) |
| **Rejected** | Declined at review, or deactivated after going live |

## Example: Growth Chart app

Here's how to test with the Growth Chart demo app.

### 1. Get the app

```bash
git clone git@github.com:smart-on-fhir/growth-chart-app.git
cd growth-chart-app
npm install
npm start
```

### 2. Register in the portal

Register a new app with:

* **App name**: Growth Chart
* **Confidentiality**: Public
* **Redirect URL**: `http://localhost:9000/`
* **Launch URL**: `http://localhost:9000/launch.html`

### 3. Configure and launch

1. Copy the **Client ID** from the portal
2. Open `growth-chart-app/launch.html` and set the `client_id` value
3. Save the file
4. Click **Test Launch** in the portal

The app launches with test patient data.
