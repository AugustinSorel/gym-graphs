package handler

import (
	"log/slog"
	"net/http"
	"time"

	"github.com/a-h/templ"
	"github.com/augustinsorel/gym-graphs/internal/middleware"
	"github.com/augustinsorel/gym-graphs/internal/service"
	"github.com/augustinsorel/gym-graphs/web/stats"
	"github.com/augustinsorel/gym-graphs/web/ui/layout"
)

type StatsHandler struct {
	statsSvc *service.StatsService
	userSvc  *service.UserService
}

func NewStatsHandler(statsSvc *service.StatsService, userSvc *service.UserService) *StatsHandler {
	return &StatsHandler{statsSvc: statsSvc, userSvc: userSvc}
}

func (h *StatsHandler) ViewPage(w http.ResponseWriter, r *http.Request) {
	authSession, _ := middleware.GetAuthSession(r.Context())

	user, err := h.userSvc.GetByID(r.Context(), authSession.UserID)
	if err != nil {
		slog.Error("failed to fetch user for stats page", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	now := time.Now().UTC()

	monthStats, err := h.statsSvc.GetMonthStats(r.Context(), authSession.UserID, user.WeightUnit, now)
	if err != nil {
		slog.Error("failed to fetch month stats", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	page := stats.StatsPage(monthStats, now)
	ctx := templ.WithChildren(r.Context(), page)

	if err := layout.Layout(r.URL.Path).Render(ctx, w); err != nil {
		slog.Error("failed to render stats page", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
	}
}
