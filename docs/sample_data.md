# GhanaCarSpecs — Sample lookup and test data

Canonical values for **seeded** vehicles (`prisma/seed.ts`), docs, and manual QA.  
Use these exact strings unless a test explicitly needs a different value.

## Seeded vehicles (local database)

| Vehicle | Year | VIN | Plate | Chassis |
|---------|------|-----|-------|---------|
| Toyota Camry | 2007 | `4T1BE46K37U123456` | `GR-1234-21` | `BE46K37U123456` |
| Volkswagen Golf | 2014 | `WVWZZZ3CZWE123456` | `GT 5678-22` | `ZZZ3CZWE123456` |
| Honda Accord | 1991 | `1HGBH41JXMN109186` | *(none)* | `BH41JXMN109186` |

- Plate and chassis lookups ignore spacing and case (e.g. `gr 1234-21`, `be46k37u123456`).
- Honda has no plate; use VIN or chassis only.

## External VIN decode (not in seed DB)

| Purpose | VIN | Notes |
|---------|-----|--------|
| Successful NHTSA decode | `WBADT43452G922939` | BMW example; must not be imported via CSV before testing |

## No record found

| Type | Example |
|------|---------|
| Plate | `XX-0000-00` |

## External decode failure (NHTSA error)

| Purpose | VIN | Notes |
|---------|-----|--------|
| Upstream reject / invalid | `00000000000000000` | 17 characters; expect HTTP **502** and error UI on home |

Do **not** use seeded VINs for external-decode or failure tests.

## CSV ingest (not in seed until uploaded)

Template vehicle (from README and `/admin/ingest`):

| Field | Value |
|-------|--------|
| VIN | `JTDKN3DU0A0123456` |
| Plate | `GR-9000-24` |
| Chassis | `JTDKN3DU0A0123456` |
| Make / model / year | Toyota / Prius / 2010 |

After a successful upload, lookup by VIN `JTDKN3DU0A0123456` or plate `GR-9000-24` should return a **local** report.
