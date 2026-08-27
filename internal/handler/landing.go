package handler

import (
	"log/slog"
	"net/http"

	"github.com/a-h/templ"
	"github.com/augustinsorel/gym-graphs/web/landing"
	"github.com/augustinsorel/gym-graphs/web/ui/layout"
)

type LandingHandler struct{}

func NewLandingHandler() *LandingHandler {
	return &LandingHandler{}
}

func (h *LandingHandler) ViewPage(w http.ResponseWriter, r *http.Request) {
	page := landing.LandingPage()

	ctx := templ.WithChildren(r.Context(), page)

	err := layout.Layout().Render(ctx, w)

	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		slog.Error("failed to render landing page", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
}
