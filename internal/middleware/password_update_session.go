package middleware

import (
	"context"
	"net/http"

	"github.com/augustinsorel/gym-graphs/internal/cookies"
	"github.com/augustinsorel/gym-graphs/internal/database/db"
	"github.com/augustinsorel/gym-graphs/internal/service"
)

const passwordUpdateSessionKey contextKey = "password_update_session"

func SetPasswordUpdateSession(ctx context.Context, s db.PasswordUpdateSession) context.Context {
	return context.WithValue(ctx, passwordUpdateSessionKey, s)
}

func GetPasswordUpdateSession(ctx context.Context) (db.PasswordUpdateSession, bool) {
	s, ok := ctx.Value(passwordUpdateSessionKey).(db.PasswordUpdateSession)
	return s, ok
}

func RequirePasswordUpdateSession(passwordUpdateSvc *service.PasswordUpdateService, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token := cookies.GetPasswordUpdateSession(r)
		if token == "" {
			http.Redirect(w, r, "/account", http.StatusSeeOther)
			return
		}

		updateSession, err := passwordUpdateSvc.ValidateToken(r.Context(), token)
		if err != nil {
			http.Redirect(w, r, "/account", http.StatusSeeOther)
			return
		}

		ctx := SetPasswordUpdateSession(r.Context(), updateSession)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func RequireUnverifiedPasswordUpdateSession(passwordUpdateSvc *service.PasswordUpdateService, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token := cookies.GetPasswordUpdateSession(r)
		if token == "" {
			http.Redirect(w, r, "/account", http.StatusSeeOther)
			return
		}

		updateSession, err := passwordUpdateSvc.ValidateToken(r.Context(), token)
		if err != nil {
			http.Redirect(w, r, "/account", http.StatusSeeOther)
			return
		}

		if updateSession.UserIdentityVerifiedAt.Valid {
			http.Redirect(w, r, "/update-password/set-password", http.StatusSeeOther)
			return
		}

		ctx := SetPasswordUpdateSession(r.Context(), updateSession)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
