# Curriculum Wiring Documentation

## Overview

This document describes the canonical ID scheme and wiring rules for lessons and case studies in the platform. It ensures consistency across all components that reference curriculum content.

## Canonical Structure

### Source of Truth

- **Curriculum Structure**: `lib/curriculum-data.ts` and `lib/curriculum-data-part*.ts` define the canonical structure (domains, modules, lessons) with their IDs, titles, descriptions, and ordering.
- **Lesson Content**: Markdown files in `content/curriculum/` are the source of truth for lesson bodies, titles, and metadata (via frontmatter).

### File Path Structure

Lessons are stored in numbered paths following this pattern:

```
content/curriculum/{domainNumber}-{domainId}/{moduleNumber}-{moduleId}/{lessonNumber}-{lessonId}.md
```

Example:
```
content/curriculum/01-capital-allocation/01-ceo-as-investor/01-five-choices.md
```

Where:
- `domainNumber`: Zero-padded 2-digit index (01, 02, 03, ...)
- `domainId`: Domain ID from curriculum-data (e.g., `capital-allocation`)
- `moduleNumber`: Zero-padded 2-digit module number from curriculum-data
- `moduleId`: Module ID from curriculum-data (e.g., `ceo-as-investor`)
- `lessonNumber`: Zero-padded 2-digit lesson number from curriculum-data
- `lessonId`: Lesson ID from curriculum-data (e.g., `five-choices`)

### ID Resolution Priority

When resolving lesson content and metadata:

1. **Primary**: Markdown files in `content/curriculum/` (numbered paths)
   - Loaded via `loadLessonByPathAsync()` in `lib/content-loader.ts`
   - Frontmatter provides: `title`, `description`, `duration`, `difficulty`
   - Content is the markdown body

2. **Fallback**: `lib/curriculum-data.ts` structure
   - Provides: `title`, `description`, `number`, `id`
   - Used when markdown file doesn't exist or for structural metadata

3. **Legacy**: Unnumbered paths and `content/lessons/` (for backward compatibility)

## Lesson Resolution

### Using `loadLessonByPathAsync()`

All lesson content loading should use `loadLessonByPathAsync(domainId, moduleId, lessonId)` from `lib/content-loader.ts`:

```typescript
import { loadLessonByPathAsync } from '@/lib/content-loader'

const lesson = await loadLessonByPathAsync('capital-allocation', 'ceo-as-investor', 'five-choices')
if (lesson) {
  // lesson.title, lesson.content, lesson.description, etc.
}
```

This function:
- Tries numbered path first: `content/curriculum/01-capital-allocation/01-ceo-as-investor/01-five-choices.md`
- Falls back to unnumbered path: `content/curriculum/capital-allocation/ceo-as-investor/five-choices.md`
- Falls back to legacy path: `content/lessons/five-choices.md`
- Returns `null` if no file found

### Getting Structural Metadata

Use `lib/curriculum-data.ts` utilities for structural information:

```typescript
import { getDomainById, getModuleById, getLessonById, getAllLessonsFlat } from '@/lib/curriculum-data'

const domain = getDomainById('capital-allocation')
const module = getModuleById('capital-allocation', 'ceo-as-investor')
const lesson = getLessonById('capital-allocation', 'ceo-as-investor', 'five-choices')
const allLessons = getAllLessonsFlat() // Flat list of all lessons
```

## Learning Paths

### JSON Structure

Learning paths are defined in `content/paths/*.json`:

```json
{
  "id": "valuation-fundamentals",
  "title": "Valuation Fundamentals",
  "items": [
    {
      "type": "lesson",
      "domain": "capital-allocation",
      "module": "calculating-intrinsic-value",
      "lesson": "owners-earnings"
    },
    {
      "type": "case",
      "caseId": "cs_unit_economics_crisis"
    }
  ]
}
```

### ID Requirements

- **Domain IDs**: Must match IDs in `lib/curriculum-data.ts`
- **Module IDs**: Must match module IDs within the specified domain
- **Lesson IDs**: Must match lesson IDs within the specified module
- **Case IDs**: Must exist in `getAllInteractiveSimulations()` from `lib/case-study-loader.ts`

