package handler

import (
	"log/slog"
	"net/http"

	"github.com/a-h/templ"
	"github.com/augustinsorel/gym-graphs/web/exercises"
	"github.com/augustinsorel/gym-graphs/web/ui/layout"
)

type ExercisesHandler struct{}

func NewExercisesHandler() *ExercisesHandler {
	return &ExercisesHandler{}
}

func (h *ExercisesHandler) ViewPage(w http.ResponseWriter, r *http.Request) {
	page := exercises.ExercisesPage()
	ctx := templ.WithChildren(r.Context(), page)

	if err := layout.Layout(r.URL.Path).Render(ctx, w); err != nil {
		slog.Error("failed to render exercises page", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
	}
}
