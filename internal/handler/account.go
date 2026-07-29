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
)

type AccountHandler struct {
	userSvc            *service.UserService
	authSessionSvc     *service.AuthSessionService
	tagSvc             *service.TagService
	accountDeletionSvc *service.AccountDeletionService
}

func NewAccountHandler(userSvc *service.UserService, authSessionSvc *service.AuthSessionService, tagSvc *service.TagService, accountDeletionSvc *service.AccountDeletionService) *AccountHandler {
	return &AccountHandler{userSvc: userSvc, authSessionSvc: authSessionSvc, tagSvc: tagSvc, accountDeletionSvc: accountDeletionSvc}
}

func (h *AccountHandler) ViewPage(w http.ResponseWriter, r *http.Request) {
	authSession, _ := middleware.GetAuthSession(r.Context())

	user, err := h.userSvc.GetByID(r.Context(), authSession.UserID)
	if err != nil {
		page := account.AccountErrorPage("loading the account page failed")

		ctx := templ.WithChildren(r.Context(), page)

		if err := layout.Layout().Render(ctx, w); err != nil {
			slog.Error("failed to get user", "error", err)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}

		return
	}

	tags, err := h.tagSvc.GetByUserID(r.Context(), authSession.UserID)
	if err != nil {
		page := account.AccountErrorPage("loading the account page failed")

		ctx := templ.WithChildren(r.Context(), page)

		if err := layout.Layout().Render(ctx, w); err != nil {
			slog.Error("failed to get user", "error", err)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}

		return
	}

	page := account.AccountPage(user, tags)
	ctx := templ.WithChildren(r.Context(), page)

	if err := layout.Layout().Render(ctx, w); err != nil {
		page := account.AccountErrorPage("loading the account page failed")

		ctx := templ.WithChildren(r.Context(), page)

		if err := layout.Layout().Render(ctx, w); err != nil {
			slog.Error("failed to get user", "error", err)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}

		return
	}
}

func (h *AccountHandler) ViewEditNamePage(w http.ResponseWriter, r *http.Request) {
	page := account.EditNamePageWithForm(account.EditNameFormValues{}, account.EditNameFormErr{})
	ctx := templ.WithChildren(r.Context(), page)

	if err := layout.Layout().Render(ctx, w); err != nil {
		page := account.EditNamePageError("loading the edit name page failed")

		ctx := templ.WithChildren(r.Context(), page)

		if err := layout.Layout().Render(ctx, w); err != nil {
			slog.Error("failed to render edit name page", "error", err)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}

		return
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
	authSession, _ := middleware.GetAuthSession(r.Context())

	deletionSession, err := h.accountDeletionSvc.Create(r.Context(), authSession.ID)
	if err != nil {
		slog.Error("failed to create account deletion session", "path", r.URL.Path, "error", err)
		w.WriteHeader(http.StatusInternalServerError)

		if renderErr := account.RemoveAccountRow("something went wrong").Render(r.Context(), w); renderErr != nil {
			slog.Error("failed to render remove account row", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}

		return
	}

	cookies.SetAccountDeletionSession(w, session.CreateToken(deletionSession.ID, deletionSession.Secret))

	w.Header().Set("HX-Redirect", "/delete-account/verify-password")
	w.WriteHeader(http.StatusCreated)
}

func (h *AccountHandler) SignOut(w http.ResponseWriter, r *http.Request) {
	authSession, _ := middleware.GetAuthSession(r.Context())

	if err := h.authSessionSvc.Delete(r.Context(), authSession.ID); err != nil {
		page := account.SignOutRow("something went wrong")

		ctx := templ.WithChildren(r.Context(), page)

		if err := layout.Layout().Render(ctx, w); err != nil {
			slog.Error("failed to delete auth session", "error", err)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}

		return
	}

	cookies.ClearAuthSession(w)
	w.Header().Set("HX-Redirect", "/sign-in")
}
