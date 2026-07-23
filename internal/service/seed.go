package service

import (
	"context"

	"github.com/augustinsorel/gym-graphs/internal/database/db"
)

type SeedService struct {
	queries *db.Queries
}

func NewSeedService(queries *db.Queries) *SeedService {
	return &SeedService{queries: queries}
}

// SeedUser seeds initial data for a newly created user.
// TODO: add default exercises, tags, etc.
func (s *SeedService) SeedUser(ctx context.Context, userID int32) error {
	return nil
}
