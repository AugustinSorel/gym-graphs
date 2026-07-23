package server

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/augustinsorel/gym-graphs/internal/db/sqlc"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Server struct {
	port    int
	queries *sqlc.Queries
	pool    *pgxpool.Pool
}

func NewServer() *http.Server {
	port, err := strconv.Atoi(os.Getenv("PORT"))
	if err != nil {
		panic(err)
	}

	connStr := fmt.Sprintf(
		"postgres://%s:%s@%s:%s/%s?sslmode=disable&search_path=%s",
		os.Getenv("DB_USERNAME"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_HOST"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_DATABASE"),
		os.Getenv("DB_SCHEMA"),
	)

	pool, err := pgxpool.New(context.Background(), connStr)
	if err != nil {
		log.Fatalf("unable to connect to database: %v", err)
	}

	s := &Server{
		port:    port,
		queries: sqlc.New(pool),
		pool:    pool,
	}

	return &http.Server{
		Addr:         fmt.Sprintf(":%d", s.port),
		Handler:      s.RegisterRoutes(),
		IdleTimeout:  time.Minute,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
	}
}
