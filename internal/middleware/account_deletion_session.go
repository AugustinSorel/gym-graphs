package middleware

import (
	"context"
	"net/http"

	"github.com/augustinsorel/gym-graphs/internal/cookies"
	"github.com/augustinsorel/gym-graphs/internal/database/db"
	"github.com/augustinsorel/gym-graphs/internal/service"
)

const accountDeletionSessionKey contextKey = "account_deletion_session"

func SetAccountDeletionSession(ctx context.Context, s db.AccountDeletionSession) context.Context {
	return context.WithValue(ctx, accountDeletionSessionKey, s)
}

func GetAccountDeletionSession(ctx context.Context) (db.AccountDeletionSession, bool) {
	s, ok := ctx.Value(accountDeletionSessionKey).(db.AccountDeletionSession)
	return s, ok
}

func RequireAccountDeletionSession(accountDeletionSvc *service.AccountDeletionService, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token := cookies.GetAccountDeletionSession(r)
		if token == "" {
			http.Redirect(w, r, "/account", http.StatusSeeOther)
			return
		}

		deletionSession, err := accountDeletionSvc.ValidateToken(r.Context(), token)
		if err != nil {
			http.Redirect(w, r, "/account", http.StatusSeeOther)
			return
		}

		ctx := SetAccountDeletionSession(r.Context(), deletionSession)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func RequireUnverifiedAccountDeletionSession(accountDeletionSvc *service.AccountDeletionService, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token := cookies.GetAccountDeletionSession(r)
		if token == "" {
			http.Redirect(w, r, "/account", http.StatusSeeOther)
			return
		}

		deletionSession, err := accountDeletionSvc.ValidateToken(r.Context(), token)
		if err != nil {
			http.Redirect(w, r, "/account", http.StatusSeeOther)
			return
		}

		if deletionSession.UserIdentityVerifiedAt.Valid {
			http.Redirect(w, r, "/delete-account/confirm", http.StatusSeeOther)
			return
		}

		ctx := SetAccountDeletionSession(r.Context(), deletionSession)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func RequireVerifiedAccountDeletionSession(accountDeletionSvc *service.AccountDeletionService, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token := cookies.GetAccountDeletionSession(r)
		if token == "" {
			http.Redirect(w, r, "/account", http.StatusSeeOther)
			return
		}

		deletionSession, err := accountDeletionSvc.ValidateToken(r.Context(), token)
		if err != nil {
			http.Redirect(w, r, "/account", http.StatusSeeOther)
			return
		}

		if !deletionSession.UserIdentityVerifiedAt.Valid {
			http.Redirect(w, r, "/delete-account/verify-password", http.StatusSeeOther)
			return
		}

		ctx := SetAccountDeletionSession(r.Context(), deletionSession)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
