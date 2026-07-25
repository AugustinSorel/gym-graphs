package middleware

import (
	"context"
	"net/http"

	"github.com/augustinsorel/gym-graphs/internal/cookies"
	"github.com/augustinsorel/gym-graphs/internal/database/db"
	"github.com/augustinsorel/gym-graphs/internal/service"
)

const passwordResetSessionKey contextKey = "password_reset_session"

func SetPasswordResetSession(ctx context.Context, s db.PasswordResetSession) context.Context {
	return context.WithValue(ctx, passwordResetSessionKey, s)
}

func GetPasswordResetSession(ctx context.Context) (db.PasswordResetSession, bool) {
	s, ok := ctx.Value(passwordResetSessionKey).(db.PasswordResetSession)
	return s, ok
}

func RequireUnverifiedPasswordResetSession(passwordResetSvc *service.PasswordResetService, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token := cookies.GetPasswordResetSession(r)
		if token == "" {
			http.Redirect(w, r, "/reset-password", http.StatusSeeOther)
			return
		}

		resetSession, err := passwordResetSvc.ValidateToken(r.Context(), token)
		if err != nil {
			http.Redirect(w, r, "/reset-password", http.StatusSeeOther)
			return
		}

		if resetSession.UserIdentityVerifiedAt.Valid {
			http.Redirect(w, r, "/reset-password/set-password", http.StatusSeeOther)
			return
		}

		ctx := SetPasswordResetSession(r.Context(), resetSession)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
