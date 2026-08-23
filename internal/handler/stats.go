package handler

import (
	"log/slog"
	"net/http"

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

	weekStats, err := h.statsSvc.GetWeekStats(r.Context(), authSession.UserID, user.WeightUnit)
	if err != nil {
		slog.Error("failed to fetch week stats", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	heatmap, err := h.statsSvc.GetTrainingHeatmap(r.Context(), authSession.UserID)
	if err != nil {
		slog.Error("failed to fetch training heatmap", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	volumeByTag, err := h.statsSvc.GetVolumeByTag(r.Context(), authSession.UserID)
	if err != nil {
		slog.Error("failed to fetch volume by tag", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	weeklyVolumeTrend, err := h.statsSvc.GetWeeklyVolumeTrend(r.Context(), authSession.UserID)
	if err != nil {
		slog.Error("failed to fetch weekly volume trend", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	page := stats.StatsPage(weekStats, heatmap, volumeByTag, weeklyVolumeTrend)
	ctx := templ.WithChildren(r.Context(), page)

	if err := layout.Layout(r.URL.Path).Render(ctx, w); err != nil {
		slog.Error("failed to render stats page", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
	}
}
