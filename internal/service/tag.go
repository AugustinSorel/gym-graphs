package service

import (
	"context"

	"github.com/augustinsorel/gym-graphs/internal/database/db"
)

type TagService struct {
	queries *db.Queries
}

const TagsPageSize = 10

type TagsPage struct {
	Rows        []db.Tag
	NextCursor  string
	HasNextPage bool
	TotalCount  int32
}

func NewTagService(queries *db.Queries) *TagService {
	return &TagService{queries: queries}
}

func (s *TagService) CountByUserID(ctx context.Context, userID int32) (int32, error) {
	return s.queries.CountTagsByUserID(ctx, userID)
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

func (s *TagService) GetPageByUserID(ctx context.Context, userID int32, cursor string, totalCount int32) (TagsPage, error) {
	tags, err := s.queries.GetTagsPageByUserID(ctx, db.GetTagsPageByUserIDParams{
		UserID: userID,
		Name:   cursor,
		Limit:  TagsPageSize + 1,
	})
	if err != nil {
		return TagsPage{}, err
	}

	hasNextPage := len(tags) > TagsPageSize
	if hasNextPage {
		tags = tags[:TagsPageSize]
	}

	var nextCursor string
	if hasNextPage {
		nextCursor = tags[len(tags)-1].Name
	}

	if tags == nil {
		tags = []db.Tag{}
	}

	return TagsPage{
		Rows:        tags,
		NextCursor:  nextCursor,
		HasNextPage: hasNextPage,
		TotalCount:  totalCount,
	}, nil
}

func (s *TagService) GetByExerciseID(ctx context.Context, exerciseID int32) ([]db.Tag, error) {
	tags, err := s.queries.GetTagsByExerciseID(ctx, exerciseID)
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

func (s *TagService) GetByID(ctx context.Context, id int32) (db.Tag, error) {
	return s.queries.GetTagByID(ctx, id)
}

func (s *TagService) UpdateName(ctx context.Context, id int32, userID int32, name string) (db.Tag, error) {
	return s.queries.UpdateTagName(ctx, db.UpdateTagNameParams{
		ID:     id,
		UserID: userID,
		Name:   name,
	})
}

func (s *TagService) Delete(ctx context.Context, id int32, userID int32) error {
	return s.queries.DeleteTag(ctx, db.DeleteTagParams{
		ID:     id,
		UserID: userID,
	})
}
