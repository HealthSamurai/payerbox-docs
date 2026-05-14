# Admin Portal

The Admin Portal is the payer-side ops console. Administrators review submitted apps, approve or decline them, monitor active apps, and manage organizations (multi-tenant deployments).

## Review submitted apps

The **Apps → Under Review** queue lists each app submitted from the [Developer Portal](developer-portal.md).

### Review checklist

For each app:

- App name and description match the actual app behavior
- Privacy policy URL is reachable
- Privacy policy discloses how the app handles PHI under HIPAA
- Redirect URI matches the app's hosted environment
- Developer profile is complete (legal entity, contact information)
- App is not a SaMD requiring FDA / ONC clearance the developer hasn't disclosed

### Approve or decline

1. Open the app detail page.
2. Read the review checklist on the right pane.
3. Click **Approve** to issue production credentials and publish the app to the [Smart App Gallery](smart-app-gallery.md). Click **Decline** to send the app back to the developer with a reason.

Approval issues a production Client ID and (for confidential apps) a Client Secret. The Smart App Gallery picks up the new entry on its next refresh.

## Manage active apps

The **Apps → Active** view lists every published app with token-grant counts and most recent activity.

- **Monitoring** — token grants per app, most recent member authorization, rate-limit events. See also [Run Payerbox / Maintain / Observability](../run-payerbox/maintain/observability.md) for audit log export.
- **Disable an app** — sets the app to `disabled`. Existing tokens revoked at next refresh; new authorizations rejected. Members notified through the gallery that the app is no longer available.

## Manage organizations

Multi-tenant Payerbox deployments (a TPA running APIs for several plans, or an IPA acting for several delegated payers) use Aidbox **Multibox** mode. Each tenant is an Organization.

### Create an organization

1. **Organizations → New**.
2. Set legal name, NPI / Tax ID, parent plan reference.
3. Save. The portal provisions a new Aidbox tenant with its own FHIR endpoint, isolated storage, and a default access policy.
4. Assign administrators to the organization. They inherit the Admin Portal scoped to that tenant.

> TODO(engineering): document the IdP claim that drives org selection at sign-in.

## App status reference

| Status | Meaning |
|---|---|
| Draft | Developer-side only. Not in the admin queue. |
| Under Review | Awaiting admin action. |
| Active | Approved and published in the gallery. |
| Disabled | Admin-revoked. Member-facing message displayed. |
| Rejected | Admin-declined with reason. Developer can resubmit after changes. |

