package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"vvs-server/internal/core/registry"
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
		"note":    "registry + health — graph API and MCP transport pending",
	})
}

func handleRegistryNodes(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	nodes, err := registry.ListAvailableNodes()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(map[string]interface{}{
		"nodes": nodes,
	})
}

func handleRegistryPack(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Write(registry.CorePackRaw())
}

func main() {
	fmt.Println("VVS 2.0 Go Backend")
	log.Println("See docs/current_state.md for implementation status")

	http.HandleFunc("/health", corsMiddleware(handleHealth))
	http.HandleFunc("/registry/nodes", corsMiddleware(handleRegistryNodes))
	http.HandleFunc("/registry/core-pack", corsMiddleware(handleRegistryPack))

	port := ":8080"
	log.Printf("Listening on %s (GET /health, /registry/nodes, /registry/core-pack)", port)

	if err := http.ListenAndServe(port, nil); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
