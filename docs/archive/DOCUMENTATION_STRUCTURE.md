# VVS Web Documentation Structure

This document outlines the revised documentation structure for the VVS Web project, designed to reduce duplication and improve organization while keeping the MVP-specific documentation separate.

## Reorganized Documentation Structure

### Core Project Documentation
- `docs/README.md` - Project overview and documentation entry point
- `docs/PROJECT_VISION.md` - Project vision, goals, and philosophy

### Development Documentation
- `docs/development/CONTRIBUTING.md` - Guidelines for contributing to the project
- `docs/development/DEVELOPER_GUIDE.md` (**Consolidated**) - Combines GETTING_STARTED.md and implementation details
- `docs/development/ARCHITECTURE.md` (**Consolidated**) - Combines system overview and component architecture
- `docs/development/PROGRESS_REPORT.md` (**Consolidated**) - Combines progress tracking and implementation notes

### MVP-Specific Documentation (Kept Separate)
- `docs/development/MVP_PLAN.md` - Implementation plan for the Python MVP
- `docs/development/IDENTIFIED_ISSUES.md` - Issues identified during MVP testing

### Technical Documentation
- `docs/technical/DATABASE.md` (**Consolidated**) - Combines DATABASE.md and SYNTAX_DATABASE.md
- `docs/technical/FUNCTION_DEFINITIONS.md` (**New**) - Detailed documentation on function definitions
- `docs/technical/NODE_SYSTEM.md` - Documentation on the node system
- `docs/technical/UI_COMPONENTS.md` - Documentation on UI components

### User Documentation
- `docs/user/GETTING_STARTED.md` (**New**) - End-user guide for getting started
- `docs/user/FUNCTION_REFERENCE.md` (**New**) - Reference guide for available functions
- `docs/user/EXAMPLES.md` - Example projects and code
- `docs/user/API.md` - API documentation for advanced usage

### Testing Documentation
- `docs/testing/TESTING_STRATEGY.md` (**New**) - Testing approach and methodology
- `docs/testing/TEST_SPECIFICATIONS.md` (**New**) - Test specifications and coverage requirements

## Consolidation Plan

### 1. Create a Consolidated Developer Guide
- **Source files**: 
  - `docs/development/GETTING_STARTED.md`
  - `docs/development/IMPLEMENTATION_NOTES.md`
- **Target file**: `docs/development/DEVELOPER_GUIDE.md`
- **Approach**: Organize by sections starting with setup, workflow, and then implementation details

### 2. Create a Consolidated Architecture Document
- **Source files**:
  - `docs/development/system/SYSTEM_OVERVIEW.md`
  - `docs/development/system/NODE_SYSTEM.md`
  - `docs/development/system/UI_COMPONENTS.md`
- **Target file**: `docs/development/ARCHITECTURE.md`
- **Approach**: Structure from high-level overview to component-specific details

### 3. Create a Consolidated Progress Report
- **Source files**:
  - `docs/development/PROGRESS_TRACKING.md`
  - `docs/development/IMPLEMENTATION_NOTES.md`
- **Target file**: `docs/development/PROGRESS_REPORT.md`
- **Approach**: Organize chronologically with technical implementation notes linked to progress milestones

### 4. Create a Consolidated Database Document
- **Source files**:
  - `docs/development/system/DATABASE.md`
  - `docs/development/system/SYNTAX_DATABASE.md`
  - `docs/development/system/SYNTAX_DATABASE_DATA.md`
- **Target file**: `docs/technical/DATABASE.md`
- **Approach**: Structure from database design to specific implementations and data models

### 5. Keep MVP Documentation Separate
- **Unchanged files**:
  - `docs/development/MVP_PLAN.md`
  - `docs/development/IDENTIFIED_ISSUES.md`
- **Approach**: Maintain these files separately as requested, but ensure they reference the consolidated documentation where appropriate

## Implementation Steps

1. Create the necessary directory structure
2. Create consolidated documents with appropriate cross-references
3. Update links in existing documents to point to the new consolidated files
4. Archive original files once consolidation is complete (move to an `archive` folder rather than deleting)
5. Update repository documentation index to reflect the new structure

## Benefits of Reorganization

- **Reduced redundancy**: Eliminates duplicate information across multiple files
- **Improved navigation**: Clearer document hierarchy and organization
- **Better maintainability**: Fewer documents to keep updated
- **Separation of concerns**: Clear distinction between MVP-specific and general documentation
- **Progressive disclosure**: Documents organized from high-level to detailed technical content 