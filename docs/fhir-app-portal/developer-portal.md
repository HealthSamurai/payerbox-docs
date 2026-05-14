# Developer Portal

The Developer Portal is where third-party app developers register apps that will consume the Patient Access API. Developers create an account, register a SMART App, test it against the sandbox, and submit it for the payer's review.

## Register as a developer

1. Open the Developer Portal and click **Sign Up**.
2. Fill out the registration form.
3. Check your email and click **Confirm Email Address**.
4. Set your password on the confirmation page.
5. Click **Sign In** to access your dashboard.

## Register a SMART App

From the dashboard, click **Register New** and fill in:

| Field | Description |
|---|---|
| App name | Your application name |
| Confidentiality | Public or Confidential |
| Redirect URL | Where users return after authorization |
| Launch URL | Your app's SMART launch endpoint |

Click **Create App**. You are redirected to the app's draft page where you can review, edit, or delete the app.

For confidential apps, the portal issues a Client Secret in addition to the Client ID.

## Test your app

1. Copy the **Client ID** from your app's page.
2. Configure your app to use this Client ID.
3. Click **Test Launch** in the portal.

The test launch uses sample patient data (`Patient/test-pt-1`) and redirects to your launch URL with the required SMART context.

## Submit for review

1. Open your app's draft page.
2. Click **Submit for Review**.
3. The app status changes to **Under Review**.

Administrators review the app from the Admin Portal and approve or reject it. See [Admin Portal](admin-portal.md).

## App status

| Status | Description |
|---|---|
| Draft | Not yet submitted |
| Under Review | Waiting for admin decision |
| Active | Approved and available to members |
| Rejected | Did not meet requirements |

## Example: Growth Chart App

A SMART on FHIR sample app that renders pediatric growth charts.

### Get the app

```bash
git clone git@github.com:smart-on-fhir/growth-chart-app.git
cd growth-chart-app
npm install
npm start
```

### Register in the portal

Register a new app with:

- **App name**: Growth Chart
- **Confidentiality**: Public
- **Redirect URL**: `http://localhost:9000/`
- **Launch URL**: `http://localhost:9000/launch.html`

### Configure and launch

1. Copy the **Client ID** from the portal.
2. Open `growth-chart-app/launch.html` and set the `client_id` value.
3. Save the file.
4. Click **Test Launch** in the portal.

The app launches with test patient data.