### Validation

Run the validation script to check all learning paths:

```bash
npx tsx scripts/validate-curriculum-wiring.ts
```

This script:
- Verifies all lessons in curriculum-data have corresponding markdown files
- Checks all learning path items reference valid lessons/cases
- Reports any mismatches or missing files

## Case Studies

### Interactive Simulations

Case studies are loaded from JSON files in `data/case-studies/*.json`:

```typescript
import { getAllInteractiveSimulations } from '@/lib/case-study-loader'

const allSimulations = getAllInteractiveSimulations()
const simulation = allSimulations.find(s => s.caseId === 'cs_unit_economics_crisis')
```

### Routes

Case studies are accessible at:
- `/library/case-studies/[caseId]` - Overview page
- `/library/case-studies/[caseId]/tasks` - Tasks page
- `/library/case-studies/[caseId]/debrief` - Debrief page

## Component Wiring

### Library Sidebar

Uses `getAllLessonsFlat()` from `lib/curriculum-data.ts` to build the navigation tree. Progress is mapped using keys: `${domainId}:${moduleId}:${lessonId}`.

### Search

`lib/lesson-search.ts` searches through:
1. Lesson titles and descriptions from curriculum-data
2. Lesson content from markdown files (via `loadLessonByPathAsync`)

### Recommendations

`lib/recommendation-engine.ts` and `lib/content-collections.ts` use:
- `getAllLessonsFlat()` for lesson metadata
- `getAllInteractiveSimulations()` for case studies
- Canonical IDs for all references

### Dashboard

`lib/dashboard-assembler.ts` uses `completeCurriculumData` from `lib/curriculum-data.ts` to build the roadmap and progress tracking.

## Adding New Lessons

1. **Add to curriculum-data**: Update `lib/curriculum-data-part*.ts` with the new lesson definition
2. **Create markdown file**: Create the file at the numbered path:
   ```
   content/curriculum/{domainNumber}-{domainId}/{moduleNumber}-{moduleId}/{lessonNumber}-{lessonId}.md
   ```
3. **Add frontmatter**: Include title, description, duration, difficulty in frontmatter
4. **Validate**: Run `npx tsx scripts/validate-curriculum-wiring.ts` to ensure everything is wired correctly

## Adding to Learning Paths

1. **Use canonical IDs**: Ensure domain/module/lesson IDs match `lib/curriculum-data.ts`
2. **Verify case IDs**: Ensure case IDs exist in `getAllInteractiveSimulations()`
3. **Validate**: Run the validation script to check the path

## Common Issues

### "Unknown Lesson" in Learning Paths

This occurs when:
- Lesson ID doesn't exist in curriculum-data
- Markdown file doesn't exist
- Path JSON has incorrect domain/module/lesson IDs

**Fix**: 
1. Check the lesson exists in `lib/curriculum-data.ts`
2. Verify the markdown file exists at the numbered path
3. Update the learning path JSON with correct IDs
4. Run validation script

### Lesson Not Found in Search

This occurs when:
- Lesson is not in Year 1 allowlist (if filtering is enabled)
- Markdown file doesn't exist or can't be loaded

**Fix**:
1. Check `lib/year1-allowlist.ts` if filtering is enabled
2. Verify markdown file exists
3. Check file permissions and format

### Case Study Not Found

This occurs when:
- Case ID doesn't exist in `data/case-studies/*.json`
- Case is not in Year 1 allowlist (if filtering is enabled)

**Fix**:
1. Verify JSON file exists in `data/case-studies/`
2. Check `caseId` matches exactly
3. Check `lib/year1-allowlist.ts` if filtering is enabled

## Validation Script

The validation script (`scripts/validate-curriculum-wiring.ts`) checks:

1. ✅ All lessons in curriculum-data have corresponding markdown files
2. ✅ All learning path items reference valid lessons/cases
3. ✅ No orphaned markdown files (except README.md)
4. ✅ All case studies referenced in paths exist

Run it regularly during development to catch wiring issues early.

