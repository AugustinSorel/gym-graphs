package handler

import (
	"log/slog"
	"net/http"

	"github.com/augustinsorel/gym-graphs/internal/cookies"
	"github.com/augustinsorel/gym-graphs/internal/middleware"
	"github.com/augustinsorel/gym-graphs/internal/service"
	"github.com/augustinsorel/gym-graphs/internal/session"
	"github.com/augustinsorel/gym-graphs/web/account"
)

type UpdatePasswordHandler struct {
	passwordUpdateSvc *service.PasswordUpdateService
}

func NewUpdatePasswordHandler(passwordUpdateSvc *service.PasswordUpdateService) *UpdatePasswordHandler {
	return &UpdatePasswordHandler{passwordUpdateSvc: passwordUpdateSvc}
}

func (h *UpdatePasswordHandler) Start(w http.ResponseWriter, r *http.Request) {
	authSession, _ := middleware.GetAuthSession(r.Context())

	updateSession, err := h.passwordUpdateSvc.Create(r.Context(), authSession.ID)
	if err != nil {
		slog.Error("failed to create password update session", "path", r.URL.Path, "error", err)
		w.WriteHeader(http.StatusInternalServerError)

		if renderErr := account.UpdatePasswordRow("something went wrong").Render(r.Context(), w); renderErr != nil {
			slog.Error("failed to render update password row", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}

		return
	}

	cookies.SetPasswordUpdateSession(w, session.CreateToken(updateSession.ID, updateSession.Secret))

	w.Header().Set("HX-Redirect", "/update-password/verify-password")
	w.WriteHeader(http.StatusCreated)
}
