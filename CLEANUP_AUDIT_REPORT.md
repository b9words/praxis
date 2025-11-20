# Codebase Cleanup & Consolidation Audit Report

**Date:** Generated during cleanup audit  
**Scope:** Application/runtime code (`app/`, `components/`, `lib/`, `hooks/`, `supabase/functions/`, `scripts/`)

## Executive Summary

This audit identified:
- **6 deprecated scripts** safe to remove (already throw errors when used)
- **4 duplicate components** that can be consolidated
- **1 unused component** (`components/library/CaseStudyViewer.tsx`)
- **2 empty directories** that can be removed
- **Dev-only tooling** properly gated but could benefit from better documentation
- **Legacy routing code** that should be kept (actively used for redirects)

---

## 1. Safe-to-Remove: Deprecated Scripts

### High Confidence - Can Delete Immediately

These scripts are explicitly marked `@deprecated`, throw errors when executed, and have API/UI replacements:

#### 1.1 `scripts/generate-lesson.ts`
- **Status:** Deprecated, throws error on execution
- **Replacement:** `/api/content-generation/generate-lesson` endpoint
- **Evidence:** 
  - Lines 151-154, 159-169, 270-273: Explicit deprecation warnings and error throws
  - Not imported by any runtime code (only self-references)
- **Action:** ✅ **DELETE** - Safe to remove

#### 1.2 `scripts/assemble-case.ts`
- **Status:** Deprecated, throws error on execution
- **Replacement:** `/api/case-studies/generate/assemble` endpoint
- **Evidence:**
  - Lines 125-128, 190-193: Explicit deprecation warnings and error throws
  - Not imported by runtime code
- **Action:** ✅ **DELETE** - Safe to remove

#### 1.3 `scripts/generate-case.ts`
- **Status:** Deprecated, throws error on execution
- **Replacement:** `/api/content-generation/generate-case` endpoint
- **Evidence:**
  - Lines 75-78, 83-86, 150-153, 158-161: Multiple deprecation warnings and error throws
  - Comment on line 18: "This script uses the legacy curriculum-based approach"
  - Not imported by runtime code
- **Action:** ✅ **DELETE** - Safe to remove

#### 1.4 `scripts/generate-case-asset.ts`
- **Status:** Deprecated, throws error on execution
- **Replacement:** `/api/case-generation/generate-asset` endpoint
- **Evidence:**
  - Lines 205-211: Explicit deprecation warning and error throw
  - Not imported by runtime code
- **Action:** ✅ **DELETE** - Safe to remove

#### 1.5 `scripts/generate-case-from-blueprint.ts`
- **Status:** Deprecated, throws error on execution
- **Replacement:** `/api/content-generation/generate-case` endpoint
- **Evidence:**
  - Lines 29-35: Explicit deprecation warning and error throw
  - Not imported by runtime code
- **Action:** ✅ **DELETE** - Safe to remove

