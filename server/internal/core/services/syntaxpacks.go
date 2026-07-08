package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"

	"vvs-server/internal/core/registry"
)

type SyntaxTemplateSlot struct {
	Kind string `json:"kind"`
	Name string `json:"name"`
}

type SyntaxTemplateRow struct {
	Quasi string             `json:"quasi,omitempty"`
	Lego  []SyntaxTemplateSlot `json:"lego,omitempty"`
}

type SyntaxDeltaProposalRequest struct {
	PackID      string             `json:"packId"`
	TemplateKey string             `json:"templateKey"`
	Quasi       string             `json:"quasi,omitempty"`
	Lego        []SyntaxTemplateSlot `json:"lego,omitempty"`
	Rationale   string             `json:"rationale,omitempty"`
}

type SyntaxDeltaProposalResult struct {
	PackID       string            `json:"packId"`
	TargetPath   string            `json:"targetPath"`
	TemplateKey  string            `json:"templateKey"`
	Operation    string            `json:"operation"`
	Rationale    string            `json:"rationale,omitempty"`
	Current      *SyntaxTemplateRow `json:"current,omitempty"`
	Proposed     SyntaxTemplateRow `json:"proposed"`
	TemplateJSON string            `json:"templateJson"`
}

type RosettaSuiteOptions struct {
	Family  string
	Fixture string
}

type RosettaSuiteCaseResult struct {
	Fixture    string `json:"fixture"`
	Family     string `json:"family"`
	Passed     bool   `json:"passed"`
	GoldenPath string `json:"goldenPath"`
	Message    string `json:"message,omitempty"`
}

type RosettaSuiteResult struct {
	Ok      bool                     `json:"ok"`
	Total   int                      `json:"total"`
	Passed  int                      `json:"passed"`
	Failed  int                      `json:"failed"`
	Results []RosettaSuiteCaseResult `json:"results"`
}

type ParseValidationOptions struct {
	Family  string
	Fixture string
}

type ParseIssue struct {
	Kind   string `json:"kind"`
	Row    int    `json:"row"`
	Column int    `json:"column"`
	Text   string `json:"text"`
}

type ParseValidationCaseResult struct {
	Fixture   string       `json:"fixture"`
	Family    string       `json:"family"`
	Supported bool         `json:"supported"`
	Passed    bool         `json:"passed"`
	Issues    []ParseIssue `json:"issues"`
}

type ParseValidationResult struct {
	Ok      bool                        `json:"ok"`
	Total   int                         `json:"total"`
	Passed  int                         `json:"passed"`
	Failed  int                         `json:"failed"`
	Skipped int                         `json:"skipped"`
	Results []ParseValidationCaseResult `json:"results"`
}

type SyntaxPackRunner interface {
	RunRosettaSuite(opts RosettaSuiteOptions) ([]byte, error)
	ValidateGeneratedParse(opts ParseValidationOptions) ([]byte, error)
}

type CLISyntaxPackRunner struct {
	RepoRoot string
	BunPath  string
}

func NewCLISyntaxPackRunner(repoRoot string) *CLISyntaxPackRunner {
	bunPath := os.Getenv("BUN_PATH")
	if bunPath == "" {
		bunPath = "bun"
	}
	return &CLISyntaxPackRunner{RepoRoot: repoRoot, BunPath: bunPath}
}

func (c *CLISyntaxPackRunner) runScript(script string, args []string, allowFailure bool) ([]byte, error) {
	packDir := filepath.Join(c.RepoRoot, "packages", "syntax-packs")
	cmdArgs := []string{"run", script}
	cmdArgs = append(cmdArgs, args...)
	cmd := exec.Command(c.BunPath, cmdArgs...)
	cmd.Dir = packDir
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr
	if err := cmd.Run(); err != nil {
		if allowFailure && stdout.Len() > 0 {
			return stdout.Bytes(), nil
		}
		msg := stderr.String()
		if msg == "" {
			msg = err.Error()
		}
		return nil, fmt.Errorf("syntax-pack script failed: %s", msg)
	}
	return stdout.Bytes(), nil
}

func (c *CLISyntaxPackRunner) RunRosettaSuite(opts RosettaSuiteOptions) ([]byte, error) {
	var args []string
	if opts.Family != "" {
		args = append(args, "--family", opts.Family)
	}
	if opts.Fixture != "" {
		args = append(args, "--fixture", opts.Fixture)
	}
	return c.runScript("scripts/run-rosetta-suite.ts", args, true)
}

