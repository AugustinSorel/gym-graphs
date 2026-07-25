package handler

import (
	"log/slog"
	"net/http"

	"github.com/a-h/templ"
	"github.com/augustinsorel/gym-graphs/web/resetpassword"
	"github.com/augustinsorel/gym-graphs/web/ui/layout"
)

type ResetPasswordHandler struct{}

func NewResetPasswordHandler() *ResetPasswordHandler {
	return &ResetPasswordHandler{}
}

func (h *ResetPasswordHandler) ViewPage(w http.ResponseWriter, r *http.Request) {
	page := resetpassword.ResetPasswordPage()

	ctx := templ.WithChildren(r.Context(), page)

	err := layout.Layout().Render(ctx, w)

	if err != nil {
		slog.Error("failed to render reset password page", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
}
