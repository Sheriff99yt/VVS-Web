package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"

	"vvs-server/internal/core/domain"
	"vvs-server/internal/core/store"
)

// TranspilerRunner executes snapshot → TranspileResult conversion.
type TranspilerRunner interface {
	Compile(snapshotJSON []byte) ([]byte, error)
}

// CLITranspiler invokes `bun run generate:cli` in packages/transpiler.
type CLITranspiler struct {
	RepoRoot string
	BunPath  string
}

func NewCLITranspiler(repoRoot string) *CLITranspiler {
	bunPath := os.Getenv("BUN_PATH")
	if bunPath == "" {
		bunPath = "bun"
	}
	return &CLITranspiler{RepoRoot: repoRoot, BunPath: bunPath}
}

func (c *CLITranspiler) Compile(snapshotJSON []byte) ([]byte, error) {
	transpilerDir := filepath.Join(c.RepoRoot, "packages", "transpiler")
	cmd := exec.Command(c.BunPath, "run", "generate:cli")
	cmd.Dir = transpilerDir
	cmd.Stdin = bytes.NewReader(snapshotJSON)
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr
	if err := cmd.Run(); err != nil {
		msg := stderr.String()
		if msg == "" {
			msg = err.Error()
		}
		return nil, fmt.Errorf("transpiler CLI failed: %s", msg)
	}
	return stdout.Bytes(), nil
}

// FindRepoRoot walks upward from cwd looking for packages/transpiler.
func FindRepoRoot() (string, error) {
	if root := os.Getenv("VVS_REPO_ROOT"); root != "" {
		return root, nil
	}
	cwd, err := os.Getwd()
	if err != nil {
		return "", err
	}
	dir := cwd
	for {
		candidate := filepath.Join(dir, "packages", "transpiler", "package.json")
		if _, err := os.Stat(candidate); err == nil {
			return dir, nil
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			break
		}
		dir = parent
	}
	return "", fmt.Errorf("could not locate repo root (set VVS_REPO_ROOT)")
}

// CompileProject runs the transpiler CLI against a stored project snapshot.
func CompileProject(ctx context.Context, st store.ProjectStore, projectID string, runner TranspilerRunner) (*domain.TranspileResult, error) {
	snap, err := LoadProject(ctx, st, projectID)
	if err != nil {
		return nil, err
	}
	payload, err := json.Marshal(snap)
	if err != nil {
		return nil, err
	}
	out, err := runner.Compile(payload)
	if err != nil {
		return nil, err
	}
	var result domain.TranspileResult
	if err := json.Unmarshal(out, &result); err != nil {
		return nil, fmt.Errorf("invalid transpiler output: %w", err)
	}
	return &result, nil
}
