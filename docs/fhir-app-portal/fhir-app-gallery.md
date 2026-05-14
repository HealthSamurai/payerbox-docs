---
description: >-
  Patient guide to browsing, launching, and managing approved SMART on FHIR
  healthcare applications from the FHIR App Gallery.
---

# FHIR App Gallery

The FHIR App Gallery is a public website where patients discover, launch, and manage approved SMART on FHIR applications connected to their health plan.

## Overview

Patients can:

* **Browse approved apps** — every app in the gallery has been reviewed by the plan administrator
* **Launch an app** — open it with a SMART on FHIR launch backed by your patient record
* **See which apps are connected** — apps with active access are marked with a **Connected** badge
* **Revoke access** — disconnect a connected app directly from its tile
* **Send feedback** — submit feedback or report issues to the plan
* **View app safety information (DSI)** — for apps that publish a Decision Support Intervention declaration

## Browse apps

The gallery shows every active app as a card in a grid. Each card displays the app's logo, name, and short description. There is no separate app-detail page — actions live on the card itself.

If no apps have been approved yet, the gallery shows a "No apps available yet" message.

## Sign in

Browsing the gallery is public; launching, revoking, sending feedback, and viewing DSI all require sign-in. Once you are signed in and your account is linked to a patient record, the action buttons appear on each card.

## Launch an app

1. Click **Launch** on the app you want to use
2. The portal fetches a SMART launch URL using your account, the plan's FHIR endpoint, and your linked patient
3. The app opens in a new browser tab
4. On the app's own consent screen, review the requested scopes and approve them

If your account has no linked patient record, the card shows "No patient record linked to your account" instead of the Launch button.

## Connected badge

When an app has at least one active session for your account, a **Connected** badge appears in the top-right corner of its card. Hover the badge to confirm: "This app has access to your data."

## Revoke access

When a card is marked **Connected**, a **Revoke Access** button appears next to **Launch**.

1. Click **Revoke Access**
2. Confirm in the dialog ("This app will lose access to your health data. You can reconnect it later.")
3. The plan revokes all active sessions and grants for that app on your account

You can reconnect later by launching the app again and approving consent.

## Feedback

Every card has a **Feedback** button. Click it to open a form and send a message to the plan administrator about that specific app. Feedback is stored as a FHIR `Communication` resource and the plan's admin is notified.

## DSI (Decision Support Intervention)

If an app publishes a Decision Support Intervention declaration, its card shows a **DSI** button. Click it to view the app's DSI details — the disclosures the developer has provided about how the app supports clinical or administrative decisions.

Apps without a DSI declaration do not show this button.
