# Environment Variables

## Required Variables

- `GEMINI_API_KEY` - Google Gemini API key for AI content generation
- `OPENAI_API_KEY` - OpenAI API key (optional, for OpenAI-based generation)
- `DATABASE_URL` - PostgreSQL database connection string
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `NEXT_PUBLIC_APP_URL` - Public URL of the application (e.g., http://localhost:3400)

## Optional Variables

### GEMINI_MODEL

Override the default Gemini model used for content generation across the application.

**Default behavior if not set:**
- Case generation: `gemini-2.5-pro-latest`
- Lesson generation: Uses model from request (defaults to `gemini-2.5-flash`)
- Test analysis: `gemini-2.5-pro`
- Thumbnail generation (Dalle): `gemini-1.5-flash-latest`
- Thumbnail generation (Gemini): `gemini-2.0-flash-exp`
- Supabase functions (assistant, debrief, persona-chat): `gemini-1.5-flash`
- Supabase functions (thumbnail): `gemini-2.0-flash-exp`

**Usage:**
```bash
GEMINI_MODEL=gemini-2.5-pro-latest
```

**Valid model names:**
- `gemini-2.5-pro-latest`
- `gemini-2.5-pro`
- `gemini-1.5-pro`
- `gemini-2.0-flash-exp`
- `gemini-1.5-flash`
- `gemini-1.5-flash-latest`

**Note:** This variable is used in:
- Next.js API routes (`app/api/content-generation/*`)
- Node.js scripts (`scripts/*`)
- Supabase Edge Functions (`supabase/functions/*`)
- Thumbnail generation libraries (`lib/thumbnail-*.ts`)

## Sentry (Optional)

- `SENTRY_AUTH_TOKEN` - Sentry authentication token
- `SENTRY_ORG` - Sentry organization
- `SENTRY_PROJECT` - Sentry project name





