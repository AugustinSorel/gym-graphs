package handler

import (
	"log/slog"
	"net/http"

	"github.com/a-h/templ"
	"github.com/augustinsorel/gym-graphs/internal/cookies"
	"github.com/augustinsorel/gym-graphs/internal/middleware"
	"github.com/augustinsorel/gym-graphs/internal/service"
	"github.com/augustinsorel/gym-graphs/internal/session"
	"github.com/augustinsorel/gym-graphs/web/account"
	"github.com/augustinsorel/gym-graphs/web/ui/layout"
	"github.com/augustinsorel/gym-graphs/web/updatepassword"
)

type UpdatePasswordHandler struct {
	userSvc           *service.UserService
	passwordUpdateSvc *service.PasswordUpdateService
}

func NewUpdatePasswordHandler(userSvc *service.UserService, passwordUpdateSvc *service.PasswordUpdateService) *UpdatePasswordHandler {
	return &UpdatePasswordHandler{userSvc: userSvc, passwordUpdateSvc: passwordUpdateSvc}
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

func (h *UpdatePasswordHandler) ViewVerifyPasswordPage(w http.ResponseWriter, r *http.Request) {
	authSession, _ := middleware.GetAuthSession(r.Context())

	user, err := h.userSvc.GetByID(r.Context(), authSession.UserID)
	if err != nil {
		slog.Error("failed to get user for verify password page", "error", err)
		w.WriteHeader(http.StatusInternalServerError)

		page := updatepassword.VerifyPasswordPage(
			updatepassword.VerifyPasswordFormValues{},
			updatepassword.VerifyPasswordFormErr{Root: "something went wrong, please try again"},
		)
		ctx := templ.WithChildren(r.Context(), page)

		if renderErr := layout.Layout().Render(ctx, w); renderErr != nil {
			slog.Error("failed to render verify password page", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}

		return
	}

	page := updatepassword.VerifyPasswordPage(
		updatepassword.VerifyPasswordFormValues{Email: user.EmailAddress},
		updatepassword.VerifyPasswordFormErr{},
	)
	ctx := templ.WithChildren(r.Context(), page)

	if renderErr := layout.Layout().Render(ctx, w); renderErr != nil {
		slog.Error("failed to render verify password page", "error", renderErr)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
	}
}
