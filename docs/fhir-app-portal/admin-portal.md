---
description: >-
  Administrator guide to reviewing, approving, and managing SMART on FHIR
  applications in the Admin Portal.
---

# Admin Portal

The Admin Portal is a private console where administrators review, approve, and manage SMART on FHIR applications.

## Overview

Administrators can:

* **Review Apps** — Evaluate submitted apps and approve or reject them
* **Manage Active Apps** — Monitor apps, view feedback, check sessions, deactivate if needed

## Review Submitted Apps

When developers submit apps, they appear in the **Under Review** list.

### Review Checklist

Before approving an app, verify:

* **Scopes** — Are the requested scopes appropriate and safe?
* **Redirect URLs** — Are all OAuth URLs valid?
* **Required Links** — Privacy policy, terms of service, homepage
* **App Details** — Description, icon, contact information

### Approve or Reject

1. Open the app from the review list
2. Check all required information
3. Click **Approve** or **Reject**

If rejecting, provide a reason so the developer can fix the issues and resubmit.

## Manage Active Apps

Active apps are available to patients in the App Gallery.

### Monitoring

For each active app you can:

* **View Feedback** — See patient comments and issues
* **Check Sessions** — Review session logs and usage
* **Deactivate App** — Permanently remove an active app from the gallery

### Deactivating an App

1. Open the app details
2. Click **Deactivate**
3. Confirm in the dialog

Deactivation sets the app's status to **Rejected**, removes it from the App Gallery, and makes it unavailable to patients. This action cannot be undone; to bring the app back, the developer must register and submit it again.

## App Status

| Status           | Description                                                  |
| ---------------- | ------------------------------------------------------------ |
| **Draft**        | Created by developer, not yet submitted                      |
| **Under Review** | Submitted, waiting for admin decision                        |
| **Active**       | Approved and live in App Gallery                             |
| **Rejected**     | Declined at review, or deactivated after going live          |
