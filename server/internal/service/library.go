package service

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"vvs-server/internal/models"
)

type LibraryService struct {
	db *pgx.Conn
}

func NewLibraryService(db *pgx.Conn) *LibraryService {
	return &LibraryService{db: db}
}

// SearchLibrary searches and filters library items
func (s *LibraryService) SearchLibrary(ctx context.Context, req models.LibrarySearchRequest) (models.LibrarySearchResponse, error) {
	if req.PageSize <= 0 || req.PageSize > 100 {
		req.PageSize = 30
	}
	if req.Page < 1 {
		req.Page = 1
	}

	offset := (req.Page - 1) * req.PageSize

	// Build WHERE clauses
	var whereClauses []string
	var args []interface{}
	argIndex := 1

	if req.Query != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("(title ILIKE $%d OR description ILIKE $%d)", argIndex, argIndex))
		args = append(args, "%"+req.Query+"%")
		argIndex++
	}

	if req.Type != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("type = $%d", argIndex))
		args = append(args, req.Type)
		argIndex++
	}

	if len(req.Languages) > 0 {
		whereClauses = append(whereClauses, fmt.Sprintf("target_languages && $%d", argIndex))
		args = append(args, req.Languages)
		argIndex++
	}

	// Determine sort column
	sortCol := "downloads"
	switch req.SortBy {
	case "rating":
		sortCol = "rating DESC, downloads DESC"
	case "createdAt":
		sortCol = "created_at DESC"
	default:
		sortCol = "downloads DESC"
	}

	whereClause := ""
	if len(whereClauses) > 0 {
		whereClause = "WHERE " + strings.Join(whereClauses, " AND ")
	}

	// Count total
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM library_items %s", whereClause)
	var total int
	err := s.db.QueryRow(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		log.Printf("Error counting library items: %v", err)
		return models.LibrarySearchResponse{}, err
	}

	// Fetch paginated results (summary view)
	query := fmt.Sprintf(`
		SELECT id, type, title, description, author, rating, downloads, target_languages, version
		FROM library_items
		%s
		ORDER BY %s
		LIMIT $%d OFFSET $%d
	`, whereClause, sortCol, argIndex, argIndex+1)

	args = append(args, req.PageSize, offset)

	rows, err := s.db.Query(ctx, query, args...)
	if err != nil {
		log.Printf("Error querying library items: %v", err)
		return models.LibrarySearchResponse{}, err
	}
	defer rows.Close()

	var items []models.LibraryItemSummary
	for rows.Next() {
		var item models.LibraryItemSummary
		var langs pq.StringArray // or use sql.NullString with custom parsing

		err := rows.Scan(&item.ID, &item.Type, &item.Title, &item.Description, &item.Author,
			&item.Rating, &item.Downloads, &langs, &item.Version)
		if err != nil {
			log.Printf("Error scanning row: %v", err)
			continue
		}
		item.TargetLanguages = []string(langs)
		items = append(items, item)
	}

	return models.LibrarySearchResponse{
		Items: items,
		Total: total,
		Page:  req.Page,
	}, nil
}

// GetLibraryItem fetches a complete library item by ID
func (s *LibraryService) GetLibraryItem(ctx context.Context, id string) (models.LibraryItem, error) {
	var item models.LibraryItem
	var graphJSON []byte
	var langs pq.StringArray
	var tags pq.StringArray

	query := `
		SELECT id, type, title, description, tags, author, graph, target_languages,
		       node_count, rating, downloads, version, created_at, updated_at, license_id, github_url
		FROM library_items
		WHERE id = $1
	`

	err := s.db.QueryRow(ctx, query, id).Scan(
		&item.ID, &item.Type, &item.Title, &item.Description, &tags, &item.Author, &graphJSON,
		&langs, &item.NodeCount, &item.Rating, &item.Downloads, &item.Version,
		&item.CreatedAt, &item.UpdatedAt, &item.LicenseID, &item.GitHubURL,
	)

	if err != nil {
		if err == pgx.ErrNoRows {
			return models.LibraryItem{}, fmt.Errorf("library item not found: %s", id)
		}
		return models.LibraryItem{}, err
	}

	// Unmarshal graph JSON
	err = json.Unmarshal(graphJSON, &item.Graph)
	if err != nil {
		return models.LibraryItem{}, fmt.Errorf("failed to unmarshal graph: %w", err)
	}

	item.Tags = []string(tags)
	item.TargetLanguages = []string(langs)

	return item, nil
}

