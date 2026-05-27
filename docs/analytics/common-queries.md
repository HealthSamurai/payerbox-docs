---
description: Recipe book - the prior-auth analytics queries Payerbox built the materialized view to answer.
---

# Common queries

All queries run against `sof.pdex_prior_authorization_item`, the
[materialized view built from a ViewDefinition](flat-views.md). Scope is PDex
prior-auth EOBs.

## 1. EOBs per month, last 12 months

```sql
SELECT date_trunc('month', created::date)::date AS month,
       COUNT(DISTINCT eob_id)                   AS eob_count
FROM   sof.pdex_prior_authorization_item
WHERE  created::date >= current_date - INTERVAL '12 months'
GROUP  BY 1
ORDER  BY 1 DESC;
```

| month | eob_count |
|---|---|
| 2026-05-01 | 138 421 |
| 2026-04-01 | 142 008 |
| 2026-03-01 | 151 776 |
| 2026-02-01 | 129 442 |
| 2026-01-01 | 134 905 |
| 2025-12-01 | 118 614 |
| … | … |

## 2. EOBs by business identifier system

```sql
WITH per_eob AS (
  SELECT eob_id, MAX(business_identifier_system) AS bis
  FROM   sof.pdex_prior_authorization_item
  GROUP  BY eob_id
)
SELECT COALESCE(bis, 'no-business-identifier') AS business_identifier_system,
       COUNT(*) AS eob_count
FROM   per_eob
GROUP  BY 1
ORDER  BY 2 DESC;
```

| business_identifier_system | eob_count |
|---|---|
| https://example.org/system-1 | 1 842 117 |
| urn:oid:1.2.3.4              |   612 008 |
| https://example.org/system-2 |   387 540 |
| no-business-identifier       |    12 411 |

## 3. Top 20 members by PA count, last 12 months

High utilizers.

```sql
SELECT patient_ref,
       COUNT(DISTINCT eob_id) AS eob_count,
       COUNT(*)               AS pa_item_rows
FROM   sof.pdex_prior_authorization_item
WHERE  created::date >= current_date - INTERVAL '12 months'
  AND  patient_ref IS NOT NULL
GROUP  BY 1
ORDER  BY 2 DESC
LIMIT  20;
```

`pa_item_rows` counts materialized view rows (one per item × adjudication);
`eob_count` is distinct authorizations.

| patient_ref | eob_count | pa_item_rows |
|---|---|---|
| Patient/XXXX-XXXX-XXXX-XXXX-0001 | 412 | 1 803 |
| Patient/XXXX-XXXX-XXXX-XXXX-0002 | 387 | 1 645 |
| Patient/XXXX-XXXX-XXXX-XXXX-0003 | 361 | 1 528 |
| Patient/XXXX-XXXX-XXXX-XXXX-0004 | 348 | 1 472 |
| Patient/XXXX-XXXX-XXXX-XXXX-0005 | 331 | 1 391 |
| … | … | … |

## 4. Top 20 service codes, last 12 months

Which services get authorized most.

```sql
SELECT item_product_or_service_code,
       COUNT(*)               AS item_count,
       COUNT(DISTINCT eob_id) AS eob_count
FROM   sof.pdex_prior_authorization_item
WHERE  created::date >= current_date - INTERVAL '12 months'
GROUP  BY 1
ORDER  BY 2 DESC
LIMIT  20;
```

| item_product_or_service_code | item_count | eob_count |
|---|---|---|
| 99214 | 982 145 | 318 077 |
| 99213 | 271 882 | 152 410 |
| J3490 | 188 037 |  92 615 |
| 90837 | 142 904 |  78 220 |
| E0601 | 121 768 |  65 419 |
| … | … | … |

## 5. Top 20 primary diagnoses, last 12 months

```sql
SELECT primary_diagnosis_code, primary_diagnosis_display,
       COUNT(DISTINCT eob_id) AS eob_count
FROM   sof.pdex_prior_authorization_item
WHERE  created::date >= current_date - INTERVAL '12 months'
  AND  primary_diagnosis_code IS NOT NULL
GROUP  BY 1, 2
ORDER  BY 3 DESC
LIMIT  20;
```

| primary_diagnosis_code | primary_diagnosis_display | eob_count |
|---|---|---|
| I10    | Essential (primary) hypertension                          | 184 412 |
| E11.9  | Type 2 diabetes mellitus without complications            | 141 028 |
| J45.909| Unspecified asthma, uncomplicated                         |  97 614 |
| M54.50 | Low back pain, unspecified                                |  82 305 |
| I50.9  | Heart failure, unspecified                                |  73 184 |
| … | … | … |

## 6. EOBs by outcome × status, last 12 months

The basic adjudication mix.

```sql
SELECT outcome, status, COUNT(DISTINCT eob_id) AS eob_count
FROM   sof.pdex_prior_authorization_item
WHERE  created::date >= current_date - INTERVAL '12 months'
GROUP  BY 1, 2
ORDER  BY 3 DESC;
```

| outcome | status            | eob_count |
|---|---|---|
| complete | active            | 1 384 022 |
| partial  | active            |   312 818 |
| error    | active            |   148 405 |
| complete | cancelled         |    21 094 |
| complete | entered-in-error  |     1 612 |

## 7. EOBs by denial reason code

Why authorizations get denied.

```sql
WITH per_eob AS (
  SELECT eob_id,
         array_agg(DISTINCT code) FILTER (WHERE code IS NOT NULL) AS codes
  FROM   sof.pdex_prior_authorization_item,
         LATERAL unnest(item_denial_reason_codes) AS code
  GROUP  BY eob_id
)
SELECT COALESCE(c, 'no-denial-reason') AS denial_reason_code,
       COUNT(*) AS eob_count
FROM   per_eob
LEFT  JOIN LATERAL unnest(COALESCE(codes, ARRAY[NULL::text])) AS c ON true
GROUP  BY 1
ORDER  BY 2 DESC;
```

| denial_reason_code | eob_count |
|---|---|
| no-denial-reason   | 1 723 882 |
| 50                 |    62 491 |
| 16                 |    48 207 |
| 22                 |    19 805 |
| 197                |     8 612 |
| 96                 |     6 233 |

The denial codes come from CARC (Claim Adjustment Reason Codes,
maintained by X12). A separate set, RARC (Remittance Advice Remark
Codes, `M-`/`N-` prefixed), gives supplementary detail. Resolve
specific codes against the X12 lists.

## 8. Denial rate by month

```sql
SELECT date_trunc('month', created::date)::date AS month,
       round(100.0 * count(*) FILTER (WHERE outcome = 'error')
                  / nullif(count(*), 0), 1) AS denial_pct,
       count(*) AS eob_count
FROM   sof.pdex_prior_authorization_item
WHERE  created::date >= current_date - INTERVAL '12 months'
GROUP  BY 1
ORDER  BY 1 DESC;
```

| month | denial_pct | eob_count |
|---|---|---|
| 2026-05-01 | 8.4 | 138 421 |
| 2026-04-01 | 8.2 | 142 008 |
| 2026-03-01 | 8.7 | 151 776 |
| 2026-02-01 | 8.1 | 129 442 |
| 2026-01-01 | 8.0 | 134 905 |
| 2025-12-01 | 7.6 | 118 614 |
| … | … | … |
