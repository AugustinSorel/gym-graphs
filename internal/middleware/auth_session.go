package middleware

import (
	"net/http"

	"github.com/augustinsorel/gym-graphs/internal/cookies"
	"github.com/augustinsorel/gym-graphs/internal/service"
	"github.com/augustinsorel/gym-graphs/internal/session"
)

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

		next.ServeHTTP(w, r)
	})
}
