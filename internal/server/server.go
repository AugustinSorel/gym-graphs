package server

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/augustinsorel/gym-graphs/internal/config"
	"github.com/augustinsorel/gym-graphs/internal/database/db"
	"github.com/augustinsorel/gym-graphs/internal/email"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Server struct {
	port    int
	queries *db.Queries
	pool    *pgxpool.Pool
	mailer  email.Mailer
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

//TODO: monitoring
//TODO: analytics
//TODO: rate limiter
