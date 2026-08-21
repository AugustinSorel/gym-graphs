# Stats Page Enhancement Plan

## Context

**Project:** gym-graphs — a Go server-rendered web app (Go + templ + HTMX + D3.js + PostgreSQL).

**Current stats page (`/stats`):** Four plain numeric stat cards for the current ISO week (total volume, total sets, total weight lifted, exercise count). No charts.

**Goal:** Add three new sections to the stats page — a weekly volume bar chart, a training heatmap, and a personal records feed — without any database schema changes.

---

## Chosen Features

1. **Weekly volume bar chart** — total volume across all exercises per day, last 7 days
2. **Training heatmap** — GitHub-style calendar (26 weeks × 7 days), shaded by daily volume
3. **Personal records feed** — list of recent 1RM PRs per exercise (computed Go-side)

**Time window:** Fixed — "this week" / last N weeks. No toggle.

---

## Data Available (no schema changes needed)

All data derives from existing tables:

- `sets` — `weight_in_g` (stored as integer grams), `repetitions`, `done_at` (timestamptz), `exercise_id`
- `exercises` — `id`, `user_id`, `name`
- `users` — `weight_unit` (kg | lbs), `one_rep_max_algorithm`

The 1RM is computed Go-side using `/internal/onerm/onerm.go` (13 formula variants, user-configurable).

---

## Target Page Layout

```
/stats
├── Section: week N              ← existing 4 stat cards (untouched)
├── Section: weekly volume       ← NEW bar chart (all exercises, 7 days)
├── Section: training calendar   ← NEW heatmap (26 weeks)
└── Section: recent PRs          ← NEW list of PR events
```

---

## Implementation Plan

### 1. New SQL Queries

**File:** `internal/database/queries/sets.sql`  
**Then run:** `sqlc generate` to regenerate `internal/database/db/sets.sql.go`

Add two new queries:

```sql
-- name: GetVolumePerDayLast7DaysByUserID :many
select
    date_trunc('day', s.done_at)::date                          as session_date,
    sum(s.weight_in_g::bigint * s.repetitions::bigint)::bigint  as volume_in_g
from sets s
join exercises e on e.id = s.exercise_id
where e.user_id = $1
  and s.done_at >= date_trunc('day', now()) - interval '6 days'
group by session_date
order by session_date asc;

-- name: GetTrainingDaysByUserID :many
select
    date_trunc('day', s.done_at)::date                          as session_date,
    sum(s.weight_in_g::bigint * s.repetitions::bigint)::bigint  as volume_in_g
from sets s
join exercises e on e.id = s.exercise_id
where e.user_id = $1
  and s.done_at >= date_trunc('week', now()) - interval '25 weeks'
group by session_date
order by session_date asc;
```

The PR detection reuses the **existing** `GetAllSetsByUserID` query — no new SQL needed.

---

### 2. Service Layer

**File:** `internal/service/stats.go`

Add three new methods to `StatsService`. The service will need access to `db.Queries` (already has it) and the `onerm` + `weightunit` packages.

#### `GetWeeklyVolumePoints`

```go
// Returns daily volume totals across all exercises for the last 7 days.
// Reuses the existing VolumeSessionPoint type from service/exercise.go.
func (s *StatsService) GetWeeklyVolumePoints(ctx context.Context, userID int32) ([]VolumeSessionPoint, error)
```

Calls `GetVolumePerDayLast7DaysByUserID`, maps `session_date` → `DayOffset` (0 = today, -6 = 6 days ago), same logic as `ExerciseService.VolumePerSessionLast7Days`.

#### `GetTrainingHeatmap`

```go
type HeatmapDay struct {
    DateUnixMs int64 `json:"date"`
    VolumeInG  int64 `json:"volumeInG"`
}

// Returns one entry per training day in the last 26 weeks.
func (s *StatsService) GetTrainingHeatmap(ctx context.Context, userID int32) ([]HeatmapDay, error)
```

Calls `GetTrainingDaysByUserID`, maps each row to `HeatmapDay`.

#### `GetRecentPRs`

```go
type PREvent struct {
    ExerciseName string  `json:"exerciseName"`
    NewBestInG   float64 `json:"newBestInG"`
    DoneAt       int64   `json:"doneAt"` // unix ms
}

// Returns up to 10 most recent 1RM personal records across all exercises.
func (s *StatsService) GetRecentPRs(ctx context.Context, userID int32, algorithm db.OneRepMaxAlgorithm, unit db.WeightUnit) ([]PREvent, error)
```

Algorithm:
1. Call existing `GetAllSetsByUserID` (returns all sets ordered by `exercise_id asc, done_at asc`)
2. Iterate sets grouped by `exercise_id`, tracking running best 1RM per exercise
3. When a set produces a new best 1RM, emit a `PREvent` (exercise name needs a join — consider a new query or a separate `GetExercisesByUserID` call)
4. Sort all events by `DoneAt desc`, return the latest 10

