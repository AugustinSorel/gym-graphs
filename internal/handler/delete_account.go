package handler

import (
	"log/slog"
	"net/http"

	"github.com/Oudwins/zog"
	"github.com/Oudwins/zog/zhttp"
	"github.com/augustinsorel/gym-graphs/internal/cookies"
	"github.com/augustinsorel/gym-graphs/internal/middleware"
	"github.com/augustinsorel/gym-graphs/internal/password"
	"github.com/augustinsorel/gym-graphs/internal/schema"
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

func (h *DeleteAccountHandler) VerifyPassword(w http.ResponseWriter, r *http.Request) {
	authSession, _ := middleware.GetAuthSession(r.Context())
	deletionSession, _ := middleware.GetAccountDeletionSession(r.Context())

	var input schema.VerifyCurrentPassword

	errs := schema.VerifyCurrentPasswordInput.Parse(zhttp.Request(r), &input)
	if errs != nil {
		w.WriteHeader(http.StatusUnprocessableEntity)

		fieldErrors := zog.Issues.Flatten(errs)

		formErrs := deleteaccount.VerifyPasswordFormErr{
			Password: firstErr(fieldErrors, "password"),
			Root:     firstErr(fieldErrors, "root"),
		}
		formValues := deleteaccount.VerifyPasswordFormValues{
			Email:    r.FormValue("email"),
			Password: input.Password,
		}

		if renderErr := deleteaccount.VerifyPasswordForm(formValues, formErrs).Render(r.Context(), w); renderErr != nil {
			slog.Error("failed to render delete account verify password form", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}

		return
	}

	user, err := h.userSvc.GetByID(r.Context(), authSession.UserID)
	if err != nil {
		slog.Error("failed to get user during delete account password verification", "error", err)
		w.WriteHeader(http.StatusInternalServerError)

		formErrs := deleteaccount.VerifyPasswordFormErr{Root: "something went wrong, please try again"}
		formValues := deleteaccount.VerifyPasswordFormValues{
			Email:    r.FormValue("email"),
			Password: input.Password,
		}

		if renderErr := deleteaccount.VerifyPasswordForm(formValues, formErrs).Render(r.Context(), w); renderErr != nil {
			slog.Error("failed to render delete account verify password form", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}

		return
	}

	if !password.Verify(input.Password, user.PasswordHash, user.PasswordSalt) {
		w.WriteHeader(http.StatusUnprocessableEntity)

		formErrs := deleteaccount.VerifyPasswordFormErr{Root: "incorrect password"}
		formValues := deleteaccount.VerifyPasswordFormValues{
			Email:    r.FormValue("email"),
			Password: input.Password,
		}

		if renderErr := deleteaccount.VerifyPasswordForm(formValues, formErrs).Render(r.Context(), w); renderErr != nil {
			slog.Error("failed to render delete account verify password form", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}

		return
	}

	if _, err := h.accountDeletionSvc.MarkAsVerified(r.Context(), deletionSession.ID); err != nil {
		slog.Error("failed to mark account deletion session as verified", "error", err)
		w.WriteHeader(http.StatusInternalServerError)

		formErrs := deleteaccount.VerifyPasswordFormErr{Root: "something went wrong, please try again"}
		formValues := deleteaccount.VerifyPasswordFormValues{
			Email:    r.FormValue("email"),
			Password: input.Password,
		}

		if renderErr := deleteaccount.VerifyPasswordForm(formValues, formErrs).Render(r.Context(), w); renderErr != nil {
			slog.Error("failed to render delete account verify password form", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}

		return
	}

	w.Header().Set("HX-Redirect", "/delete-account/confirm")
	w.WriteHeader(http.StatusCreated)
}

func (h *DeleteAccountHandler) Cancel(w http.ResponseWriter, r *http.Request) {
	authSession, _ := middleware.GetAuthSession(r.Context())
	deletionSession, _ := middleware.GetAccountDeletionSession(r.Context())

	if authSession.ID != deletionSession.AuthSessionID {
		cookies.ClearAccountDeletionSession(w)
		w.Header().Set("HX-Redirect", "/account")
		w.WriteHeader(http.StatusOK)
		return
	}

	if err := h.accountDeletionSvc.Cancel(r.Context(), deletionSession.ID); err != nil {
		slog.Error("failed to cancel account deletion session", "path", r.URL.Path, "error", err)
		w.WriteHeader(http.StatusInternalServerError)

		formValues := deleteaccount.VerifyPasswordFormValues{Email: r.FormValue("email")}
		formErrs := deleteaccount.VerifyPasswordFormErr{Root: "something went wrong"}

		if renderErr := deleteaccount.VerifyPasswordForm(formValues, formErrs).Render(r.Context(), w); renderErr != nil {
			slog.Error("failed to render delete account verify password form", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}

		return
	}

	cookies.ClearAccountDeletionSession(w)
	w.Header().Set("HX-Redirect", "/account")
	w.WriteHeader(http.StatusOK)
}

func (h *DeleteAccountHandler) Confirm(w http.ResponseWriter, r *http.Request) {
	deletionSession, _ := middleware.GetAccountDeletionSession(r.Context())

	if err := h.userSvc.DeleteByAccountDeletionSessionID(r.Context(), deletionSession.ID); err != nil {
		slog.Error("failed to delete user by account deletion session", "path", r.URL.Path, "error", err)
		w.WriteHeader(http.StatusInternalServerError)

		if renderErr := deleteaccount.ConfirmForm(deleteaccount.ConfirmFormErr{Root: "something went wrong"}).Render(r.Context(), w); renderErr != nil {
			slog.Error("failed to render delete account confirm form", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}

		return
	}

	cookies.ClearAccountDeletionSession(w)
	cookies.ClearAuthSession(w)

	w.Header().Set("HX-Redirect", "/sign-in")
	w.WriteHeader(http.StatusOK)
}

func (h *DeleteAccountHandler) ViewConfirmPage(w http.ResponseWriter, r *http.Request) {
	page := deleteaccount.ConfirmPage(deleteaccount.ConfirmFormErr{})
	ctx := templ.WithChildren(r.Context(), page)

	if renderErr := layout.Layout(r.URL.Path).Render(ctx, w); renderErr != nil {
		slog.Error("failed to render delete account confirm page", "error", renderErr)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
	}
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

		if renderErr := layout.Layout(r.URL.Path).Render(ctx, w); renderErr != nil {
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

	if renderErr := layout.Layout(r.URL.Path).Render(ctx, w); renderErr != nil {
		slog.Error("failed to render delete account verify password page", "error", renderErr)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
	}
}
