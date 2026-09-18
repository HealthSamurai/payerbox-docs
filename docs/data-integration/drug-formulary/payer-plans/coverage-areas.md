---
description: >-
  Columns for plan coverage areas, mapped to the US Drug Formulary STU 2.1.0 Insurance Plan Location profile: one row per area a plan or formulary is offered in.
---

# Coverage Areas

## Datasets

Part of the [Payer Plans](README.md) group of the [Drug Formulary](../README.md) feed, built to [Da Vinci PDex US Drug Formulary STU 2.1.0](https://hl7.org/fhir/us/davinci-drug-formulary/STU2.1/). The feed's data conventions apply.

| Dataset | US Drug Formulary STU 2.1.0 target profile |
|---|---|
| [`coverage_areas`](#coverage_areas) | [Insurance Plan Location](https://hl7.org/fhir/us/davinci-drug-formulary/STU2.1/StructureDefinition-usdf-InsurancePlanLocation.html) (Location) |

## coverage_areas

One row per geographic area a plan is offered in. A plan sold in one state has one area; a plan sold county by county has one per county. [`payer_plans`](README.md) and [`formularies`](../formularies.md) point at these rows through `coverage_area_ids`.

{% file src="../../../assets/data-integration/coverage_areas.62bb193f.csv" %}
coverage_areas.csv Data template with example rows
{% endfile %}

| Column | Required | Format / values | Example |
|---|---|---|---|
| `coverage_area_id` | Yes | your stable key for the area; `payer_plans` and `formularies` reference it | `AREA-NY` |
| `name` | Yes | text; how the area is known | `New York State` |
| `aliases` | If renamed | earlier names, `;`-separated, up to three | |
| `status` | Recommended | `active`, `suspended`, `inactive` [location-status](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/ValueSet/location-status%7C4.0.1) | `active` |
| `type_codes` | If available | roles of the location, `;`-separated, up to two, from [ServiceDeliveryLocationRoleType](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://terminology.hl7.org/ValueSet/v3-ServiceDeliveryLocationRoleType) | |
| `phone` | If available | 10 digits; a number for the area, such as a regional member line; several `;`-separated, up to three | `8885551002` |
| `fax` | If available | 10 digits; several `;`-separated, up to two | |
| `email` | If available | email addresses, `;`-separated, up to two | |
| `url` | If available | web addresses, `;`-separated, up to three | `https://example.org/areas/ny` |
| `address_line1` | If available | text | |
| `address_line2` | If available | text | |
| `city` | If available | text | |
| `state` | Yes, unless `region_geojson` is sent | 2-letter USPS state the area lies in | `NY` |
| `zip` | If available | 5 digits, as a string | |
| `latitude` | If available | decimal, WGS84; a point inside the area | `42.9538` |
| `longitude` | If available | decimal, WGS84 | `-75.5268` |
| `region_geojson` | If a boundary | the area's boundary as a GeoJSON Feature or geometry, the whole document in one cell, quoted per RFC 4180 | `{"type":"Polygon","coordinates":[[[-74.3,40.5],[-73.7,40.5],[-73.7,40.9],[-74.3,40.9],[-74.3,40.5]]]}` |
| `managing_org_npi` | Recommended | 10 digits, Luhn-valid over the `80840` prefix; the organization responsible for the area, usually the plan sponsor; key from [`organizations`](../../uscdi/care-team.md#organizations) | `9999999979` |
| `last_updated` | Recommended | datetime with a timezone offset, `YYYY-MM-DDThh:mm:ss±hh:mm`, when the area last changed in your system; blank, or a date alone, and Payerbox stamps the time it received the file | `2026-10-01T09:00:00-05:00` |
| `is_deleted` | If retracting | `true` sets the published area's `status` to `inactive` | `true` |

- The profile requires an address or a boundary. A state-wide area needs only `state`; a nationwide area sends `state` blank and a boundary. A county or service area sends `region_geojson`, and the address columns describe where it lies.
- `name` is mandatory and is what a member's app shows. Name the area, not the plan: `New York State`, `Bronx County`, `United States`.
- `latitude` and `longitude` are one FHIR element: send both or neither.
- `type_codes` is must-support in the profile but describes the function of a physical site, which a coverage area rarely has. Leave it blank unless your source classifies areas.
- Not collected: `endpoint`, `hoursOfOperation`, `operationalStatus`, `partOf`, and further identifiers beyond `coverage_area_id`.
- `region_geojson` is the boundary itself, not a link to it. Payerbox encodes the cell and publishes it as the data of the boundary attachment the IG defines, typed `application/geo+json`, so the Location is self-contained for bulk export and offline clients. The cell must be valid JSON; a cell that does not parse is rejected. Because GeoJSON contains commas and double quotes, the cell has to be enclosed in double quotes with every inner quote doubled, which every CSV writer does when told to quote the field.
- Keep boundaries as simple as the use allows. A state or county outline of a few hundred points is fine; a parcel-level polygon of tens of thousands is not what a member's app needs and makes the file hard to handle.

These resources are served by [Patient Access](../../../interop-apis/patient-access.md).
