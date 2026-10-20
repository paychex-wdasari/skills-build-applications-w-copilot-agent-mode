# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Keep each capability in its existing React component and use the shared API client with relative `/api` paths. Each view handles loading, API error, empty, and populated states; presentation code does not calculate business results.
- Logic tier decision: Keep Express routes thin and put input validation, reference checks, and capability behavior in `octofitService.ts`. Return deliberate 4xx responses for invalid input or missing records; do not add authentication.
- Data tier decision: Use Mongoose schemas to require the documented fields, use ObjectId references for user/team relationships, and provide an empty-array default for team members. Keep seeding idempotent and preserve records that are not part of the seed fixtures.
- Activity tracking approach: Accept `userId`, `teamId`, `type`, and positive `minutes`; validate ID format and confirm both referenced records exist before writing. Store the references, type, and minutes, set points deterministically to the submitted minutes, and set `occurredAt` when the activity is created.
- Team management approach: Require a non-empty name, preserve the submitted name and mascot, and default members to an empty array. Accept member IDs as references and return/list the stored members without replacing them with presentation-only values.
- Leaderboard approach: Sum activity points by team, include team name, total points, and a 1-based rank, and order results by total points descending. Teams without activities have zero points.
- Workout suggestions approach: Find the user by email; return a 4xx when there is no match. Prefer workouts matching the user's fitness goal, falling back to focus inferred from recent activity, and include a short reason tied to that goal or activity.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend` - run; 4 failed and 1 passed. The schema required-field/default assertions fail for User, Team, Activity, and Workout; seed/idempotency behavior passes. A failure here points to model constraints, defaults, or seed behavior.
- API command: `npm run test:api --prefix octofit-tracker/backend` - run; all 4 failed. Activity/team creation currently returns `501`, leaderboard results are empty, and workout suggestions do not provide the expected activity/goal reason. A failure here points to service behavior, validation, or route error handling.
- Frontend command: `npm test --prefix octofit-tracker/frontend` - run; all 15 failed. The capability views still show `Implementation pending`, so data rendering and loading, empty, and accessible error states are missing. A failure here points to the component/API-client presentation contract.
- Backend build command: `npm run build --prefix octofit-tracker/backend` - not run yet. A failure indicates TypeScript errors in the backend; run after backend changes and the contract tests.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend` - not run yet. A failure indicates TypeScript or Vite build errors; run after frontend changes and its contract tests.
