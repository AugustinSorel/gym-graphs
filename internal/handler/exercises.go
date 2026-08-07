package handler

import (
	"log/slog"
	"net/http"

	"github.com/a-h/templ"
	"github.com/augustinsorel/gym-graphs/internal/middleware"
	"github.com/augustinsorel/gym-graphs/internal/service"
	"github.com/augustinsorel/gym-graphs/web/exercises"
	"github.com/augustinsorel/gym-graphs/web/ui/layout"
)

type ExercisesHandler struct {
	tagSvc *service.TagService
}

func NewExercisesHandler(tagSvc *service.TagService) *ExercisesHandler {
	return &ExercisesHandler{tagSvc: tagSvc}
}

func (h *ExercisesHandler) ViewPage(w http.ResponseWriter, r *http.Request) {
	page := exercises.ExercisesPage()
	ctx := templ.WithChildren(r.Context(), page)

	if err := layout.Layout(r.URL.Path).Render(ctx, w); err != nil {
		slog.Error("failed to render exercises page", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
	}
}

func (h *ExercisesHandler) ViewNewPage(w http.ResponseWriter, r *http.Request) {
	authSession, _ := middleware.GetAuthSession(r.Context())

	tags, err := h.tagSvc.GetByUserID(r.Context(), authSession.UserID)
	if err != nil {
		slog.Error("failed to fetch tags for new exercise page", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	page := exercises.NewExercisePageWithForm(
		exercises.NewExerciseFormValues{},
		exercises.NewExerciseFormErr{},
		tags,
	)
	ctx := templ.WithChildren(r.Context(), page)

	if err := layout.Layout(r.URL.Path).Render(ctx, w); err != nil {
		slog.Error("failed to render new exercise page", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
	}
}
