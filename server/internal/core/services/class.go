package services

import (
	"context"
	"errors"
	"fmt"
	"time"

	"vvs-server/internal/core/domain"
	"vvs-server/internal/core/store"
)

var (
	ErrClassNotFound      = errors.New("class not found")
	ErrClassNameRequired  = errors.New("class name is required")
	ErrCannotRemoveLastClass = errors.New("cannot remove the last class")
)

// ListClasses returns all class symbols in a project snapshot.
func ListClasses(ctx context.Context, st store.ProjectStore, projectID string) ([]domain.ClassSymbol, string, error) {
	snap, err := LoadProject(ctx, st, projectID)
	if err != nil {
		return nil, "", err
	}
	return snap.Classes, snap.ActiveClassId, nil
}

// AddClass creates a new class with an empty class graph tab and sets it active.
func AddClass(ctx context.Context, st store.ProjectStore, projectID, name string) (*domain.ClassSymbol, error) {
	trimmed := name
	if trimmed == "" {
		return nil, ErrClassNameRequired
	}

	snap, err := LoadProject(ctx, st, projectID)
	if err != nil {
		return nil, err
	}

	classID := fmt.Sprintf("class-%d", time.Now().UnixNano())
	tabID := classID
	cls := domain.ClassSymbol{
		Kind:       "class",
		ID:         classID,
		Name:       trimmed,
		GraphTabID: tabID,
		Visibility: "public",
	}

	snap.Classes = append(snap.Classes, cls)
	snap.OpenTabs = append(snap.OpenTabs, domain.GraphTab{
		ID:   tabID,
		Type: "class",
		Name: trimmed,
	})
	if snap.Documents == nil {
		snap.Documents = map[string]domain.GraphDocument{}
	}
	snap.Documents[tabID] = domain.GraphDocument{
		Nodes: []domain.Node{},
		Edges: []domain.Edge{},
	}
	snap.ActiveClassId = classID
	snap.ActiveGraphTab = tabID

	if err := SaveProject(ctx, st, projectID, *snap); err != nil {
		return nil, err
	}
	return &cls, nil
}

// SetActiveClass updates the active class and switches to its class graph tab.
func SetActiveClass(ctx context.Context, st store.ProjectStore, projectID, classID string) error {
	snap, err := LoadProject(ctx, st, projectID)
	if err != nil {
		return err
	}

	cls := domain.FindClass(snap, classID)
	if cls == nil {
		return ErrClassNotFound
	}

	tabID := domain.ClassGraphTabID(*cls)
	if _, ok := snap.Documents[tabID]; !ok {
		snap.Documents[tabID] = domain.GraphDocument{
			Nodes: []domain.Node{},
			Edges: []domain.Edge{},
		}
	}

	snap.ActiveClassId = classID
	snap.ActiveGraphTab = tabID
	return SaveProject(ctx, st, projectID, *snap)
}
