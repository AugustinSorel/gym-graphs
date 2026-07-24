package middleware

import (
	"context"
	"net/http"

	"github.com/augustinsorel/gym-graphs/internal/cookies"
	"github.com/augustinsorel/gym-graphs/internal/database/db"
	"github.com/augustinsorel/gym-graphs/internal/service"
	"github.com/augustinsorel/gym-graphs/internal/session"
)

type contextKey string

const signUpSessionKey contextKey = "sign_up_session"

func SetSignUpSession(ctx context.Context, s db.SignUpSession) context.Context {
	return context.WithValue(ctx, signUpSessionKey, s)
}

func GetSignUpSession(ctx context.Context) (db.SignUpSession, bool) {
	s, ok := ctx.Value(signUpSessionKey).(db.SignUpSession)
	return s, ok
}

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

		ctx := SetSignUpSession(r.Context(), signUpSession)
		next.ServeHTTP(w, r.WithContext(ctx))
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

		ctx := SetSignUpSession(r.Context(), signUpSession)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
