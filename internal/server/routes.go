package server

import (
	"net/http"

	"github.com/augustinsorel/gym-graphs/internal/handler"
	"github.com/augustinsorel/gym-graphs/internal/middleware"
	"github.com/augustinsorel/gym-graphs/internal/service"
	"github.com/augustinsorel/gym-graphs/web"
)

func (s *Server) RegisterRoutes() http.Handler {
	mux := http.NewServeMux()

	fileServer := http.FileServer(http.FS(web.Files))

	userSvc := service.NewUserService(s.queries)
	authSessionSvc := service.NewAuthSessionService(s.queries)
	tagSvc := service.NewTagService(s.queries)
	signUpSessionSvc := service.NewSignUpService(s.queries, s.pool)
	passwordResetSvc := service.NewPasswordResetService(s.queries, s.pool)
	passwordUpdateSvc := service.NewPasswordUpdateService(s.queries)
	signUp := handler.NewSignUpHandler(userSvc, signUpSessionSvc, s.mailer, s.emailRateLimit, s.emailCodeVerificationRateLimit)
	signIn := handler.NewSignInHandler(userSvc, authSessionSvc, s.passwordAuthRateLimit)
	account := handler.NewAccountHandler(userSvc, authSessionSvc, tagSvc)
	resetPassword := handler.NewResetPasswordHandler(userSvc, passwordResetSvc, s.mailer, s.emailRateLimit, s.emailCodeVerificationRateLimit)
	updatePassword := handler.NewUpdatePasswordHandler(passwordUpdateSvc)

	guestOnly := func(next http.Handler) http.Handler {
		return middleware.GuestOnly(authSessionSvc, next)
	}

	requireAuthSession := func(next http.Handler) http.Handler {
		return middleware.RequireAuthSession(authSessionSvc, next)
	}

	requireUnverifiedSignUpSession := func(next http.Handler) http.Handler {
		return middleware.RequireUnverifiedSignUpSession(signUpSessionSvc, next)
	}

	requireSignUpSession := func(next http.Handler) http.Handler {
		return middleware.RequireSignUpSession(signUpSessionSvc, next)
	}

	requireVerifiedSignUpSession := func(next http.Handler) http.Handler {
		return middleware.RequireVerifiedSignUpSession(signUpSessionSvc, next)
	}

	requirePasswordResetSession := func(next http.Handler) http.Handler {
		return middleware.RequirePasswordResetSession(passwordResetSvc, next)
	}

	requireUnverifiedPasswordResetSession := func(next http.Handler) http.Handler {
		return middleware.RequireUnverifiedPasswordResetSession(passwordResetSvc, next)
	}

	requireVerifiedPasswordResetSession := func(next http.Handler) http.Handler {
		return middleware.RequireVerifiedPasswordResetSession(passwordResetSvc, next)
	}

	mux.Handle("/assets/", fileServer)

	mux.Handle("GET /account", requireAuthSession(http.HandlerFunc(account.ViewPage)))
	mux.Handle("GET /account/name", requireAuthSession(http.HandlerFunc(account.ViewEditNamePage)))
	mux.Handle("PATCH /account/name", requireAuthSession(http.HandlerFunc(account.UpdateName)))
	mux.Handle("PATCH /account/weight-unit", requireAuthSession(http.HandlerFunc(account.UpdateWeightUnit)))
	mux.Handle("PATCH /account/one-rep-max-algorithm", requireAuthSession(http.HandlerFunc(account.UpdateOneRepMaxAlgorithm)))
	mux.Handle("GET /account/data", requireAuthSession(http.HandlerFunc(account.DownloadData)))
	mux.Handle("POST /delete-account", requireAuthSession(http.HandlerFunc(account.DeleteAccount)))
	mux.Handle("POST /sign-out", requireAuthSession(http.HandlerFunc(account.SignOut)))

	mux.Handle("POST /update-password", requireAuthSession(http.HandlerFunc(updatePassword.Start)))

	mux.Handle("GET /sign-in", guestOnly(http.HandlerFunc(signIn.ViewPage)))
	mux.Handle("POST /sign-in", guestOnly(http.HandlerFunc(signIn.SignIn)))

	mux.HandleFunc("GET /reset-password", resetPassword.ViewPage)
	mux.HandleFunc("POST /reset-password", resetPassword.Start)
	mux.Handle("GET /reset-password/verify-email-code", requireUnverifiedPasswordResetSession(http.HandlerFunc(resetPassword.ViewVerifyEmailPage)))
	mux.Handle("POST /reset-password/verify-email-code", requireUnverifiedPasswordResetSession(http.HandlerFunc(resetPassword.VerifyEmail)))
	mux.Handle("POST /reset-password/verify-email-code/cancel", requirePasswordResetSession(http.HandlerFunc(resetPassword.CancelVerifyEmail)))
	mux.Handle("GET /reset-password/set-new-password", requireVerifiedPasswordResetSession(http.HandlerFunc(resetPassword.ViewSetPasswordPage)))
	mux.Handle("POST /reset-password/set-new-password", requireVerifiedPasswordResetSession(http.HandlerFunc(resetPassword.SetPassword)))

	mux.Handle("GET /sign-up", guestOnly(http.HandlerFunc(signUp.ViewStartPage)))
	mux.Handle("POST /sign-up", guestOnly(http.HandlerFunc(signUp.Start)))
	mux.Handle("GET /sign-up/verify-email-address", guestOnly(requireUnverifiedSignUpSession(http.HandlerFunc(signUp.ViewVerifyEmailPage))))
	mux.Handle("POST /sign-up/verify-email-address", guestOnly(requireUnverifiedSignUpSession(http.HandlerFunc(signUp.VerifyEmail))))
	mux.Handle("POST /sign-up/verify-email-address/resend", guestOnly(requireUnverifiedSignUpSession(http.HandlerFunc(signUp.ResendVerificationCode))))
	mux.Handle("POST /sign-up/verify-email-address/cancel", guestOnly(requireSignUpSession(http.HandlerFunc(signUp.CancelVerifyEmail))))
	mux.Handle("GET /sign-up/set-password", guestOnly(requireVerifiedSignUpSession(http.HandlerFunc(signUp.ViewSetPasswordPage))))
	mux.Handle("POST /sign-up/set-password", guestOnly(requireVerifiedSignUpSession(http.HandlerFunc(signUp.SetPassword))))

	return s.analyticsMiddleware(s.corsMiddleware(s.requestRateLimitMiddleware(mux)))
}

func (s *Server) requestRateLimitMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := r.Header.Get("X-Real-IP")
		if ip == "" {
			ip = r.RemoteAddr
		}

		if !s.requestRateLimit.Consume(ip) {
			http.Error(w, "Too Many Requests", http.StatusTooManyRequests)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func (s *Server) analyticsMiddleware(next http.Handler) http.Handler {
	return s.tracker.Middleware(next)
}

func (s *Server) corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*") // Replace "*" with specific origins if needed
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")
		w.Header().Set("Access-Control-Allow-Headers", "Accept, Authorization, Content-Type, X-CSRF-Token")
		w.Header().Set("Access-Control-Allow-Credentials", "false") // Set to "true" if credentials are required

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}
