// Trusted fixture validator. It never compiles or executes imported user programs.
package main

import (
	"encoding/json"
	"fmt"
	"go/ast"
	"go/parser"
	"go/token"
	"go/types"
	"os"
	"reflect"
	"strings"
)

var positionType = reflect.TypeOf(token.Pos(0))

func structure(value reflect.Value) any {
	if !value.IsValid() {
		return nil
	}
	if value.Type() == positionType {
		return nil
	}
	if value.Kind() == reflect.Interface || value.Kind() == reflect.Pointer {
		if value.IsNil() {
			return nil
		}
		if paren, ok := value.Interface().(*ast.ParenExpr); ok {
			return structure(reflect.ValueOf(paren.X))
		}
		return structure(value.Elem())
	}
	switch value.Kind() {
	case reflect.Struct:
		fields := map[string]any{"node": value.Type().Name()}
		for index := 0; index < value.NumField(); index++ {
			field := value.Type().Field(index)
			if field.Type == positionType || strings.Contains(field.Name, "Pos") || field.Name == "Scope" || field.Name == "Obj" || field.Name == "Unresolved" || field.Name == "Doc" || field.Name == "Comment" || field.Name == "Comments" {
				continue
			}
			fields[field.Name] = structure(value.Field(index))
		}
		return fields
	case reflect.Slice:
		items := make([]any, value.Len())
		for index := range items {
			items[index] = structure(value.Index(index))
		}
		return items
	default:
		return value.Interface()
	}
}

func facts(source string, wordBits int) ([]byte, error) {
	fset := token.NewFileSet()
	file, err := parser.ParseFile(fset, "fixture.go", source, parser.AllErrors|parser.SkipObjectResolution)
	if err != nil {
		return nil, err
	}
	arch := "amd64"
	if wordBits == 32 {
		arch = "386"
	}
	config := types.Config{GoVersion: "go1.26", Sizes: types.SizesFor("gc", arch)}
	if _, err = config.Check("fixture", fset, []*ast.File{file}, nil); err != nil {
		return nil, err
	}
	return json.Marshal(structure(reflect.ValueOf(file)))
}

func main() {
	if len(os.Args) == 2 && os.Args[1] == "--integer-facts" {
		integerFacts()
		return
	}
	wordBits := 64
	if len(os.Args) == 2 && os.Args[1] == "--word32" {
		wordBits = 32
	}
	var pairs [][2]string
	if err := json.NewDecoder(os.Stdin).Decode(&pairs); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	for index, pair := range pairs {
		first, err := facts(pair[0], wordBits)
		if err != nil {
			fmt.Fprintf(os.Stderr, "source %d: %v\n", index, err)
			os.Exit(1)
		}
		second, err := facts(pair[1], wordBits)
		if err != nil {
			fmt.Fprintf(os.Stderr, "generated %d: %v\n", index, err)
			os.Exit(1)
		}
		if string(first) != string(second) {
			fmt.Fprintf(os.Stderr, "AST mismatch %d\n", index)
			os.Exit(1)
		}
	}
	fmt.Printf("Go 1.26 native AST/type checks: %d cases passed\n", len(pairs))
}

// Trusted constant/type observations, independent from the TypeScript integer contract.
func integerFacts() {
	var rows []struct {
		Source             string `json:"source"`
		WordBits           int    `json:"wordBits"`
		IncludeExpressions bool   `json:"includeExpressions"`
	}
	if err := json.NewDecoder(os.Stdin).Decode(&rows); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	results := make([]map[string]any, len(rows))
	for index, row := range rows {
		fset := token.NewFileSet()
		file, err := parser.ParseFile(fset, "integer.go", row.Source, parser.AllErrors|parser.SkipObjectResolution)
		arch := "amd64"
		if row.WordBits == 32 {
			arch = "386"
		} else if row.WordBits != 64 {
			results[index] = map[string]any{"ok": false, "error": "invalid explicit word size"}
			continue
		}
		var pkg *types.Package
		info := &types.Info{Types: map[ast.Expr]types.TypeAndValue{}}
		if err == nil {
			config := types.Config{GoVersion: "go1.26", Sizes: types.SizesFor("gc", arch)}
			pkg, err = config.Check("integer", fset, []*ast.File{file}, info)
		}
		if err != nil {
			results[index] = map[string]any{"ok": false, "error": err.Error()}
			continue
		}
		object := pkg.Scope().Lookup("Value")
		if object == nil {
			results[index] = map[string]any{"ok": false, "error": "Value fixture binding missing"}
			continue
		}
		result := map[string]any{"ok": true, "type": object.Type().String()}
		if constant, ok := object.(*types.Const); ok {
			result["constant"] = constant.Val().ExactString()
		}
		if row.IncludeExpressions {
			expressions := []map[string]any{}
			ast.Inspect(file, func(node ast.Node) bool {
				expr, ok := node.(ast.Expr)
				if !ok {
					return true
				}
				value, found := info.Types[expr]
				if !found {
					return true
				}
				start, end := fset.Position(expr.Pos()).Offset, fset.Position(expr.End()).Offset
				item := map[string]any{"source": row.Source[start:end], "type": value.Type.String()}
				if value.Value != nil {
					item["constant"] = value.Value.ExactString()
				}
				expressions = append(expressions, item)
				return true
			})
			result["expressions"] = expressions
		}
		results[index] = result
	}
	if err := json.NewEncoder(os.Stdout).Encode(results); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
