package server

import (
	"fmt"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/augustinsorel/gym-graphs/internal/database"
	"github.com/augustinsorel/gym-graphs/internal/db"
)

type Server struct {
	port    int
	db      database.Service
	queries *db.Queries
}

func NewServer() *http.Server {
	port, err := strconv.Atoi(os.Getenv("PORT"))

	if err != nil {
		panic(err)
	}

	dbService := database.New()

	NewServer := &Server{
		port:    port,
		db:      dbService,
		queries: db.New(dbService.Pool()),
	}

	// Declare Server config
	server := &http.Server{
		Addr:         fmt.Sprintf(":%d", NewServer.port),
		Handler:      NewServer.RegisterRoutes(),
		IdleTimeout:  time.Minute,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
	}

	return server
}