#### 1.6 `scripts/generate-shared.ts` - `repairContent` function
- **Status:** Deprecated function (not entire file)
- **Evidence:**
  - Lines 634-645: Function marked deprecated, only returns original content unchanged
  - Only used by deprecated CLI scripts (which we're removing)
  - File itself is still used by API routes (`app/api/content-generation/generate-case/route.ts`, `app/api/case-generation/generate-all/route.ts`, `app/api/case-generation/generate-asset/route.ts`)
- **Action:** ⚠️ **PARTIAL** - Remove only the `repairContent` function (lines 632-645), keep the rest of the file

---

## 2. Duplicate Components - Consolidation Opportunities

### 2.1 Identical Duplicates (100% match)

#### `components/case-study/CaseFileViewer.tsx` vs `components/simulation/CaseFileViewer.tsx`
- **Status:** Identical files (92 lines, byte-for-byte match except import paths)
- **Difference:** Only import path differs:
  - `case-study` version: `import StructuredCaseDisplay from '@/components/case-study/StructuredCaseDisplay'`
  - `simulation` version: `import StructuredCaseDisplay from '@/components/simulation/StructuredCaseDisplay'`
- **Usage:**
  - `case-study` version: Used by `components/case-study/CaseStudyWorkspace.tsx` (line 805)
  - `simulation` version: Used by `components/simulation/SimulationWorkspace.tsx` (not directly, but referenced)
- **Action:** ✅ **CONSOLIDATE** - Delete `components/simulation/CaseFileViewer.tsx`, update `SimulationWorkspace.tsx` to import from `@/components/case-study/CaseFileViewer`

#### `components/case-study/StructuredCaseDisplay.tsx` vs `components/simulation/StructuredCaseDisplay.tsx`
- **Status:** Identical files (178 lines, byte-for-byte match)
- **Usage:**
  - `case-study` version: Used by `components/case-study/CaseFileViewer.tsx`
  - `simulation` version: Used by `components/simulation/CaseFileViewer.tsx`
- **Action:** ✅ **CONSOLIDATE** - Delete `components/simulation/StructuredCaseDisplay.tsx`. After consolidating CaseFileViewer, this will be automatically consolidated too.

### 2.2 Similar Components (Potential Consolidation)

#### `components/case-study/CaseStudyWorkspace.tsx` vs `components/simulation/SimulationWorkspace.tsx`
- **Status:** Similar functionality, but `CaseStudyWorkspace` is more feature-rich
- **Key Differences:**
  - `CaseStudyWorkspace` has: tabs (tasks/files/rubric), publish modal, progress tracking, submit confirmation
  - `SimulationWorkspace` is simpler: just resizable panels with files and decision workspace
- **Usage:**
  - `CaseStudyWorkspace`: Used in `app/(app)/library/case-studies/[caseId]/tasks/page.tsx`
  - `SimulationWorkspace`: Referenced in docs but usage unclear (may be legacy)
- **Evidence:** `lib/case-study-data-converter.ts` and `lib/simulation-data-converter.ts` mention "Bridges compatibility between SimulationWorkspace (legacy) and CaseStudyPlayer (new format)"
- **Action:** ⚠️ **INVESTIGATE** - Verify if `SimulationWorkspace` is still used. If not, can be removed. If yes, consider migrating to `CaseStudyWorkspace` or consolidating.

---

## 3. Unused Components

### 3.1 `components/library/CaseStudyViewer.tsx`
- **Status:** Not imported anywhere in the codebase
- **Evidence:** 
  - Grep search found zero imports
  - 424 lines of code that appears to be a comprehensive case study viewer component
- **Action:** ⚠️ **INVESTIGATE** - May be:
  - Planned feature not yet integrated
  - Legacy component from old design
  - Should be used but isn't
  
  **Recommendation:** Check with team if this is intentional. If unused, can be removed or moved to archive.

---

## 4. Empty Directories

### 4.1 `app/api/sync-local-file/`
- **Status:** Empty directory (no files)
- **Evidence:** Directory exists but contains no route files
- **Action:** ✅ **DELETE** - Remove empty directory

### 4.2 `components/community/`
- **Status:** Empty directory (no files)
- **Evidence:** Directory exists but contains no components
- **Action:** ✅ **DELETE** - Remove empty directory

---

## 5. Dev-Only Tooling (Keep, But Document)

### 5.1 `components/dev/DevTools.tsx`
- **Status:** ✅ Properly gated (only renders in development)
- **Usage:** Imported in `app/layout.tsx` (line 1, line 70)
- **Gating:** Line 22: `const isDev = process.env.NODE_ENV === 'development'`, Line 194: `if (!isDev) return null`
- **Action:** ✅ **KEEP** - Properly isolated, but consider:
  - Adding JSDoc comment at top of file: `@dev-only`
  - Documenting in `docs/` folder

### 5.2 `app/api/dev/*` routes
- **Status:** ✅ Properly gated (check `NODE_ENV === 'development'`)
- **Routes:**
  - `app/api/dev/seed/route.ts` - Line 15: Production check
  - `app/api/dev/tools/route.ts` - Line 13: Production check
  - `app/api/dev/auth-bypass/route.ts` - Line 10: Production check
- **Action:** ✅ **KEEP** - All properly gated. Consider adding route-level JSDoc comments.

### 5.3 `lib/dev-seed.ts`
- **Status:** Used by dev routes and test helpers
- **Usage:**
  - `app/api/dev/seed/route.ts`
  - `tests/helpers/seed.ts`
  - `scripts/seed-test-user.ts`
- **Action:** ✅ **KEEP** - Legitimate dev/test utility

---

## 6. Mock/Test Utilities

### 6.1 `app/api/mock/subscribe/route.ts`
- **Status:** Properly gated (requires `NEXT_PUBLIC_ENABLE_MOCK_CHECKOUT=true`)
- **Usage:** Used by `components/pricing/MockCheckout.tsx`
- **Action:** ✅ **KEEP** - Properly gated, useful for testing/staging

### 6.2 `components/pricing/MockCheckout.tsx` vs `PaddleCheckout.tsx`
- **Status:** Both are used, properly abstracted through `CheckoutButton.tsx`
- **Usage:**
  - `MockCheckout`: Used when `isMock={true}` prop passed
  - `PaddleCheckout`: Used for production checkout
  - Both used in: `app/(app)/profile/billing/page.tsx`, `app/(marketing)/pricing/page.tsx`, `components/onboarding/PrescriptiveOnboarding.tsx`
- **Action:** ✅ **KEEP** - Good abstraction pattern, no consolidation needed

---

## 7. Legacy Routing Code (Keep - Active)

### 7.1 `lib/content-mapping.ts`
- **Status:** ✅ **KEEP** - Actively used for legacy URL redirects
- **Usage:** 
  - `proxy.ts` (lines 4, 23-52): Uses `getRedirectUrlForLegacyContent` and `getCurriculumPathForLegacyContent`
  - Provides mapping for old article/content/case-study routes to new curriculum structure
- **Action:** ✅ **KEEP** - Necessary for backward compatibility and SEO

### 7.2 Legacy fallback code in components
- **Status:** ✅ **KEEP** - Necessary for data migration/compatibility
- **Examples:**
  - `components/case-study/CaseStudyWorkspace.tsx` (line 255): "Load existing state from simulation (check both new and legacy paths)"
  - `components/case-study/UniversalAssetViewer.tsx` (line 141): "Legacy: datasets as object with keys"
- **Action:** ✅ **KEEP** - These handle data shape migrations and are necessary

---

## 8. Marketing Components (Keep - Active)

### 8.1 `components/marketing/ledger-hero.tsx` and `ledger-archive.tsx`
- **Status:** ✅ **KEEP** - Actively used
- **Usage:** Both imported in `app/(marketing)/ledger/page.tsx`
- **Action:** ✅ **KEEP** - No consolidation needed (specific to ledger feature)

---

## Summary of Recommended Actions

### Immediate Deletions (Low Risk)
1. ✅ Delete `scripts/generate-lesson.ts`
2. ✅ Delete `scripts/assemble-case.ts`
3. ✅ Delete `scripts/generate-case.ts`
4. ✅ Delete `scripts/generate-case-asset.ts`
5. ✅ Delete `scripts/generate-case-from-blueprint.ts`
6. ✅ Remove `repairContent` function from `scripts/generate-shared.ts` (lines 632-645)
7. ✅ Delete empty directory `app/api/sync-local-file/`
8. ✅ Delete empty directory `components/community/`

### Consolidations (Medium Risk - Requires Testing)
9. ⚠️ Delete `components/simulation/CaseFileViewer.tsx`, update `SimulationWorkspace.tsx` to use `@/components/case-study/CaseFileViewer`
10. ⚠️ Delete `components/simulation/StructuredCaseDisplay.tsx` (will be automatically consolidated after #9)
11. ⚠️ Investigate `components/simulation/SimulationWorkspace.tsx` usage - if unused, remove; if used, consider migration path

### Requires Investigation
12. ⚠️ `components/library/CaseStudyViewer.tsx` - Verify if intentionally unused or should be integrated

### Documentation Improvements (Low Priority)
13. 📝 Add `@dev-only` JSDoc to `components/dev/DevTools.tsx`
14. 📝 Add route-level JSDoc comments to `app/api/dev/*` routes
15. 📝 Document dev tooling in `docs/` folder

---

## Risk Assessment

### Low Risk (Safe to Delete)
- Deprecated scripts (already throw errors)
- Empty directories
- Identical duplicate components (after verifying imports)

### Medium Risk (Requires Testing)
- Consolidating similar components (`SimulationWorkspace` vs `CaseStudyWorkspace`)
- Removing unused components (may be planned features)

### High Risk (Do Not Delete)
- Legacy routing code (`lib/content-mapping.ts`, `proxy.ts`)
- Legacy data shape fallbacks in components
- Dev tooling (properly gated, keep for development)

---

## Implementation Order

1. **Phase 1: Safe Deletions** (Low Risk)
   - Delete deprecated scripts (#1-6)
   - Delete empty directories (#7-8)
   - Run tests to verify no breakage

2. **Phase 2: Component Consolidation** (Medium Risk)
   - Consolidate duplicate `CaseFileViewer` and `StructuredCaseDisplay` (#9-10)
   - Test case study and simulation flows
   - Investigate `SimulationWorkspace` usage (#11)

3. **Phase 3: Investigation** (Requires Team Input)
   - Verify `CaseStudyViewer` status (#12)
   - Make decision on removal or integration

4. **Phase 4: Documentation** (Low Priority)
   - Add dev-only markers (#13-15)

---

## Notes

- All deprecated scripts already throw errors, so removing them is safe
- Duplicate components are identical except for import paths - consolidation is straightforward
- Legacy routing code should be kept as it's actively used for URL redirects
- Dev tooling is properly gated and should remain for development workflows
- Mock checkout is properly abstracted and useful for testing

