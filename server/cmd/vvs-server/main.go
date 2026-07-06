package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/mark3labs/mcp-go/server"

	"vvs-server/internal/core/auth"
	"vvs-server/internal/core/registry"
	"vvs-server/internal/core/services"
	"vvs-server/internal/core/store"
	httptransport "vvs-server/internal/transport/http"
	mcptransport "vvs-server/internal/transport/mcp"
)

type healthDeps struct {
	storeMode store.Mode
	authCfg   auth.Config
}

func handleHealth(deps healthDeps) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"status":     "ok",
			"service":    "vvs-server",
			"store":      string(deps.storeMode),
			"auth":       authModeLabel(deps.authCfg),
			"userId":     auth.UserIDFromContext(r.Context()),
		})
	}
}

func authModeLabel(cfg auth.Config) string {
	if cfg.Required {
		return "required"
	}
	return "dev"
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

func handleRegistryEnvironments(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	raw, err := registry.EnvironmentsRaw()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Write(raw)
}

func handleRegistrySyntaxPacks(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	raw, err := registry.SyntaxPacksRaw()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Write(raw)
}

func withCORSAndAuth(cfg auth.Config, h http.Handler) http.Handler {
	return httptransport.CORSMiddleware(auth.Middleware(cfg, h))
}

func main() {
	fmt.Println("VVS 2.0 Go Backend")

	ctx := context.Background()
	backend, err := store.OpenFromEnv(ctx)
	if err != nil {
		log.Fatalf("store: %v", err)
	}
	defer backend.Close()

	authCfg := auth.LoadConfigFromEnv()
	if authCfg.Required && authCfg.JWTSecret == "" {
		log.Fatal("AUTH_REQUIRED=true but SUPABASE_JWT_SECRET is not set")
	}

	repoRoot, err := services.FindRepoRoot()
	if err != nil {
		log.Printf("warning: %v - compile/generate_code will fail until VVS_REPO_ROOT is set", err)
	}
	runner := services.NewCLITranspiler(repoRoot)

	projectsHandler := httptransport.NewProjectsHandler(backend.Store)
	compileHandler := httptransport.NewCompileHandler(backend.Store, runner)

	sessionAuth := mcptransport.NewSessionAuth()
	sessionHooks, sseContextFn := mcptransport.NewSessionAuthHooks(sessionAuth)
	mcpServer := server.NewMCPServer("vvs-server", "1.0.0", server.WithHooks(sessionHooks))
	mcptransport.RegisterTools(mcpServer, mcptransport.Deps{
		Store:  backend.Store,
		Runner: runner,
	})
	sseServer := server.NewSSEServer(
		mcpServer,
		server.WithBaseURL("http://localhost:8080"),
		server.WithSSEEndpoint("/mcp"),
		server.WithMessageEndpoint("/mcp/message"),
		server.WithSSEContextFunc(sseContextFn),
	)

	health := handleHealth(healthDeps{storeMode: backend.Mode, authCfg: authCfg})

	mux := http.NewServeMux()

	mux.Handle("/health", withCORSAndAuth(authCfg, http.HandlerFunc(health)))
	mux.Handle("/registry/nodes", withCORSAndAuth(authCfg, http.HandlerFunc(handleRegistryNodes)))
	mux.Handle("/registry/core-pack", withCORSAndAuth(authCfg, http.HandlerFunc(handleRegistryPack)))
	mux.Handle("/registry/environments", withCORSAndAuth(authCfg, http.HandlerFunc(handleRegistryEnvironments)))
	mux.Handle("/registry/syntax-packs", withCORSAndAuth(authCfg, http.HandlerFunc(handleRegistrySyntaxPacks)))

	mux.Handle("/api/projects", withCORSAndAuth(authCfg, projectsHandler))
	mux.Handle("/api/projects/", withCORSAndAuth(authCfg, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.URL.Path, "/compile") {
			compileHandler.ServeHTTP(w, r)
			return
		}
		projectsHandler.ServeHTTP(w, r)
	})))

	mux.Handle("/mcp", withCORSAndAuth(authCfg, sseServer.SSEHandler()))
	mux.Handle("/mcp/message", withCORSAndAuth(authCfg, sseServer.MessageHandler()))

	port := os.Getenv("PORT")
	if port == "" {
		port = ":8080"
	} else if !strings.HasPrefix(port, ":") {
		port = ":" + port
	}
	log.Printf("Listening on %s (store=%s auth=%s)", port, backend.Mode, authModeLabel(authCfg))
	log.Fatal(http.ListenAndServe(port, mux))
}
