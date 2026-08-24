# HavenMatch AI database

This folder contains the first simple database design for HavenMatch AI. It is independent of the backend, so the team can review and improve the data model before connecting an API.

## Files

- `schema.sql` creates the `properties` table and search indexes.
- `seed.sql` adds fictional rent, sale, and land listings for development.

## Important units

- All prices are stored as whole MMK amounts in `price_mmk`.
- One lakh is 100,000 MMK.
- Areas are stored in square feet.
- Distance is stored in kilometres.
- Township values use lowercase `snake_case`, such as `north_dagon`.

The website can convert MMK to lakhs for display:

```text
price in lakhs = price_mmk / 100000
```

## Create the database

Install PostgreSQL or create a PostgreSQL project with a hosting provider. Run the files in this order:

```powershell
psql -d havenmatch -f database/schema.sql
psql -d havenmatch -f database/seed.sql
```

If a hosted provider includes a SQL editor, paste and run `schema.sql`, followed by `seed.sql`.

## Verify the sample data

```sql
SELECT listing_code, listing_type, title, price_mmk, township
FROM properties
ORDER BY listing_type, price_mmk;
```

## Current limitations

This first version deliberately uses one table. It does not yet include users, saved properties, enquiries, questionnaire answers, or match history. Images are represented by a single URL. Add separate image and facility tables only when the application needs multiple images or a configurable list of facilities.

The seed listings are fictional and must not be presented as real properties. Real data should be checked by the team before it is published.

