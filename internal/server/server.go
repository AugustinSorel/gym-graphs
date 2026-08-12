package server

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/augustinsorel/gym-graphs/internal/analytics"
	"github.com/augustinsorel/gym-graphs/internal/config"
	"github.com/augustinsorel/gym-graphs/internal/database/db"
	"github.com/augustinsorel/gym-graphs/internal/email"
	"github.com/augustinsorel/gym-graphs/internal/ratelimit"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Server struct {
	port    int
	queries *db.Queries
	pool    *pgxpool.Pool
	mailer  email.Mailer
	tracker analytics.Tracker

	passwordAuthRateLimit          *ratelimit.Limit
	emailRateLimit                 *ratelimit.Limit
	emailCodeVerificationRateLimit *ratelimit.Limit
	requestRateLimit               *ratelimit.Limit
}

func NewServer(cfg *config.Config) *http.Server {
	pool, err := pgxpool.New(context.Background(), cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("unable to connect to database: %v", err)
	}

	mailer, err := newMailer(cfg)
	if err != nil {
		log.Fatalf("unable to create mailer: %v", err)
	}

	s := &Server{
		port:    cfg.Port,
		queries: db.New(pool),
		pool:    pool,
		mailer:  mailer,
		tracker: newTracker(cfg),

		passwordAuthRateLimit:          ratelimit.NewLimit(1_000, 5, time.Minute),
		emailRateLimit:                 ratelimit.NewLimit(1_000, 5, 30*time.Minute),
		emailCodeVerificationRateLimit: ratelimit.NewLimit(1_000, 5, time.Minute),
		requestRateLimit:               ratelimit.NewLimit(10_000, 100, time.Second),
	}

	return &http.Server{
		Addr:         fmt.Sprintf(":%d", s.port),
		Handler:      s.RegisterRoutes(),
		IdleTimeout:  time.Minute,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
	}
}

func newMailer(cfg *config.Config) (email.Mailer, error) {
	if cfg.AppEnv == "production" {
		return email.NewSESMailer(cfg)
	}
	return email.NewSMTPMailer(cfg), nil
}

func newTracker(cfg *config.Config) analytics.Tracker {
	if cfg.UmamiHref != "" && cfg.UmamiWebsiteID != "" {
		return analytics.NewUmamiTracker(cfg.UmamiHref, cfg.UmamiWebsiteID)
	}
	return analytics.NoopTracker{}
}

//TODO: monitoring
//TODO: optimisation
//TODO: mobile support
//TODO: redo create tag page
//TODO: redo create exercise page
