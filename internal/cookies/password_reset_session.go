package cookies

import (
	"net/http"
	"time"
)

const (
	passwordResetSessionCookieName = "password_reset_session_token"
	passwordResetSessionTTL        = 1 * time.Hour
)

func SetPasswordResetSession(w http.ResponseWriter, token string) {
	http.SetCookie(w, &http.Cookie{
		Name:     passwordResetSessionCookieName,
		Value:    token,
		Path:     "/",
		Expires:  time.Now().Add(passwordResetSessionTTL),
		MaxAge:   int(passwordResetSessionTTL.Seconds()),
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
	})
}

func GetPasswordResetSession(r *http.Request) string {
	cookie, err := r.Cookie(passwordResetSessionCookieName)
	if err != nil {
		return ""
	}
	return cookie.Value
}

func ClearPasswordResetSession(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     passwordResetSessionCookieName,
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
	})
}
