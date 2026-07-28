package handler

import (
	"log/slog"
	"net/http"

	"github.com/a-h/templ"
	"github.com/augustinsorel/gym-graphs/internal/cookies"
	"github.com/augustinsorel/gym-graphs/internal/middleware"
	"github.com/augustinsorel/gym-graphs/internal/service"
	"github.com/augustinsorel/gym-graphs/web/account"
	"github.com/augustinsorel/gym-graphs/web/ui/layout"
)

type AccountHandler struct {
	userSvc        *service.UserService
	authSessionSvc *service.AuthSessionService
	tagSvc         *service.TagService
}

func NewAccountHandler(userSvc *service.UserService, authSessionSvc *service.AuthSessionService, tagSvc *service.TagService) *AccountHandler {
	return &AccountHandler{userSvc: userSvc, authSessionSvc: authSessionSvc, tagSvc: tagSvc}
}

func (h *AccountHandler) ViewPage(w http.ResponseWriter, r *http.Request) {
	authSession, _ := middleware.GetAuthSession(r.Context())

	user, err := h.userSvc.GetByID(r.Context(), authSession.UserID)
	if err != nil {
		//FIX
		slog.Error("failed to get user", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	tags, err := h.tagSvc.GetByUserID(r.Context(), authSession.UserID)
	if err != nil {
		slog.Error("failed to get tags", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	page := account.AccountPage(user, tags)
	ctx := templ.WithChildren(r.Context(), page)

	if err := layout.Layout().Render(ctx, w); err != nil {
		slog.Error("failed to render account page", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
	}
}

func (h *AccountHandler) ViewEditNamePage(w http.ResponseWriter, r *http.Request) {
	page := account.EditNamePageWithForm(account.EditNameFormValues{}, account.EditNameFormErr{})
	ctx := templ.WithChildren(r.Context(), page)

	if err := layout.Layout().Render(ctx, w); err != nil {
		slog.Error("failed to render edit name page", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
	}
}

func (h *AccountHandler) UpdateName(w http.ResponseWriter, r *http.Request) {
	// stub – form validation and DB update to be implemented
	http.Redirect(w, r, "/account", http.StatusSeeOther)
}

func (h *AccountHandler) UpdateWeightUnit(w http.ResponseWriter, r *http.Request) {
	// stub – form validation and DB update to be implemented
	w.WriteHeader(http.StatusNoContent)
}

func (h *AccountHandler) UpdateOneRepMaxAlgorithm(w http.ResponseWriter, r *http.Request) {
	// stub – form validation and DB update to be implemented
	w.WriteHeader(http.StatusNoContent)
}

func (h *AccountHandler) DownloadData(w http.ResponseWriter, r *http.Request) {
	// stub – data export to be implemented
	w.WriteHeader(http.StatusNoContent)
}

func (h *AccountHandler) DeleteAccount(w http.ResponseWriter, r *http.Request) {
	// stub – account deletion to be implemented
	w.WriteHeader(http.StatusNoContent)
}

func (h *AccountHandler) SignOut(w http.ResponseWriter, r *http.Request) {
	authSession, _ := middleware.GetAuthSession(r.Context())

	if err := h.authSessionSvc.Delete(r.Context(), authSession.ID); err != nil {
		//FIX
		slog.Error("failed to delete auth session", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	cookies.ClearAuthSession(w)
	w.Header().Set("HX-Redirect", "/sign-in")
}
