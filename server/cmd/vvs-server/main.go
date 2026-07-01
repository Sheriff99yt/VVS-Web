package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
)

func corsMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	}
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "ok",
		"service": "vvs-server",
		"note":    "skeleton — no graph API, MCP, or WebSocket yet",
	})
}

func main() {
	fmt.Println("VVS 2.0 Go Backend (skeleton)")
	log.Println("See docs/current_state.md for implementation status")

	http.HandleFunc("/health", corsMiddleware(handleHealth))

	port := ":8080"
	log.Printf("Listening on %s (GET /health)", port)

	if err := http.ListenAndServe(port, nil); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
