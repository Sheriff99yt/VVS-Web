package httptransport

import "net/http"

// CORSMiddleware allows the Next.js dev server to call the Go API and MCP endpoints.
func CORSMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
		w.Header().Set("Access-Control-Allow-Methods", "GET, PUT, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func CORSMiddlewareFunc(next http.HandlerFunc) http.Handler {
	return CORSMiddleware(http.HandlerFunc(next))
}