// UploadScript saves a new script to the library (auth required)
func (s *LibraryService) UploadScript(ctx context.Context, userID string, req models.UploadScriptRequest) (models.LibraryItem, error) {
	// Generate slug from title
	id := generateSlug(req.Title)

	// Validate graph structure
	if err := validateGraphJSON(req.Graph); err != nil {
		return models.LibraryItem{}, fmt.Errorf("invalid graph: %w", err)
	}

	// Check for moderation triggers
	if err := checkModeration(req.Title, req.Description); err != nil {
		return models.LibraryItem{}, fmt.Errorf("content blocked by moderation: %w", err)
	}

	now := time.Now()
	graphJSON, _ := json.Marshal(req.Graph)

	// Use prepared statement for safety
	query := `
		INSERT INTO library_items
		(id, type, title, description, tags, author, graph, target_languages,
		 node_count, rating, downloads, version, created_at, updated_at, license_id, github_url)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
		RETURNING id, type, title, description, tags, author, graph, target_languages,
		          node_count, rating, downloads, version, created_at, updated_at, license_id, github_url
	`

	var item models.LibraryItem
	var returnedGraphJSON []byte
	var tags pq.StringArray
	var langs pq.StringArray

	err := s.db.QueryRow(ctx, query,
		id,                         // id
		models.LibraryTypeScript,   // type
		req.Title,                  // title
		req.Description,            // description
		req.Tags,                   // tags
		userID,                     // author
		graphJSON,                  // graph
		req.TargetLanguages,        // target_languages
		countNodes(req.Graph),      // node_count
		0,                          // rating
		0,                          // downloads
		"1.0.0",                   // version
		now,                        // created_at
		now,                        // updated_at
		req.LicenseID,              // license_id
		"",                         // github_url (will be set after PR merge)
	).Scan(
		&item.ID, &item.Type, &item.Title, &item.Description, &tags, &item.Author, &returnedGraphJSON,
		&langs, &item.NodeCount, &item.Rating, &item.Downloads, &item.Version,
		&item.CreatedAt, &item.UpdatedAt, &item.LicenseID, &item.GitHubURL,
	)

	if err != nil {
		return models.LibraryItem{}, err
	}

	json.Unmarshal(returnedGraphJSON, &item.Graph)
	item.Tags = []string(tags)
	item.TargetLanguages = []string(langs)

	// Trigger GitHub PR creation workflow
	// This is handled asynchronously by a background job
	go s.createGitHubPullRequest(ctx, userID, item)

	return item, nil
}

// IncrementDownloadCount increments the download counter for a script
func (s *LibraryService) IncrementDownloadCount(ctx context.Context, id string) error {
	query := `UPDATE library_items SET downloads = downloads + 1 WHERE id = $1`
	_, err := s.db.Exec(ctx, query, id)
	return err
}

// GetStatistics returns library-wide statistics
func (s *LibraryService) GetStatistics(ctx context.Context) (models.LibraryStatistics, error) {
	var stats models.LibraryStatistics

	query := `
		SELECT
			COUNT(*) as total,
			SUM(CASE WHEN type = 'script' THEN 1 ELSE 0 END) as scripts,
			SUM(CASE WHEN type = 'node_pack' THEN 1 ELSE 0 END) as packs,
			SUM(CASE WHEN type = 'template' THEN 1 ELSE 0 END) as templates
		FROM library_items
	`

	err := s.db.QueryRow(ctx, query).Scan(
		&stats.TotalItems, &stats.TotalScripts, &stats.TotalNodePacks, &stats.TotalTemplates,
	)

	return stats, err
}

// Helper functions

func generateSlug(title string) string {
	// Simple slug generation: lowercase, replace spaces with hyphens, remove non-alphanumeric
	s := strings.ToLower(title)
	s = strings.ReplaceAll(s, " ", "-")
	var result strings.Builder
	for _, r := range s {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '-' {
			result.WriteRune(r)
		}
	}
	return result.String()
}

func validateGraphJSON(graph map[string]interface{}) error {
	// Basic validation: check for required fields
	if len(graph) == 0 {
		return fmt.Errorf("graph is empty")
	}
	// Add more specific validation as needed
	return nil
}

func checkModeration(title, description string) error {
	// Placeholder for moderation checks (spam patterns, etc.)
	return nil
}

func countNodes(graph map[string]interface{}) int {
	// Count nodes in graph structure
	// This is a placeholder; actual logic depends on graph schema
	if nodes, ok := graph["nodes"]; ok {
		if nodeList, ok := nodes.([]interface{}); ok {
			return len(nodeList)
		}
	}
	return 0
}

func (s *LibraryService) createGitHubPullRequest(ctx context.Context, userID string, item models.LibraryItem) {
	// This function would call GitHub API to create a PR
	// For now, it's a placeholder that logs the action
	log.Printf("[TODO] Creating GitHub PR for script: %s by user %s", item.ID, userID)
	// TODO: Implement GitHub API call when authentication is available
}
