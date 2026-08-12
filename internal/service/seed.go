package service

import (
	"context"
	"time"

	"github.com/augustinsorel/gym-graphs/internal/database/db"
	"github.com/jackc/pgx/v5/pgtype"
)

type SeedService struct {
	queries *db.Queries
}

func NewSeedService(queries *db.Queries) *SeedService {
	return &SeedService{queries: queries}
}

var seedTags = []string{
	"legs", "chest", "biceps", "triceps", "back",
	"shoulders", "calfs", "abs", "traps",
}

var seedExercises = []struct {
	name string
	tags []string
	sets [][3]int32 // {weightInMg, repetitions, daysAgo}
}{
	{
		name: "bench press",
		tags: []string{"chest"},
		sets: [][3]int32{
			{10_000_000, 10, 1},
			{20_000_000, 20, 2},
			{10_000_000, 10, 3},
			{30_000_000, 30, 4},
			{10_000_000, 9, 1},
			{20_000_000, 18, 2},
			{10_000_000, 7, 3},
		},
	},
	{
		name: "squat",
		tags: []string{"legs"},
		sets: [][3]int32{
			{20_000_000, 20, 1},
			{10_000_000, 10, 2},
			{30_000_000, 30, 3},
			{10_000_000, 10, 4},
			{10_000_000, 7, 1},
			{30_000_000, 24, 2},
			{10_000_000, 1, 3},
		},
	},
	{
		name: "deadlift",
		tags: []string{"legs", "calfs"},
		sets: [][3]int32{
			{30_000_000, 30, 1},
			{10_000_000, 10, 2},
			{20_000_000, 20, 3},
			{30_000_000, 30, 4},
			{10_000_000, 6, 1},
			{20_000_000, 12, 2},
		},
	},
}

func (s *SeedService) SeedUser(ctx context.Context, userID int32) error {
	tags, err := s.queries.CreateTags(ctx, db.CreateTagsParams{UserID: userID, Column2: seedTags})
	if err != nil {
		return err
	}
	tagIDs := make(map[string]int32, len(tags))
	for _, tag := range tags {
		tagIDs[tag.Name] = tag.ID
	}

	now := time.Now()

	for _, ex := range seedExercises {
		exercise, err := s.queries.CreateExercise(ctx, db.CreateExerciseParams{UserID: userID, Name: ex.name})
		if err != nil {
			return err
		}

		ids := make([]int32, len(ex.tags))
		for i, name := range ex.tags {
			ids[i] = tagIDs[name]
		}
		if err := s.queries.CreateExerciseTags(ctx, db.CreateExerciseTagsParams{ExerciseID: exercise.ID, Column2: ids}); err != nil {
			return err
		}

		repetitions := make([]int32, len(ex.sets))
		weightsInG := make([]int32, len(ex.sets))
		timestamps := make([]pgtype.Timestamptz, len(ex.sets))
		for i, set := range ex.sets {
			repetitions[i] = set[1]
			weightsInG[i] = set[0] / 1000
			timestamps[i] = pgtype.Timestamptz{Time: now.AddDate(0, 0, -int(set[2])), Valid: true}
		}

		if err := s.queries.SeedCreateSets(ctx, db.SeedCreateSetsParams{
			ExerciseID: exercise.ID,
			Column2:    repetitions,
			Column3:    weightsInG,
			Column4:    timestamps,
		}); err != nil {
			return err
		}
	}

	return nil
}
