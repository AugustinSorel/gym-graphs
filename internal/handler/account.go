package handler

import (
	"log/slog"
	"net/http"

	"github.com/a-h/templ"
	"github.com/augustinsorel/gym-graphs/internal/middleware"
	"github.com/augustinsorel/gym-graphs/internal/service"
	"github.com/augustinsorel/gym-graphs/web/account"
	"github.com/augustinsorel/gym-graphs/web/ui/layout"
)

type AccountHandler struct {
	userSvc *service.UserService
}

func NewAccountHandler(userSvc *service.UserService) *AccountHandler {
	return &AccountHandler{userSvc: userSvc}
}

func (h *AccountHandler) ViewPage(w http.ResponseWriter, r *http.Request) {
	authSession, _ := middleware.GetAuthSession(r.Context())

	user, err := h.userSvc.GetByID(r.Context(), authSession.UserID)
	if err != nil {
		slog.Error("failed to get user", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	page := account.AccountPage(user.EmailAddress)
	ctx := templ.WithChildren(r.Context(), page)

	if err := layout.Layout().Render(ctx, w); err != nil {
		slog.Error("failed to render account page", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
	}
}
