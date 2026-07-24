package handler

import (
	"log/slog"
	"net/http"

	"github.com/a-h/templ"
	"github.com/augustinsorel/gym-graphs/web/signin"
	"github.com/augustinsorel/gym-graphs/web/ui/layout"
)

type SignInHandler struct{}

func NewSignInHandler() *SignInHandler {
	return &SignInHandler{}
}

func (h *SignInHandler) ViewPage(w http.ResponseWriter, r *http.Request) {
	page := signin.SignInPage()

	ctx := templ.WithChildren(r.Context(), page)

	err := layout.Layout().Render(ctx, w)

	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		slog.Error("failed to render sign in page", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
}

func (h *SignInHandler) SignIn(w http.ResponseWriter, r *http.Request) {
	// TODO: implement sign in logic
	http.Error(w, "Not Implemented", http.StatusNotImplemented)
}
