package middleware

import (
	"net/http"

	"github.com/augustinsorel/gym-graphs/internal/cookies"
	"github.com/augustinsorel/gym-graphs/internal/service"
	"github.com/augustinsorel/gym-graphs/internal/session"
)

func GuestOnly(authSessionSvc *service.AuthSessionService, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token, err := cookies.GetAuthSession(r)
		if err != nil {
			next.ServeHTTP(w, r)
			return
		}

		sessionID, rawSecret, err := session.ParseToken(token)
		if err != nil {
			next.ServeHTTP(w, r)
			return
		}

		_, err = authSessionSvc.Validate(r.Context(), sessionID, rawSecret)
		if err != nil {
			next.ServeHTTP(w, r)
			return
		}

		http.Redirect(w, r, "/", http.StatusSeeOther)
	})
}
