package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/augustinsorel/gym-graphs/internal/database/db"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrUnsupportedExportVersion = errors.New("unsupported export version")

const (
	maxImportExercises = 1_000
	maxImportTagsPerExercise  = 100
	maxImportSetsPerExercise  = 10_000
)

var (
	minImportTime = time.Date(1970, 1, 1, 0, 0, 0, 0, time.UTC)
	maxImportTime = time.Date(2100, 1, 1, 0, 0, 0, 0, time.UTC)
)

type ExportService struct {
	queries *db.Queries
	pool    *pgxpool.Pool
}

func NewExportService(queries *db.Queries, pool *pgxpool.Pool) *ExportService {
	return &ExportService{queries: queries, pool: pool}
}

type ExportSet struct {
	WeightInG   int32  `json:"weightInG"`
	Repetitions int32  `json:"repetitions"`
	DoneAt      string `json:"doneAt"`
}

type ExportExercise struct {
	Name string      `json:"name"`
	Tags []string    `json:"tags"`
	Sets []ExportSet `json:"sets"`
}

type ExportUser struct {
	Name               string `json:"name"`
	WeightUnit         string `json:"weightUnit"`
	OneRepMaxAlgorithm string `json:"oneRepMaxAlgorithm"`
}

type UserExport struct {
	Version    string           `json:"version"`
	ExportedAt string           `json:"exportedAt"`
	User       ExportUser       `json:"user"`
	Exercises  []ExportExercise `json:"exercises"`
}

func (s *ExportService) ExportUserData(ctx context.Context, user db.User) (UserExport, error) {
	exercises, err := s.queries.GetAllExercisesByUserID(ctx, user.ID)
	if err != nil {
		return UserExport{}, err
	}

	allSets, err := s.queries.GetAllSetsByUserID(ctx, user.ID)
	if err != nil {
		return UserExport{}, err
	}

	allTagRows, err := s.queries.GetAllExerciseTagNamesByUserID(ctx, user.ID)
	if err != nil {
		return UserExport{}, err
	}

	setsByExercise := make(map[int32][]ExportSet, len(exercises))
	for _, s := range allSets {
		setsByExercise[s.ExerciseID] = append(setsByExercise[s.ExerciseID], ExportSet{
			WeightInG:   s.WeightInG,
			Repetitions: s.Repetitions,
			DoneAt:      s.DoneAt.Time.UTC().Format(time.RFC3339),
		})
	}

	tagsByExercise := make(map[int32][]string, len(exercises))
	for _, row := range allTagRows {
		tagsByExercise[row.ExerciseID] = append(tagsByExercise[row.ExerciseID], row.Name)
	}

	exportExercises := make([]ExportExercise, 0, len(exercises))
	for _, ex := range exercises {
		sets := setsByExercise[ex.ID]
		if sets == nil {
			sets = []ExportSet{}
		}

		tags := tagsByExercise[ex.ID]
		if tags == nil {
			tags = []string{}
		}

		exportExercises = append(exportExercises, ExportExercise{
			Name: ex.Name,
			Tags: tags,
			Sets: sets,
		})
	}

	return UserExport{
		Version:    "1",
		ExportedAt: time.Now().UTC().Format(time.RFC3339),
		User: ExportUser{
			Name:               user.Name,
			WeightUnit:         string(user.WeightUnit),
			OneRepMaxAlgorithm: string(user.OneRepMaxAlgorithm),
		},
		Exercises: exportExercises,
	}, nil
}

func (s *ExportService) ImportUserData(ctx context.Context, userID int32, data UserExport) error {
	if data.Version != "1" {
		return fmt.Errorf("%w: %q", ErrUnsupportedExportVersion, data.Version)
	}

	if len(data.Exercises) > maxImportExercises {
		return fmt.Errorf("import contains %d exercises, maximum is %d", len(data.Exercises), maxImportExercises)
	}

	for i, ex := range data.Exercises {
		if len(ex.Tags) > maxImportTagsPerExercise {
			return fmt.Errorf("exercise %d has %d tags, maximum is %d", i, len(ex.Tags), maxImportTagsPerExercise)
		}
		if len(ex.Sets) > maxImportSetsPerExercise {
			return fmt.Errorf("exercise %d has %d sets, maximum is %d", i, len(ex.Sets), maxImportSetsPerExercise)
		}
		for j, set := range ex.Sets {
			t, err := time.Parse(time.RFC3339, set.DoneAt)
			if err != nil {
				return fmt.Errorf("exercise %d set %d: invalid doneAt %q: %w", i, j, set.DoneAt, err)
			}
			if t.Before(minImportTime) || t.After(maxImportTime) {
				return fmt.Errorf("exercise %d set %d: doneAt %q is out of allowed range", i, j, set.DoneAt)
			}
		}
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	txq := db.New(tx)

	for _, ex := range data.Exercises {
		exercise, err := txq.UpsertExercise(ctx, db.UpsertExerciseParams{
			UserID: userID,
			Name:   ex.Name,
		})
		if err != nil {
			return fmt.Errorf("upsert exercise %q: %w", ex.Name, err)
		}

		var tagIDs []int32
		if len(ex.Tags) > 0 {
			tags, err := txq.UpsertTags(ctx, db.UpsertTagsParams{
				UserID:  userID,
				Column2: ex.Tags,
			})
			if err != nil {
				return fmt.Errorf("upsert tags for exercise %q: %w", ex.Name, err)
			}
			tagIDs = make([]int32, len(tags))
			for i, t := range tags {
				tagIDs[i] = t.ID
			}
		}

		if len(tagIDs) > 0 {
			if err := txq.LinkExerciseTags(ctx, db.LinkExerciseTagsParams{
				ExerciseID: exercise.ID,
				Column2:    tagIDs,
			}); err != nil {
				return fmt.Errorf("link tags to exercise %q: %w", ex.Name, err)
			}
		}

		if len(ex.Sets) == 0 {
			continue
		}

		repetitions := make([]int32, len(ex.Sets))
		weights := make([]int32, len(ex.Sets))
		doneAts := make([]pgtype.Timestamptz, len(ex.Sets))

		for i, set := range ex.Sets {
			t, _ := time.Parse(time.RFC3339, set.DoneAt) // already validated above
			repetitions[i] = set.Repetitions
			weights[i] = set.WeightInG
			doneAts[i] = pgtype.Timestamptz{Time: t.UTC(), Valid: true}
		}

		if err := txq.SeedCreateSets(ctx, db.SeedCreateSetsParams{
			ExerciseID: exercise.ID,
			Column2:    repetitions,
			Column3:    weights,
			Column4:    doneAts,
		}); err != nil {
			return fmt.Errorf("insert sets for exercise %q: %w", ex.Name, err)
		}
	}

	return tx.Commit(ctx)
}
