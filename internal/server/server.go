package server

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/augustinsorel/gym-graphs/internal/database/db"
	"github.com/augustinsorel/gym-graphs/internal/email"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Server struct {
	port     int
	queries  *db.Queries
	pool     *pgxpool.Pool
	emailSvc *email.Service
}

func NewServer() *http.Server {
	port, err := strconv.Atoi(os.Getenv("PORT"))
	if err != nil {
		panic(err)
	}

	connStr := os.Getenv("DATABASE_URL")

	pool, err := pgxpool.New(context.Background(), connStr)
	if err != nil {
		log.Fatalf("unable to connect to database: %v", err)
	}

	emailSvc, err := email.NewService()
	if err != nil {
		log.Fatalf("unable to create email service: %v", err)
	}

	s := &Server{
		port:     port,
		queries:  db.New(pool),
		pool:     pool,
		emailSvc: emailSvc,
	}

	return &http.Server{
		Addr:         fmt.Sprintf(":%d", s.port),
		Handler:      s.RegisterRoutes(),
		IdleTimeout:  time.Minute,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
	}
}

//FIX: env
//TODO: monitoring
//TODO: analytics
//TODO: rate limiter
//TODO: fix devenv
