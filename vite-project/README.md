# HavenMatch AI application

This folder contains the fixed React/Vite frontend and the HavenMatch Node.js + SWI-Prolog backend.

## Windows setup

Install Node.js and SWI-Prolog, then run these commands from this folder:

```cmd
npm install
set "SWIPL_PATH=C:\Program Files\swipl\bin\swipl.exe"
npm run dev
```

Open `http://localhost:5173`. The API listens on `http://localhost:3001`.

## Matching API

`POST /api/match` accepts JSON preferences. Example:

```json
{
  "intent": "rent",
  "maximumBudget": 3000000,
  "township": "hlaing",
  "propertyType": "apartment",
  "bedrooms": 2,
  "bathrooms": 1,
  "minimumAreaSqft": 500,
  "pets": true,
  "facilities": {
    "parking": "must_have",
    "generator": "prefer"
  }
}
```

The response identifies the active engine (`prolog` or `node-fallback`) and returns ranked matches with `score`, `scoreStatus`, `matchedWeight`, `selectedWeight`, machine-readable `reasons`, readable `explanations`, and transparent `warnings` for details missing from a source listing.

### Core score weights

| Criterion | Points |
| --- | ---: |
| Within budget | 40 |
| Preferred township | 25 |
| Property type | 10 |
| Required bedrooms | 20 |
| Required bathrooms | 5 |
| Minimum area | 5 |
| Each preferred facility | 2 |
| Each must-have facility confirmed | 3 |

The weights are normalized against only the criteria selected by the user:

```text
Match Score = matched weight / selected weight * 100
```

For example, if property type is the only selected criterion and it matches, the score is 100%, not 10%. If no scored preference is selected, `scoreStatus` is `not_scored` and the interface displays `Not Scored`. Land purpose automatically limits candidates to land and is not counted as a separate property-type preference.

The final percentage is rounded and capped at 100. Budget, township, property type, known minimum size, bedrooms, and known-false must-have facilities can remove a property. Because source listings have incomplete amenity data, an unknown amenity is retained with a verification warning and earns no points.

### Search category rules

- Rent searches include apartments, condominiums, houses, and shared homes offered for rent.
- Buy-home searches include apartments, condominiums, and houses offered for sale.
- Land searches include vacant-land sale listings only.
- A vacant-land rental record is preserved in the source database but excluded from the `Rent a home` matching results.

## Other API routes

- `GET /api/properties`
- `GET /api/properties?listingType=rent&township=hlaing`
- `GET /api/properties/:id`
- `POST /api/match`

The MVP admin listing workflow also uses:

- `GET /api/admin/properties`
- `POST /api/properties`
- `PUT /api/properties/:id`
- `PATCH /api/properties/:id/status`
- `DELETE /api/properties/:id`

The authentication integration must restrict all of these admin and write routes to an authenticated admin. Listings use `draft`, `available`, or `unavailable` status. Only available listings are returned by the public property routes or considered by matching.

## MVP data-storage decision

For the deadline-focused MVP, `server/data/properties.json` is the single property source used by admin management, public browsing, listing details, and AI matching. `server/data/users.json` remains the temporary account store. This avoids adding a database migration while the product workflow is still being completed.

The SQL files in `../database` are a proposed PostgreSQL design, not the running application's data source. Before production use, migrate both accounts and properties to a managed database and keep the existing API contract so the frontend does not need a substantial rewrite.

## Verification

```cmd
npm test
npm run lint
npm run build
```

When `SWIPL_PATH` is configured, `npm test` also runs the real SWI-Prolog integration test. Without SWI-Prolog, only that one test is skipped and the Node fallback remains available.

Property records in `server/data/properties.json` preserve their source URL and are marked `unverified`; current availability must be confirmed with the listing agent.

## Full-stack Render deployment

The repository includes a Docker deployment that builds the Vite frontend, installs SWI-Prolog, and runs the Node API and frontend from one Render web service.

1. In Render, create a new Blueprint and connect this GitHub repository.
2. Render reads the root `render.yaml` and builds `vite-project/Dockerfile`.
3. After deployment, open `/api/health` and confirm it reports `"status":"ok"` and `"prolog":{"status":"available"}`.
4. Submit a matching request in the website and confirm the `/api/match` response contains `"engine":"prolog"`.

The free Render filesystem is ephemeral. Accounts stored in `server/data/users.json` and admin listing changes stored in `server/data/properties.json` can reset after a restart or redeploy. The repository's original property file will return on a fresh deployment. Use a managed database or a paid persistent disk before treating either store as production data.