func (c *CLISyntaxPackRunner) ValidateGeneratedParse(opts ParseValidationOptions) ([]byte, error) {
	var args []string
	if opts.Family != "" {
		args = append(args, "--family", opts.Family)
	}
	if opts.Fixture != "" {
		args = append(args, "--fixture", opts.Fixture)
	}
	return c.runScript("scripts/validate-generated-parse.ts", args, true)
}

func ProposeSyntaxDelta(_ context.Context, repoRoot string, req SyntaxDeltaProposalRequest) (*SyntaxDeltaProposalResult, error) {
	if req.PackID == "" {
		return nil, fmt.Errorf("packId is required")
	}
	if req.TemplateKey == "" {
		return nil, fmt.Errorf("templateKey is required")
	}
	if req.Quasi == "" && len(req.Lego) == 0 {
		return nil, fmt.Errorf("either quasi or lego is required")
	}
	if req.Quasi != "" && len(req.Lego) > 0 {
		return nil, fmt.Errorf("quasi and lego are mutually exclusive")
	}

	entry, err := findSyntaxPackEntry(req.PackID)
	if err != nil {
		return nil, err
	}
	targetPath := syntaxPackPath(repoRoot, entry)
	manifest, err := loadSyntaxPackManifest(targetPath)
	if err != nil {
		return nil, err
	}
	current, hasCurrent := manifest.Templates[req.TemplateKey]
	proposed := SyntaxTemplateRow{Quasi: req.Quasi, Lego: req.Lego}
	proposedJSON, err := json.MarshalIndent(map[string]SyntaxTemplateRow{
		req.TemplateKey: proposed,
	}, "", "  ")
	if err != nil {
		return nil, err
	}

	result := &SyntaxDeltaProposalResult{
		PackID:       req.PackID,
		TargetPath:   filepath.ToSlash(targetPath),
		TemplateKey:  req.TemplateKey,
		Operation:    "add",
		Rationale:    req.Rationale,
		Proposed:     proposed,
		TemplateJSON: string(proposedJSON),
	}
	if hasCurrent {
		copyCurrent := current
		result.Current = &copyCurrent
		result.Operation = "replace"
	}
	return result, nil
}

func RunRosettaSuite(_ context.Context, runner SyntaxPackRunner, opts RosettaSuiteOptions) (*RosettaSuiteResult, error) {
	out, err := runner.RunRosettaSuite(opts)
	if err != nil {
		return nil, err
	}
	var result RosettaSuiteResult
	if err := json.Unmarshal(out, &result); err != nil {
		return nil, fmt.Errorf("invalid rosetta suite output: %w", err)
	}
	return &result, nil
}

func ValidateGeneratedParse(_ context.Context, runner SyntaxPackRunner, opts ParseValidationOptions) (*ParseValidationResult, error) {
	out, err := runner.ValidateGeneratedParse(opts)
	if err != nil {
		return nil, err
	}
	var result ParseValidationResult
	if err := json.Unmarshal(out, &result); err != nil {
		return nil, fmt.Errorf("invalid parse validation output: %w", err)
	}
	return &result, nil
}

type syntaxPackManifest struct {
	Templates map[string]SyntaxTemplateRow `json:"templates"`
}

func loadSyntaxPackManifest(path string) (*syntaxPackManifest, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read syntax pack %s: %w", path, err)
	}
	var manifest syntaxPackManifest
	if err := json.Unmarshal(data, &manifest); err != nil {
		return nil, fmt.Errorf("parse syntax pack %s: %w", path, err)
	}
	return &manifest, nil
}

func findSyntaxPackEntry(packID string) (*registry.SyntaxPackCatalogEntry, error) {
	packs, err := registry.ListSyntaxPacks()
	if err != nil {
		return nil, err
	}
	for _, entry := range packs {
		if entry.ID == packID {
			copyEntry := entry
			return &copyEntry, nil
		}
	}
	return nil, fmt.Errorf("unknown syntax pack: %s", packID)
}

func syntaxPackPath(repoRoot string, entry *registry.SyntaxPackCatalogEntry) string {
	if entry.Extends != nil {
		return filepath.Join(repoRoot, "packages", "syntax-packs", "src", "packs", "overlays", entry.ID+".json")
	}
	return filepath.Join(repoRoot, "packages", "syntax-packs", "src", "packs", entry.ID+".json")
}
