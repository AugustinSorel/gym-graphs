package middleware

import (
	"net/http"

	"github.com/augustinsorel/gym-graphs/internal/cookies"
	"github.com/augustinsorel/gym-graphs/internal/service"
	"github.com/augustinsorel/gym-graphs/internal/session"
)

func RequireVerifiedSignUpSession(signUpSvc *service.SignUpService, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token := cookies.GetSignUpSession(r)
		if token == "" {
			http.Redirect(w, r, "/sign-up", http.StatusSeeOther)
			return
		}

		sessionID, rawSecret, err := session.ParseToken(token)
		if err != nil {
			http.Redirect(w, r, "/sign-up", http.StatusSeeOther)
			return
		}

		signUpSession, err := signUpSvc.GetByID(r.Context(), sessionID)
		if err != nil {
			http.Redirect(w, r, "/sign-up", http.StatusSeeOther)
			return
		}

		if err := signUpSvc.ValidateSecret(signUpSession, rawSecret); err != nil {
			http.Redirect(w, r, "/sign-up", http.StatusSeeOther)
			return
		}

		if !signUpSession.EmailAddressVerifiedAt.Valid {
			http.Redirect(w, r, "/sign-up/verify-email-address", http.StatusSeeOther)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func RequireUnverifiedSignUpSession(signUpSvc *service.SignUpService, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token := cookies.GetSignUpSession(r)
		if token == "" {
			http.Redirect(w, r, "/sign-up", http.StatusSeeOther)
			return
		}

		sessionID, rawSecret, err := session.ParseToken(token)
		if err != nil {
			http.Redirect(w, r, "/sign-up", http.StatusSeeOther)
			return
		}

		signUpSession, err := signUpSvc.GetByID(r.Context(), sessionID)
		if err != nil {
			http.Redirect(w, r, "/sign-up", http.StatusSeeOther)
			return
		}

		if err := signUpSvc.ValidateSecret(signUpSession, rawSecret); err != nil {
			http.Redirect(w, r, "/sign-up", http.StatusSeeOther)
			return
		}

		if signUpSession.EmailAddressVerifiedAt.Valid {
			http.Redirect(w, r, "/sign-up", http.StatusSeeOther)
			return
		}

		next.ServeHTTP(w, r)
	})
}
