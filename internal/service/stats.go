package service

import (
	"context"
	"time"

	"github.com/augustinsorel/gym-graphs/internal/database/db"
	"github.com/jackc/pgx/v5/pgtype"
)

type StatsService struct {
	queries *db.Queries
}

func NewStatsService(queries *db.Queries) *StatsService {
	return &StatsService{queries: queries}
}

type UserStats struct {
	TotalSets      int32
	TotalVolumeInG int64
	TotalWeightInG int64
	ExercisesCount int32
	WeightUnit     db.WeightUnit
}

func (s *StatsService) GetUserStats(ctx context.Context, userID int32, unit db.WeightUnit) (UserStats, error) {
	row, err := s.queries.GetUserStatsByUserID(ctx, userID)
	if err != nil {
		return UserStats{}, err
	}

	return UserStats{
		TotalSets:      row.TotalSets,
		TotalVolumeInG: row.TotalVolumeInG,
		TotalWeightInG: row.TotalWeightInG,
		ExercisesCount: row.ExercisesCount,
		WeightUnit:     unit,
	}, nil
}

func (s *StatsService) GetMonthStats(ctx context.Context, userID int32, unit db.WeightUnit, month time.Time) (UserStats, error) {
	row, err := s.queries.GetUserStatsByUserIDAndMonth(ctx, db.GetUserStatsByUserIDAndMonthParams{
		UserID:  userID,
		Column2: pgtype.Timestamptz{Time: month, Valid: true},
	})
	if err != nil {
		return UserStats{}, err
	}

	return UserStats{
		TotalSets:      row.TotalSets,
		TotalVolumeInG: row.TotalVolumeInG,
		TotalWeightInG: row.TotalWeightInG,
		ExercisesCount: row.ExercisesCount,
		WeightUnit:     unit,
	}, nil
}
