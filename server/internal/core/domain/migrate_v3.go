package domain

// MainClassID is the default class id for v2→v3 migration and single-class projects.
const MainClassID = "main-class"

// NormalizeSnapshot upgrades v1/v2 snapshots to v3 in place (synthetic main-class when needed).
func NormalizeSnapshot(snap *ProjectSnapshot) {
	if snap == nil {
		return
	}

	ensureDocuments(snap)

	moduleName := snap.ProjectDetails.ModuleName
	if moduleName == "" {
		moduleName = "Untitled"
		snap.ProjectDetails.ModuleName = moduleName
	}
	extendsType := snap.ProjectDetails.ExtendsType

	var classes []ClassSymbol
	var activeClassID string

	if snap.Version >= 3 && len(snap.Classes) > 0 {
		classes = normalizeClassSymbols(snap.Classes)
		activeClassID = snap.ActiveClassId
		if activeClassID == "" {
			activeClassID = classes[0].ID
		}
	} else {
		classes = []ClassSymbol{createClassSymbol(moduleName, MainClassID, extendsType, "main")}
		activeClassID = MainClassID
	}

	if len(classes) == 0 {
		classes = []ClassSymbol{createClassSymbol(moduleName, MainClassID, extendsType, "main")}
		activeClassID = MainClassID
	}

	if !classExists(classes, activeClassID) {
		activeClassID = classes[0].ID
	}

	defaultClassID := MainClassID
	if !classExists(classes, defaultClassID) {
		defaultClassID = classes[0].ID
	}

	stampVariablesWithClassID(snap.Variables, defaultClassID)
	stampFunctionsWithClassID(snap.Functions, defaultClassID)
	stampEventsWithClassID(snap.Events, defaultClassID)

	snap.Version = 3
	snap.Classes = classes
	snap.ActiveClassId = activeClassID
}

func ensureDocuments(snap *ProjectSnapshot) {
	if snap.Documents == nil {
		snap.Documents = map[string]GraphDocument{}
	}
	if _, ok := snap.Documents["main"]; !ok {
		snap.Documents["main"] = GraphDocument{Nodes: []Node{}, Edges: []Edge{}}
	}
	if len(snap.OpenTabs) == 0 {
		snap.OpenTabs = []GraphTab{{ID: "main", Type: "main", Name: "Main graph"}}
	}
	hasMainTab := false
	for _, tab := range snap.OpenTabs {
		if tab.ID == "main" {
			hasMainTab = true
			break
		}
	}
	if !hasMainTab {
		snap.OpenTabs = append([]GraphTab{{ID: "main", Type: "main", Name: "Main graph"}}, snap.OpenTabs...)
	}
	if snap.ActiveGraphTab == "" {
		snap.ActiveGraphTab = "main"
	}
	if _, ok := snap.Documents[snap.ActiveGraphTab]; !ok {
		snap.ActiveGraphTab = "main"
	}
}

func createClassSymbol(name, id, extendsType, graphTabID string) ClassSymbol {
	if graphTabID == "" {
		graphTabID = id
	}
	return ClassSymbol{
		Kind:        "class",
		ID:          id,
		Name:        name,
		ExtendsType: extendsType,
		GraphTabID:  graphTabID,
		Visibility:  "public",
	}
}

func normalizeClassSymbols(raw []ClassSymbol) []ClassSymbol {
	out := make([]ClassSymbol, 0, len(raw))
	for _, cls := range raw {
		if cls.Kind != "class" || cls.ID == "" {
			continue
		}
		name := cls.Name
		if name == "" {
			name = "Untitled"
		}
		tabID := cls.GraphTabID
		if tabID == "" {
			tabID = cls.ID
		}
		visibility := cls.Visibility
		if visibility != "private" {
			visibility = "public"
		}
		out = append(out, ClassSymbol{
			Kind:        "class",
			ID:          cls.ID,
			Name:        name,
			ExtendsType: cls.ExtendsType,
			Description: cls.Description,
			GraphTabID:  tabID,
			Visibility:  visibility,
		})
	}
	return out
}

func classExists(classes []ClassSymbol, id string) bool {
	for _, cls := range classes {
		if cls.ID == id {
			return true
		}
	}
	return false
}

func stampVariablesWithClassID(vars []GraphVariable, classID string) {
	for i := range vars {
		if vars[i].ClassID == "" {
			vars[i].ClassID = classID
		}
	}
}

func stampFunctionsWithClassID(funcs []FunctionSymbol, classID string) {
	for i := range funcs {
		if funcs[i].ClassID == "" {
			funcs[i].ClassID = classID
		}
	}
}

func stampEventsWithClassID(events []ProjectEventDefinition, classID string) {
	for i := range events {
		if events[i].ClassID == "" {
			events[i].ClassID = classID
		}
	}
}

// ClassGraphTabID returns the graph tab id for a class (defaults to class id).
func ClassGraphTabID(cls ClassSymbol) string {
	if cls.GraphTabID != "" {
		return cls.GraphTabID
	}
	return cls.ID
}

// FindClass returns the class symbol for id, or nil when not found.
func FindClass(snap *ProjectSnapshot, classID string) *ClassSymbol {
	for i := range snap.Classes {
		if snap.Classes[i].ID == classID {
			return &snap.Classes[i]
		}
	}
	return nil
}
