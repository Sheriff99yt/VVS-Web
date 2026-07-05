package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/mark3labs/mcp-go/server"

	"vvs-server/internal/core/registry"
	"vvs-server/internal/core/services"
	"vvs-server/internal/core/store"
	httptransport "vvs-server/internal/transport/http"
	mcptransport "vvs-server/internal/transport/mcp"
)

func handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "ok",
		"service": "vvs-server",
		"note":    "project API + MCP SSE",
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

func main() {
	fmt.Println("VVS 2.0 Go Backend")

	projectStore := store.NewMemoryStore()

	repoRoot, err := services.FindRepoRoot()
	if err != nil {
		log.Printf("warning: %v — compile/generate_code will fail until VVS_REPO_ROOT is set", err)
	}
	runner := services.NewCLITranspiler(repoRoot)

	projectsHandler := httptransport.NewProjectsHandler(projectStore)
	compileHandler := httptransport.NewCompileHandler(projectStore, runner)

	mcpServer := server.NewMCPServer("vvs-server", "1.0.0")
	mcptransport.RegisterTools(mcpServer, mcptransport.Deps{
		Store:  projectStore,
		Runner: runner,
	})
	sseServer := server.NewSSEServer(
		mcpServer,
		server.WithBaseURL("http://localhost:8080"),
		server.WithSSEEndpoint("/mcp"),
		server.WithMessageEndpoint("/mcp/message"),
	)

	mux := http.NewServeMux()

	mux.Handle("/health", httptransport.CORSMiddleware(http.HandlerFunc(handleHealth)))
	mux.Handle("/registry/nodes", httptransport.CORSMiddleware(http.HandlerFunc(handleRegistryNodes)))
	mux.Handle("/registry/core-pack", httptransport.CORSMiddleware(http.HandlerFunc(handleRegistryPack)))
	mux.Handle("/registry/environments", httptransport.CORSMiddleware(http.HandlerFunc(handleRegistryEnvironments)))
	mux.Handle("/registry/syntax-packs", httptransport.CORSMiddleware(http.HandlerFunc(handleRegistrySyntaxPacks)))

	mux.Handle("/api/projects", httptransport.CORSMiddleware(projectsHandler))
	mux.Handle("/api/projects/", httptransport.CORSMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.URL.Path, "/compile") {
			compileHandler.ServeHTTP(w, r)
			return
		}
		projectsHandler.ServeHTTP(w, r)
	})))

	mux.Handle("/mcp", httptransport.CORSMiddleware(sseServer.SSEHandler()))
	mux.Handle("/mcp/message", httptransport.CORSMiddleware(sseServer.MessageHandler()))

	port := ":8080"
	log.Printf("Listening on %s (health, registry, /api/projects, /api/projects/:id/compile, /mcp)", port)
	log.Fatal(http.ListenAndServe(port, mux))
}
