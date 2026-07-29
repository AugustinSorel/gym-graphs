package handler

import (
	"log/slog"
	"net/http"

	"github.com/augustinsorel/gym-graphs/internal/middleware"
	"github.com/augustinsorel/gym-graphs/internal/service"
	"github.com/augustinsorel/gym-graphs/web/deleteaccount"
	"github.com/augustinsorel/gym-graphs/web/ui/layout"

	"github.com/a-h/templ"
)

type DeleteAccountHandler struct {
	userSvc            *service.UserService
	accountDeletionSvc *service.AccountDeletionService
}

func NewDeleteAccountHandler(userSvc *service.UserService, accountDeletionSvc *service.AccountDeletionService) *DeleteAccountHandler {
	return &DeleteAccountHandler{userSvc: userSvc, accountDeletionSvc: accountDeletionSvc}
}

func (h *DeleteAccountHandler) ViewVerifyPasswordPage(w http.ResponseWriter, r *http.Request) {
	authSession, _ := middleware.GetAuthSession(r.Context())

	user, err := h.userSvc.GetByID(r.Context(), authSession.UserID)
	if err != nil {
		slog.Error("failed to get user for delete account verify password page", "error", err)
		w.WriteHeader(http.StatusInternalServerError)

		page := deleteaccount.VerifyPasswordPage(
			deleteaccount.VerifyPasswordFormValues{},
			deleteaccount.VerifyPasswordFormErr{Root: "something went wrong, please try again"},
		)
		ctx := templ.WithChildren(r.Context(), page)

		if renderErr := layout.Layout().Render(ctx, w); renderErr != nil {
			slog.Error("failed to render delete account verify password page", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}

		return
	}

	page := deleteaccount.VerifyPasswordPage(
		deleteaccount.VerifyPasswordFormValues{Email: user.EmailAddress},
		deleteaccount.VerifyPasswordFormErr{},
	)
	ctx := templ.WithChildren(r.Context(), page)

	if renderErr := layout.Layout().Render(ctx, w); renderErr != nil {
		slog.Error("failed to render delete account verify password page", "error", renderErr)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
	}
}
