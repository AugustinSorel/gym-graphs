package cookies

import (
	"net/http"
	"time"
)

const (
	passwordUpdateSessionCookieName = "password_update_session_token"
	passwordUpdateSessionTTL        = 1 * time.Hour
)

func SetPasswordUpdateSession(w http.ResponseWriter, token string) {
	http.SetCookie(w, &http.Cookie{
		Name:     passwordUpdateSessionCookieName,
		Value:    token,
		Path:     "/",
		Expires:  time.Now().Add(passwordUpdateSessionTTL),
		MaxAge:   int(passwordUpdateSessionTTL.Seconds()),
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
	})
}

func GetPasswordUpdateSession(r *http.Request) string {
	cookie, err := r.Cookie(passwordUpdateSessionCookieName)
	if err != nil {
		return ""
	}
	return cookie.Value
}

func ClearPasswordUpdateSession(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     passwordUpdateSessionCookieName,
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
	})
}
