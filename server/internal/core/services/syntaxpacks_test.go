package services_test

import (
	"context"
	"encoding/json"
	"strings"
	"testing"

	"vvs-server/internal/core/services"
)

type fakeSyntaxPackRunner struct {
	rosettaOut []byte
	parseOut   []byte
	rosettaErr error
	parseErr   error
}

func (f fakeSyntaxPackRunner) RunRosettaSuite(_ services.RosettaSuiteOptions) ([]byte, error) {
	return f.rosettaOut, f.rosettaErr
}

func (f fakeSyntaxPackRunner) ValidateGeneratedParse(_ services.ParseValidationOptions) ([]byte, error) {
	return f.parseOut, f.parseErr
}

func TestProposeSyntaxDelta(t *testing.T) {
	repoRoot, err := services.FindRepoRoot()
	if err != nil {
		t.Fatalf("FindRepoRoot: %v", err)
	}
	result, err := services.ProposeSyntaxDelta(context.Background(), repoRoot, services.SyntaxDeltaProposalRequest{
		PackID:      "python.base",
		TemplateKey: "Print",
		Quasi:       "print({value})",
		Rationale:   "Keep print syntax explicit",
	})
	if err != nil {
		t.Fatalf("ProposeSyntaxDelta: %v", err)
	}
	if result.Operation != "replace" {
		t.Fatalf("expected replace operation, got %q", result.Operation)
	}
	if !strings.Contains(result.TargetPath, "packages/syntax-packs/src/packs/python.base.json") {
		t.Fatalf("unexpected target path: %s", result.TargetPath)
	}
	if result.Current == nil || result.Current.Quasi == "" {
		t.Fatalf("expected current template row in result: %+v", result)
	}
}

func TestRunRosettaSuiteParsesJSON(t *testing.T) {
	payload, _ := json.Marshal(services.RosettaSuiteResult{
		Ok:     true,
		Total:  1,
		Passed: 1,
		Failed: 0,
		Results: []services.RosettaSuiteCaseResult{{
			Fixture: "print",
			Family:  "python",
			Passed:  true,
		}},
	})
	result, err := services.RunRosettaSuite(context.Background(), fakeSyntaxPackRunner{rosettaOut: payload}, services.RosettaSuiteOptions{})
	if err != nil {
		t.Fatalf("RunRosettaSuite: %v", err)
	}
	if !result.Ok || result.Total != 1 {
		t.Fatalf("unexpected result: %+v", result)
	}
}

func TestValidateGeneratedParseParsesJSON(t *testing.T) {
	payload, _ := json.Marshal(services.ParseValidationResult{
		Ok:      true,
		Total:   1,
		Passed:  1,
		Failed:  0,
		Skipped: 0,
		Results: []services.ParseValidationCaseResult{{
			Fixture:   "print",
			Family:    "python",
			Supported: true,
			Passed:    true,
		}},
	})
	result, err := services.ValidateGeneratedParse(context.Background(), fakeSyntaxPackRunner{parseOut: payload}, services.ParseValidationOptions{})
	if err != nil {
		t.Fatalf("ValidateGeneratedParse: %v", err)
	}
	if !result.Ok || result.Total != 1 {
		t.Fatalf("unexpected result: %+v", result)
	}
}
