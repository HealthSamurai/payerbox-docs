# Smart App Gallery

The Smart App Gallery is where plan members find third-party apps that connect to their health data and decide which apps to authorize.

Apps appear in the gallery after the payer approves them — see [Developer Portal](developer-portal.md) for how a developer submits an app and [Admin Portal](admin-portal.md) for how the payer reviews it.

## Member experience

Members browse the gallery without signing in. To launch an app or manage existing connections, they sign in to the member portal.

For each app a member sees:

- The app's name, logo, and description
- Whether they are currently connected to this app
- An option to launch the app
- An option to revoke an existing connection
- Optional disclosures the app has declared (for example, an AI / decision-support intervention disclosure)
- A way to submit feedback to the payer about the app

## Launch

When a member clicks **Launch**, the app opens in a new window and starts SMART App Launch against Payerbox. The member confirms the scopes the app is requesting, and the app receives an access token tied to the member's Patient context.

See [API Reference / Authentication](../api-reference/authentication.md) for the SMART App Launch protocol and scope semantics, and [Interop APIs / Patient Access](../interop-apis/patient-access.md) for what an authorized app can read.

## Revoke

A member can revoke a previously authorized app at any time from the gallery. Revocation invalidates the app's active sessions and refresh tokens; the app loses access on its next call.

Revocation does not recall data the app already fetched. The payer cannot reach into a third-party app to delete data that left its boundary.

## Feedback

Members can submit feedback about an app directly from its tile. The payer's admins receive the feedback and use it as input for re-review or de-listing decisions in the [Admin Portal](admin-portal.md).

