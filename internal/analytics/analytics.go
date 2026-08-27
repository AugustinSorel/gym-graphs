package analytics

import "net/http"

// Tracker wraps an HTTP handler with analytics tracking.
type Tracker interface {
	Middleware(next http.Handler) http.Handler
}
