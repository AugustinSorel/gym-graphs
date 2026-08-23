package service

import (
	"context"
	"time"

	"github.com/augustinsorel/gym-graphs/internal/database/db"
)

type HeatmapDay struct {
	DateUnixMs int64 `json:"date"`
	VolumeInG  int64 `json:"volumeInG"`
}

func (s *StatsService) GetTrainingHeatmap(ctx context.Context, userID int32) ([]HeatmapDay, error) {
	rows, err := s.queries.GetTrainingDaysByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	days := make([]HeatmapDay, 0, len(rows))
	for _, row := range rows {
		if !row.SessionDate.Valid {
			continue
		}
		d := row.SessionDate.Time.UTC()
		midnight := time.Date(d.Year(), d.Month(), d.Day(), 0, 0, 0, 0, time.UTC)
		days = append(days, HeatmapDay{
			DateUnixMs: midnight.UnixMilli(),
			VolumeInG:  row.VolumeInG,
		})
	}
	return days, nil
}

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

func (s *StatsService) GetWeekStats(ctx context.Context, userID int32, unit db.WeightUnit) (UserStats, error) {
	row, err := s.queries.GetUserStatsByUserIDLast7Days(ctx, userID)
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
