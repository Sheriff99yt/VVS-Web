package models

import (
	"time"
)

// LibraryItemType represents the category of a library item
type LibraryItemType string

const (
	LibraryTypeScript    LibraryItemType = "script"
	LibraryTypeNodePack  LibraryItemType = "node_pack"
	LibraryTypeTemplate  LibraryItemType = "template"
)

// LibraryItem represents a community-shared script, node pack, or template
type LibraryItem struct {
	ID                string            `db:"id" json:"id"`
	Type              LibraryItemType   `db:"type" json:"type"`
	Title             string            `db:"title" json:"title"`
	Description       string            `db:"description" json:"description"`
	Tags              []string          `db:"tags" json:"tags"`
	Author            string            `db:"author" json:"author"`
	Graph             map[string]interface{} `db:"graph" json:"graph"`
	TargetLanguages   []string          `db:"target_languages" json:"targetLanguages"`
	NodeCount         int               `db:"node_count" json:"nodeCount"`
	Rating            float32           `db:"rating" json:"rating"`
	Downloads         int               `db:"downloads" json:"downloads"`
	Version           string            `db:"version" json:"version"`
	CreatedAt         time.Time         `db:"created_at" json:"createdAt"`
	UpdatedAt         time.Time         `db:"updated_at" json:"updatedAt"`
	LicenseID         string            `db:"license_id" json:"licenseId"`
	GitHubURL         string            `db:"github_url" json:"gitHubUrl"`
}

// LibrarySearchRequest represents a search/filter request
type LibrarySearchRequest struct {
	Query           string   `json:"q"`
	Type            string   `json:"type"`
	Languages       []string `json:"languages"`
	Tags            []string `json:"tags"`
	SortBy          string   `json:"sortBy"`     // "downloads", "rating", "createdAt"
	Page            int      `json:"page"`
	PageSize        int      `json:"pageSize"`
	SemanticSearch  bool     `json:"semantic"`
}

// LibrarySearchResponse represents paginated search results
type LibrarySearchResponse struct {
	Items []LibraryItemSummary `json:"items"`
	Total int                  `json:"total"`
	Page  int                  `json:"page"`
}

// LibraryItemSummary is the condensed view for search results
type LibraryItemSummary struct {
	ID                string     `json:"id"`
	Type              LibraryItemType `json:"type"`
	Title             string     `json:"title"`
	Description       string     `json:"description"`
	Author            string     `json:"author"`
	Rating            float32    `json:"rating"`
	Downloads         int        `json:"downloads"`
	TargetLanguages   []string   `json:"targetLanguages"`
	Version           string     `json:"version"`
}

// UploadScriptRequest represents an incoming script upload
type UploadScriptRequest struct {
	Title           string                 `json:"title"`
	Description     string                 `json:"description"`
	Graph           map[string]interface{} `json:"graph"`
	TargetLanguages []string               `json:"targetLanguages"`
	Tags            []string               `json:"tags"`
	LicenseID       string                 `json:"licenseId"`
}

// LibraryStatistics represents library-wide statistics
type LibraryStatistics struct {
	TotalItems   int `json:"totalItems"`
	TotalScripts int `json:"totalScripts"`
	TotalNodePacks int `json:"totalNodePacks"`
	TotalTemplates int `json:"totalTemplates"`
}
