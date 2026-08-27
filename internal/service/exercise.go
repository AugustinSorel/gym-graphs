package service

import (
	"context"
	"math"
	"time"

	"github.com/augustinsorel/gym-graphs/internal/database/db"
	"github.com/augustinsorel/gym-graphs/internal/onerm"
	"github.com/augustinsorel/gym-graphs/internal/weightunit"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ExerciseService struct {
	queries *db.Queries
	pool    *pgxpool.Pool
}

func NewExerciseService(queries *db.Queries, pool *pgxpool.Pool) *ExerciseService {
	return &ExerciseService{queries: queries, pool: pool}
}

const ExercisesPageSize = 30

type ExerciseRow = db.GetExercisesPageByUserIDRow

type ExercisesPage struct {
	Rows               []ExerciseRow
	TotalCount         int64
	AllExercisesCount  int64
	NextCursor         int32
	HasNextPage        bool
	FirstIndex         int32
	WeightUnit         db.WeightUnit
	OneRepMaxAlgorithm db.OneRepMaxAlgorithm
	AllTags            []db.Tag
	ActiveTagIDs       []int32
}

const InitialCursor = math.MaxInt32

func (s *ExerciseService) GetPage(ctx context.Context, user db.User, cursor int32) (ExercisesPage, error) {
	exercises, err := s.queries.GetExercisesPageByUserID(ctx, db.GetExercisesPageByUserIDParams{
		UserID: user.ID,
		ID:     cursor,
		Limit:  ExercisesPageSize + 1,
	})
	if err != nil {
		return ExercisesPage{}, err
	}

	hasNextPage := len(exercises) > ExercisesPageSize
	if hasNextPage {
		exercises = exercises[:ExercisesPageSize]
	}

	// NextCursor is the smallest index on this page; the next page fetches index < that.
	var nextCursor int32
	if hasNextPage {
		nextCursor = exercises[len(exercises)-1].ID
	}

	count, err := s.queries.GetExercisesCountByUserID(ctx, user.ID)
	if err != nil {
		return ExercisesPage{}, err
	}

	var firstIndex int32
	if len(exercises) > 0 {
		firstIndex = exercises[0].ID
	}

	return ExercisesPage{
		Rows:               exercises,
		TotalCount:         count,
		AllExercisesCount:  count,
		NextCursor:         nextCursor,
		HasNextPage:        hasNextPage,
		FirstIndex:         firstIndex,
		WeightUnit:         user.WeightUnit,
		OneRepMaxAlgorithm: user.OneRepMaxAlgorithm,
	}, nil
}

func (s *ExerciseService) GetPageByTagIDs(ctx context.Context, user db.User, tagIDs []int32, cursor int32) (ExercisesPage, error) {
	raw, err := s.queries.GetExercisesPageByUserIDAndTagIDs(ctx, db.GetExercisesPageByUserIDAndTagIDsParams{
		UserID:  user.ID,
		Column2: tagIDs,
		ID:      cursor,
		Limit:   ExercisesPageSize + 1,
	})
	if err != nil {
		return ExercisesPage{}, err
	}

	hasNextPage := len(raw) > ExercisesPageSize
	if hasNextPage {
		raw = raw[:ExercisesPageSize]
	}

	var nextCursor int32
	if hasNextPage {
		nextCursor = raw[len(raw)-1].ID
	}

	exercises := make([]ExerciseRow, len(raw))
	for i, r := range raw {
		exercises[i] = ExerciseRow{
			ID:                 r.ID,
			UserID:             r.UserID,
			Name:               r.Name,
			UpdatedAt:          r.UpdatedAt,
			CreatedAt:          r.CreatedAt,
			SetsCount:          r.SetsCount,
			LastSetWeightInG:   r.LastSetWeightInG,
			LastSetRepetitions: r.LastSetRepetitions,
			LastSetDoneAt:      r.LastSetDoneAt,
			PrevSetWeightInG:   r.PrevSetWeightInG,
			PrevSetRepetitions: r.PrevSetRepetitions,
		}
	}

	count, err := s.queries.GetExercisesCountByUserIDAndTagIDs(ctx, db.GetExercisesCountByUserIDAndTagIDsParams{
		UserID:  user.ID,
		Column2: tagIDs,
	})
	if err != nil {
		// If no rows match, count returns no rows — treat that as 0.
		count = 0
	}

	allCount, err := s.queries.GetExercisesCountByUserID(ctx, user.ID)
	if err != nil {
		return ExercisesPage{}, err
	}

	var firstIndex int32
	if len(exercises) > 0 {
		firstIndex = exercises[0].ID
	}

	return ExercisesPage{
		Rows:               exercises,
		TotalCount:         count,
		AllExercisesCount:  allCount,
		NextCursor:         nextCursor,
		HasNextPage:        hasNextPage,
		FirstIndex:         firstIndex,
		WeightUnit:         user.WeightUnit,
		OneRepMaxAlgorithm: user.OneRepMaxAlgorithm,
	}, nil
}

func (s *ExerciseService) GetByIDAndUserID(ctx context.Context, id int32, userID int32) (db.Exercise, error) {
	return s.queries.GetExerciseByIDAndUserID(ctx, db.GetExerciseByIDAndUserIDParams{
		ID:     id,
		UserID: userID,
	})
}

func (s *ExerciseService) UpdateName(ctx context.Context, id int32, userID int32, name string) (db.Exercise, error) {
	return s.queries.UpdateExerciseName(ctx, db.UpdateExerciseNameParams{
		ID:     id,
		UserID: userID,
		Name:   name,
	})
}

func (s *ExerciseService) Delete(ctx context.Context, id int32, userID int32) error {
	return s.queries.DeleteExercise(ctx, db.DeleteExerciseParams{
		ID:     id,
		UserID: userID,
	})
}

func (s *ExerciseService) Best1RM(ctx context.Context, exerciseID int32, algorithm db.OneRepMaxAlgorithm) (float64, error) {
	sets, err := s.queries.GetSetsByExerciseID(ctx, exerciseID)
	if err != nil {
		return 0, err
	}

	var best float64
	for _, set := range sets {
		if set.WeightInG <= 0 || set.Repetitions <= 0 {
			continue
		}
		v := onerm.Compute(float64(set.WeightInG), float64(set.Repetitions), algorithm)
		if v > best {
			best = v
		}
	}
	return best, nil
}

type ExerciseFunFacts struct {
	Best1RMInG       float64
	BestSetWeightInG float64
	BestSetReps      int
	TotalSessions    int
	AvgRepsPerSet    float64
	TotalSets        int
}

func (s *ExerciseService) FunFacts(ctx context.Context, exerciseID int32, algorithm db.OneRepMaxAlgorithm) (ExerciseFunFacts, error) {
	stats, err := s.queries.GetExerciseStatsByID(ctx, exerciseID)
	if err != nil {
		return ExerciseFunFacts{}, err
	}

	best1rm, err := s.Best1RM(ctx, exerciseID, algorithm)
	if err != nil {
		return ExerciseFunFacts{}, err
	}

	bestSet, err := s.queries.GetBestSetByExerciseID(ctx, exerciseID)
	if err != nil && int(stats.TotalSets) > 0 {
		return ExerciseFunFacts{}, err
	}

	return ExerciseFunFacts{
		Best1RMInG:       best1rm,
		BestSetWeightInG: float64(bestSet.WeightInG),
		BestSetReps:      int(bestSet.Repetitions),
		TotalSessions:    int(stats.TotalSessions),
		AvgRepsPerSet:    stats.AvgReps,
		TotalSets:        int(stats.TotalSets),
	}, nil
}

type ExerciseGraphPoint struct {
	DateUnixMs int64   `json:"date"`
	OneRepMax  float64 `json:"oneRepMax"`
}

func (s *ExerciseService) GraphPoints(ctx context.Context, exerciseID int32, algorithm db.OneRepMaxAlgorithm, unit db.WeightUnit) ([]ExerciseGraphPoint, error) {
	sets, err := s.queries.GetSetsByExerciseID(ctx, exerciseID)
	if err != nil {
		return nil, err
	}

	type dayKey = [3]int // {year, month, day} in UTC
	bestPerDay := make(map[dayKey]float64)
	dayOrder := make([]dayKey, 0, len(sets))

	for _, set := range sets {
		if set.WeightInG <= 0 || set.Repetitions <= 0 {
			continue
		}
		t := set.DoneAt.Time.UTC()
		key := dayKey{t.Year(), int(t.Month()), t.Day()}
		orm := onerm.Compute(float64(set.WeightInG), float64(set.Repetitions), algorithm)
		if _, seen := bestPerDay[key]; !seen {
			dayOrder = append(dayOrder, key)
		}
		if orm > bestPerDay[key] {
			bestPerDay[key] = orm
		}
	}

	points := make([]ExerciseGraphPoint, 0, len(dayOrder))
	for _, key := range dayOrder {
		midnight := time.Date(key[0], time.Month(key[1]), key[2], 0, 0, 0, 0, time.UTC)
		points = append(points, ExerciseGraphPoint{
			DateUnixMs: midnight.UnixMilli(),
			OneRepMax:  weightunit.Convert(bestPerDay[key], unit),
		})
	}
	return points, nil
}

type RepsRangeBucket struct {
	Label string `json:"label"`
	Count int    `json:"count"`
}

func (s *ExerciseService) RepsRange(ctx context.Context, exerciseID int32) ([]RepsRangeBucket, error) {
	row, err := s.queries.GetRepsRangeByExerciseID(ctx, exerciseID)
	if err != nil {
		return nil, err
	}

	return []RepsRangeBucket{
		{Label: "1-5", Count: int(row.Reps15)},
		{Label: "6-8", Count: int(row.Reps68)},
		{Label: "9-12", Count: int(row.Reps912)},
		{Label: "13+", Count: int(row.Reps13Plus)},
	}, nil
}

type VolumeSessionPoint struct {
	// DayOffset is 0 for today, -1 for yesterday, … -6 for 6 days ago.
	DayOffset int   `json:"dayOffset"`
	VolumeInG int64 `json:"volumeInG"`
}

func (s *ExerciseService) VolumePerSessionLast7Days(ctx context.Context, exerciseID int32) ([]VolumeSessionPoint, error) {
	rows, err := s.queries.GetVolumePerSessionLast7DaysByExerciseID(ctx, exerciseID)
	if err != nil {
		return nil, err
	}

	today := time.Now().UTC().Truncate(24 * time.Hour)
	points := make([]VolumeSessionPoint, 0, len(rows))
	for _, row := range rows {
		if !row.SessionDate.Valid {
			continue
		}
		d := row.SessionDate.Time.UTC()
		sessionDay := time.Date(d.Year(), d.Month(), d.Day(), 0, 0, 0, 0, time.UTC)
		dayOffset := int(sessionDay.Sub(today).Hours() / 24)
		points = append(points, VolumeSessionPoint{
			DayOffset: dayOffset,
			VolumeInG: row.VolumeInG,
		})
	}
	return points, nil
}

type SessionFrequencyPoint struct {
	// WeekOffset is 0 for the current week, -1 for last week, … -7 for 7 weeks ago.
	WeekOffset   int `json:"weekOffset"`
	SessionCount int `json:"sessionCount"`
}

func (s *ExerciseService) SessionFrequencyLast8Weeks(ctx context.Context, exerciseID int32) ([]SessionFrequencyPoint, error) {
	rows, err := s.queries.GetSessionFrequencyLast8WeeksByExerciseID(ctx, exerciseID)
	if err != nil {
		return nil, err
	}

	now := time.Now().UTC()
	// Start of the current ISO week (Monday)
	weekday := int(now.Weekday())
	if weekday == 0 {
		weekday = 7
	}
	currentWeekStart := now.AddDate(0, 0, -(weekday - 1)).Truncate(24 * time.Hour)

	points := make([]SessionFrequencyPoint, 0, len(rows))
	for _, row := range rows {
		if !row.WeekStart.Valid {
			continue
		}
		d := row.WeekStart.Time.UTC()
		ws := time.Date(d.Year(), d.Month(), d.Day(), 0, 0, 0, 0, time.UTC)
		weekOffset := int(ws.Sub(currentWeekStart).Hours() / (24 * 7))
		points = append(points, SessionFrequencyPoint{
			WeekOffset:   weekOffset,
			SessionCount: int(row.SessionCount),
		})
	}
	return points, nil
}

func (s *ExerciseService) SetTags(ctx context.Context, exerciseID int32, tagIDs []int32) error {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	txq := db.New(tx)

	if err := txq.DeleteExerciseTags(ctx, exerciseID); err != nil {
		return err
	}

	if len(tagIDs) > 0 {
		if err := txq.CreateExerciseTags(ctx, db.CreateExerciseTagsParams{
			ExerciseID: exerciseID,
			Column2:    tagIDs,
		}); err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}

func (s *ExerciseService) Create(ctx context.Context, userID int32, name string, tagIDs []int32) (db.Exercise, error) {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return db.Exercise{}, err
	}
	defer tx.Rollback(ctx)

	txq := db.New(tx)

	exercise, err := txq.CreateExercise(ctx, db.CreateExerciseParams{
		UserID: userID,
		Name:   name,
	})
	if err != nil {
		return db.Exercise{}, err
	}

	if len(tagIDs) > 0 {
		if err := txq.CreateExerciseTags(ctx, db.CreateExerciseTagsParams{
			ExerciseID: exercise.ID,
			Column2:    tagIDs,
		}); err != nil {
			return db.Exercise{}, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return db.Exercise{}, err
	}

	return exercise, nil
}
