package middleware

import (
	"context"
	"net/http"

	"github.com/augustinsorel/gym-graphs/internal/cookies"
	"github.com/augustinsorel/gym-graphs/internal/database/db"
	"github.com/augustinsorel/gym-graphs/internal/service"
	"github.com/augustinsorel/gym-graphs/internal/session"
)

const authSessionKey contextKey = "auth_session"

func SetAuthSession(ctx context.Context, s db.AuthSession) context.Context {
	return context.WithValue(ctx, authSessionKey, s)
}

func GetAuthSession(ctx context.Context) (db.AuthSession, bool) {
	s, ok := ctx.Value(authSessionKey).(db.AuthSession)
	return s, ok
}

func GuestOnly(authSessionSvc *service.AuthSessionService, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token := cookies.GetAuthSession(r)
		if token == "" {
			next.ServeHTTP(w, r)
			return
		}

		sessionID, rawSecret, err := session.ParseToken(token)
		if err != nil {
			next.ServeHTTP(w, r)
			return
		}

		authSession, err := authSessionSvc.GetByID(r.Context(), sessionID)
		if err != nil {
			next.ServeHTTP(w, r)
			return
		}

		if err := authSessionSvc.ValidateSecret(authSession, rawSecret); err != nil {
			next.ServeHTTP(w, r)
			return
		}

		http.Redirect(w, r, "/", http.StatusSeeOther)
	})
}

func RequireAuthSession(authSessionSvc *service.AuthSessionService, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token := cookies.GetAuthSession(r)
		if token == "" {
			http.Redirect(w, r, "/sign-up", http.StatusSeeOther)
			return
		}

		sessionID, rawSecret, err := session.ParseToken(token)
		if err != nil {
			http.Redirect(w, r, "/sign-up", http.StatusSeeOther)
			return
		}

		authSession, err := authSessionSvc.GetByID(r.Context(), sessionID)
		if err != nil {
			http.Redirect(w, r, "/sign-up", http.StatusSeeOther)
			return
		}

		if err := authSessionSvc.ValidateSecret(authSession, rawSecret); err != nil {
			http.Redirect(w, r, "/sign-up", http.StatusSeeOther)
			return
		}

		ctx := SetAuthSession(r.Context(), authSession)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
