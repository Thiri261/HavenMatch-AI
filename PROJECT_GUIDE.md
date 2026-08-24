# HavenMatch AI — Team Project Guide

Welcome to the HavenMatch AI project. This document gives team members a shared understanding of the product, current codebase, planned Prolog integration, and contribution workflow.

## 1. Project overview

HavenMatch AI is a housing and land matching application. Users answer an adaptive questionnaire, and the system recommends suitable properties based on their needs and preferences.

The current user paths are:

- Rent a home
- Buy a home
- Buy land

The matching system should explain why a result fits the user's answers instead of presenting an unexplained score.

## 2. Current status

The repository currently contains a React frontend built with Vite. It includes:

- A landing page
- A choice page for rent, home purchase, or land purchase
- Home and land questionnaires
- Hash-based page navigation
- Responsive styling and local image assets

The Prolog matching engine and its connection to the frontend have not been added yet.

## 3. Planned architecture

```text
React/Vite frontend
        |
        | questionnaire answers (JSON)
        v
Backend API
        |
        | converts inputs into safe Prolog queries
        v
Prolog matching engine
        |
        | ranked matches and reasons
        v
Backend API -> React results page
```

Prolog should run on the server side, not directly inside the React browser code. The backend technology and final API format are team decisions that still need to be recorded.

## 4. Repository structure

```text
HavenMatch-AI/
├── PROJECT_GUIDE.md          # Team guide
├── README.md                 # Short repository introduction
├── database/                 # PostgreSQL schema and sample listings
└── vite-project/             # React/Vite frontend
    ├── public/               # Images and other public assets
    ├── src/
    │   ├── components/       # Page sections and questionnaires
    │   ├── App.jsx           # Page selection and navigation
    │   ├── App.css           # Main component styling
    │   ├── index.css         # Global styling
    │   └── main.jsx          # Frontend entry point
    └── package.json          # Dependencies and commands
```

Suggested additions when backend work begins:

```text
backend/
├── server/                   # API code
├── prolog/
│   ├── properties.pl         # Property facts
│   ├── matching_rules.pl     # Matching and ranking rules
│   └── matching_tests.pl     # Prolog tests
└── tests/                    # API/integration tests
```

## 5. Run the frontend locally

### Requirements

- Git
- A current Node.js LTS release
- npm (included with Node.js)

### Setup

From the repository folder:

```powershell
cd vite-project
npm install
npm run dev
```

Open the local address shown in the terminal, normally `http://localhost:5173`.

### Checks before sharing code

```powershell
npm run lint
npm run build
```

## 6. Prolog's role

Prolog will hold the project's logical matching rules. It is well suited to expressing requirements such as:

- A property must be within the user's maximum budget.
- A home must meet the minimum bedroom count.
- A location can be preferred without being mandatory.
- A result can receive a higher ranking when it satisfies more preferences.
- Each recommendation can include human-readable reasons.

Keep these concepts separate:

- **Facts:** property data such as price, location, type, bedrooms, and land area.
- **Hard constraints:** requirements that must be satisfied.
- **Preferences:** desirable features that improve ranking.
- **Explanations:** reasons a property matched or failed a requirement.

Do not send raw user-written text directly into a Prolog query. The backend must validate values and translate them into a defined set of facts or query parameters.

## 7. Data contract to agree on

Before integrating the frontend and Prolog, the team should agree on one shared property and questionnaire format. A possible request is:

```json
{
  "intent": "rent",
  "budget": { "maximum": 800000, "currency": "MMK" },
  "location": ["Bahan", "Sanchaung"],
  "bedrooms": 2,
  "preferences": ["near_public_transport", "allows_pets"]
}
```

A possible response is:

```json
{
  "matches": [
    {
      "propertyId": "home-001",
      "score": 85,
      "reasons": ["within_budget", "preferred_location", "enough_bedrooms"]
    }
  ]
}
```

These examples are proposals, not final interfaces. Update this guide after the team decides on the actual contract.

## 8. Team workflow

1. Pull the latest `main` branch before starting.
2. Create a short-lived branch for one task, for example `feature/prolog-rules` or `fix/questionnaire-navigation`.
3. Keep commits focused and use clear messages.
4. Run the relevant checks locally.
5. Push the branch and open a pull request.
6. Ask at least one teammate to review it.
7. Merge only after feedback is resolved and checks pass.

Avoid pushing unfinished work directly to `main`. Never commit passwords, tokens, API keys, real user answers, or private property-owner information.

## 9. Coding conventions

- Use meaningful component, predicate, and variable names.
- Keep React components focused on one responsibility.
- Put reusable matching logic in Prolog rather than duplicating it in UI components.
- Document unusual business rules and include an example.
- Add tests whenever a matching rule changes.
- Treat questionnaire answers as private data and collect only what the product needs.

## 10. Definition of done

A task is ready for review when:

- The requested behavior works.
- Existing behavior has not been unintentionally changed.
- Linting and builds pass for frontend changes.
- Matching-rule changes include Prolog tests.
- New API behavior is documented with an example.
- No secrets or personal test data are included.
- The pull request explains what changed and how it was checked.

## 11. Suggested next decisions

The team should decide and document:

1. Which backend technology will connect React to Prolog.
2. The canonical questionnaire JSON format.
3. The property data model and source.
4. Which filters are mandatory and which affect ranking.
5. How match scores and explanations will be calculated.
6. How user answers and property data will be protected.
7. Who owns frontend, backend, Prolog rules, data, and testing.

## 12. Getting help

When asking a teammate for help, include:

- What you expected
- What actually happened
- Steps to reproduce the problem
- Any relevant screenshot or error message
- The branch and file you are working on

Keep this guide updated whenever the architecture, setup steps, or team workflow changes.
