# Content Generation Guide

## Quick Start

```bash
# Generate next lesson
npx tsx scripts/generate-lesson.ts

# Generate next case study  
npx tsx scripts/generate-case.ts

# Publish when ready
npx tsx scripts/publish-content.ts --type article --path articles/year1/domain/module/lesson.md
```

## Setup

1. **Environment variables** (`.env.local`):
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY` or `OPENAI_API_KEY`
   - `NEXT_PUBLIC_SITE_URL`

2. **Create storage bucket** (first time only):
   ```bash
   npx tsx scripts/create-storage-bucket.ts
   ```

## Commands

### Generate Lesson
```bash
# Next missing lesson
npx tsx scripts/generate-lesson.ts

# Specific lesson
npx tsx scripts/generate-lesson.ts --domain capital-allocation --module ceo-as-investor --lesson five-choices

# Options: --test (shorter), --dry-run (preview), --max-repairs 3
```

### Generate Case
```bash
# Next missing case (requires article to exist)
npx tsx scripts/generate-case.ts

# Specific case
npx tsx scripts/generate-case.ts --domain capital-allocation --module ceo-as-investor --lesson five-choices
```

### Publish
```bash
# By storage path
npx tsx scripts/publish-content.ts --type article --path articles/year1/domain/module/lesson.md
npx tsx scripts/publish-content.ts --type case --path cases/year1/domain/module/lesson.json

# By database ID
npx tsx scripts/publish-content.ts --type article --id <article-id>
```

## Workflow

1. **Generate** → Content uploaded to Storage as `draft`
2. **Review** → Visit `/admin/content` to see and edit
3. **Publish** → Run publish command when ready

## Quality Standards

- **Articles:** 1,800-2,400 words, 2+ tables, all 7 sections
- **Cases:** 3+ stages, 3+ case files, valid JSON structure

Script auto-validates and attempts repair if standards aren't met.

## Review Links

After generation, the script outputs:
- Content Management: `/admin/content`
- Direct Edit: `/admin/edit?path=...&type=article`