> **Note:** To get exercise names alongside sets, you may need a new query or to join exercises in `GetAllSetsByUserID`. Check if `GetAllSetsByUserID` already returns `exercise name` — it currently does not. Add a variant `GetAllSetsByUserIDWithName` or do a separate `GetExercisesByUserID` lookup map.

---

### 3. Handler

**File:** `internal/handler/stats.go`

The handler already fetches `user` (for `WeightUnit` and `OneRepMaxAlgorithm`). Wire up three new service calls:

```go
weeklyVolume, err := h.statsSvc.GetWeeklyVolumePoints(r.Context(), authSession.UserID)
heatmap, err      := h.statsSvc.GetTrainingHeatmap(r.Context(), authSession.UserID)
recentPRs, err    := h.statsSvc.GetRecentPRs(r.Context(), authSession.UserID, user.OneRepMaxAlgorithm, user.WeightUnit)
```

Pass all three into the template alongside the existing `weekStats`.

---

### 4. Template

**File:** `web/stats/stats.templ`

Add three `<section>` blocks below the existing week cards:

#### Weekly Volume Section

```html
<section>
  <h2>this week's volume</h2>
  @templ.JSONScript("stats-volume-data", weeklyVolumePoints)
  <div id="stats-volume-graph" data-unit="{ weightunit.Abbr(s.WeightUnit) }"></div>
</section>
```

#### Training Heatmap Section

```html
<section>
  <h2>training calendar</h2>
  @templ.JSONScript("stats-heatmap-data", heatmapDays)
  <div id="stats-heatmap" data-unit="{ weightunit.Abbr(s.WeightUnit) }"></div>
</section>
```

#### Recent PRs Section

```html
<section>
  <h2>personal records</h2>
  <ul>
    for _, pr := range recentPRs {
      <li>
        <span>{ pr.ExerciseName }</span>
        <span>{ weightunit.Format(pr.NewBestInG, unit) } { weightunit.Abbr(unit) }</span>
        <time>{ formatRelativeTime(pr.DoneAt) }</time>
      </li>
    }
  </ul>
</section>
```

The PRs section is server-rendered HTML — no JS chart needed.

---

### 5. JavaScript Charts

#### `web/assets/js/stats-volume-graph.js`

Copy and adapt `exercise-volume-session-graph.js`:
- Change element ID from `exercise-volume-session-graph` / `exercise-volume-session-data` to `stats-volume-graph` / `stats-volume-data`
- Everything else (D3 bar chart, ResizeObserver, tooltip) is identical

#### `web/assets/js/stats-heatmap.js`

New D3 chart — GitHub contribution calendar style:

- **Grid:** 26 columns (weeks) × 7 rows (Mon–Sun), each cell = one `<rect>`
- **Color:** opacity of `--color-on-surface` scaled linearly by `volumeInG` (0 = invisible/ghost, max = full opacity)
- **Labels:** week numbers or month names on x-axis; Mon/Wed/Fri on y-axis
- **Tooltip:** on hover, show date + volume (converted to user's weight unit)
- **Data source:** `<script id="stats-heatmap-data">` JSON array of `{date, volumeInG}`
- **Pattern:** same `DOMContentLoaded` + `ResizeObserver` as all other chart files

---

### 6. Load New JS Files

**File:** `web/ui/layout/layout.templ`

The layout already loads all JS files globally. Add:

```html
<script src="/assets/js/stats-volume-graph.js" defer></script>
<script src="/assets/js/stats-heatmap.js" defer></script>
```

---

## Key File Reference

| Purpose | Path |
|---|---|
| Stats page template | `web/stats/stats.templ` |
| Stats HTTP handler | `internal/handler/stats.go` |
| Stats service | `internal/service/stats.go` |
| Exercise service (1RM, VolumeSessionPoint) | `internal/service/exercise.go` |
| SQL queries source | `internal/database/queries/sets.sql` |
| Generated SQL Go code | `internal/database/db/sets.sql.go` |
| 1RM computation | `internal/onerm/onerm.go` |
| Weight unit conversion | `internal/weightunit/weightunit.go` |
| HTML layout (loads JS) | `web/ui/layout/layout.templ` |
| Existing volume bar chart (reference) | `web/assets/js/exercise-volume-session-graph.js` |
| Existing 1RM line chart (reference) | `web/assets/js/exercise-graph.js` |

---

## What Requires No Changes

- Database schema — no new tables or columns
- Auth / session handling — handler already extracts `userID` and `user`
- Weight unit / 1RM algorithm preferences — already on `user`, passed through as-is
- D3.js / HTMX / Tailwind setup — already present globally

---

## Effort Estimate

| Task | Size |
|---|---|
| 2 new SQL queries + `sqlc generate` | Small |
| 3 new service methods | Small–Medium |
| Handler wiring | Small |
| Template additions | Small |
| `stats-volume-graph.js` (adapted copy) | Small |
| `stats-heatmap.js` (new D3 chart) | Medium |

**Total estimated effort:** 1–2 hours.
