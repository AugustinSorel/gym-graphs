package cookies

import (
	"net/http"
	"time"
)

const (
	accountDeletionSessionCookieName = "account_deletion_session_token"
	accountDeletionSessionTTL        = 1 * time.Hour
)

func SetAccountDeletionSession(w http.ResponseWriter, token string) {
	http.SetCookie(w, &http.Cookie{
		Name:     accountDeletionSessionCookieName,
		Value:    token,
		Path:     "/",
		Expires:  time.Now().Add(accountDeletionSessionTTL),
		MaxAge:   int(accountDeletionSessionTTL.Seconds()),
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
	})
}

func GetAccountDeletionSession(r *http.Request) string {
	cookie, err := r.Cookie(accountDeletionSessionCookieName)
	if err != nil {
		return ""
	}
	return cookie.Value
}

func ClearAccountDeletionSession(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     accountDeletionSessionCookieName,
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
	})
}
