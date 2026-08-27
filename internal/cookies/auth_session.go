package cookies

import (
	"net/http"
	"time"
)

const (
	authSessionCookieName = "auth_session_token"
	authSessionTTL        = 30 * 24 * time.Hour
)

func SetAuthSession(w http.ResponseWriter, token string) {
	http.SetCookie(w, &http.Cookie{
		Name:     authSessionCookieName,
		Value:    token,
		Path:     "/",
		Expires:  time.Now().Add(authSessionTTL),
		MaxAge:   int(authSessionTTL.Seconds()),
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
	})
}

func GetAuthSession(r *http.Request) string {
	cookie, err := r.Cookie(authSessionCookieName)
	if err != nil {
		return ""
	}
	return cookie.Value
}

func ClearAuthSession(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     authSessionCookieName,
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
	})
}
