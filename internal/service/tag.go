package service

import (
	"context"

	"github.com/augustinsorel/gym-graphs/internal/database/db"
)

type TagService struct {
	queries *db.Queries
}

func NewTagService(queries *db.Queries) *TagService {
	return &TagService{queries: queries}
}

func (s *TagService) GetByUserID(ctx context.Context, userID int32) ([]db.Tag, error) {
	tags, err := s.queries.GetTagsByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if tags == nil {
		tags = []db.Tag{}
	}
	return tags, nil
}

func (s *TagService) Create(ctx context.Context, userID int32, name string) (db.Tag, error) {
	return s.queries.CreateTag(ctx, db.CreateTagParams{
		UserID: userID,
		Name:   name,
	})
}
