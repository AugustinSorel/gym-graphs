package service

import (
	"context"
	"time"

	"github.com/augustinsorel/gym-graphs/internal/database/db"
	"github.com/jackc/pgx/v5/pgtype"
)

// GetWeeklyVolumePoints returns total volume per day across all exercises
// for the last 7 days (today and the 6 preceding days).
// It reuses VolumeSessionPoint defined in exercise.go.
func (s *StatsService) GetWeeklyVolumePoints(ctx context.Context, userID int32) ([]VolumeSessionPoint, error) {
	rows, err := s.queries.GetVolumePerDayLast7DaysByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	today := time.Now().UTC().Truncate(24 * time.Hour)
	points := make([]VolumeSessionPoint, 0, len(rows))
	for _, row := range rows {
		if !row.SessionDate.Valid {
			continue
		}
		d := row.SessionDate.Time
		sessionDay := time.Date(d.Year(), d.Month(), d.Day(), 0, 0, 0, 0, time.UTC)
		dayOffset := int(sessionDay.Sub(today).Hours() / 24)
		points = append(points, VolumeSessionPoint{
			DayOffset: dayOffset,
			VolumeInG: row.VolumeInG,
		})
	}
	return points, nil
}

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

func (s *StatsService) GetWeekStats(ctx context.Context, userID int32, unit db.WeightUnit, week time.Time) (UserStats, error) {
	row, err := s.queries.GetUserStatsByUserIDAndWeek(ctx, db.GetUserStatsByUserIDAndWeekParams{
		UserID:  userID,
		Column2: pgtype.Timestamptz{Time: week, Valid: true},
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
