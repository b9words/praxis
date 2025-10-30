# Praxis Platform MVP

The proving ground for the next generation of ambitious leaders. A full-stack application combining interactive business simulations, AI-powered coaching, and a private learning community.

## Tech Stack

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS, Shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **AI**: Google Gemini API
- **Charts**: Recharts
- **Deployment**: Vercel (frontend), Local Supabase (development)

## Features

### Core Features (100% Complete)
- ✅ User authentication with Supabase Auth
- ✅ Dynamic Praxis Profile with radar chart visualization
- ✅ **Profile editing with public/private toggle**
- ✅ Competency Library with Smart Study Assistant (AI Q&A)
- ✅ Interactive Case Simulations with two-panel workspace
- ✅ **AI Role-Play Engine for stakeholder negotiations**
- ✅ AI-powered Performance Debriefing
- ✅ **Community Forum with full thread/post creation**
- ✅ **Complete Admin Content Management (kanban board + editor)**
- ✅ Public/Private user profiles with full editing

### Sample Content
- 3 Complete Articles:
  - Framework: ROI & CAC
  - Framework: The Innovator's Dilemma
  - Framework: OPEX vs. CAPEX
- 3 Business Case Simulations:
  - The Growth Engine Challenge
  - The Innovation & Disruption Challenge
  - The Operational Efficiency Challenge

## Getting Started

### Prerequisites

- Node.js 18+
- Docker (for local Supabase)
- Supabase CLI
- Google Gemini API key

### Installation

1. **Clone and install dependencies:**
```bash
cd praxis-platform
npm install
```

2. **Start local Supabase:**
```bash
supabase start
```

This will:
- Run all database migrations
- Seed the database with sample content (3 articles, 3 cases, 5 competencies, 4 forum channels)
- Start Supabase Studio at `http://127.0.0.1:54333`

3. **Configure environment variables:**

The `.env.local` file has been created with local Supabase credentials. Add your Gemini API key:

```env
GEMINI_API_KEY=your-actual-gemini-api-key
```

4. **Start the development server:**
```bash
npm run dev
```

The application will be available at `http://localhost:3400`

## Local Supabase Configuration

This project uses custom ports to avoid conflicts:
- API: `54331`
- Database: `54332`
- Studio: `54333`
- Inbucket (email testing): `54334`

Access Supabase Studio: `http://127.0.0.1:54333`

## Project Structure

```
praxis-platform/
├── app/
│   ├── (auth)/              # Authentication pages
│   │   ├── login/
│   │   ├── signup/
│   │   └── callback/
│   ├── (app)/               # Main application (protected)
│   │   ├── dashboard/
│   │   ├── library/         # Competency Library
│   │   ├── simulations/     # Case Simulations
│   │   ├── debrief/         # Performance Debriefs
│   │   ├── community/       # Forum
│   │   ├── profile/         # User Profiles
│   │   └── admin/           # Admin Panel
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                  # Shadcn/ui components
│   ├── layout/              # Navigation, layouts
│   ├── profile/             # Profile & radar chart
│   ├── simulation/          # Simulation workspace
│   ├── library/             # Study assistant
│   └── admin/               # Admin components
├── lib/
│   └── supabase/            # Supabase clients
├── types/
│   └── database.types.ts    # TypeScript types
├── supabase/
│   ├── migrations/          # Database migrations
│   ├── functions/           # Edge Functions
│   │   ├── ask-study-assistant/
│   │   └── generate-debrief/
│   ├── seed.sql             # Sample content
│   └── config.toml          # Supabase configuration
└── middleware.ts            # Auth middleware
```

## Database Schema

### Core Tables
- `profiles` - User profiles with roles
- `competencies` - Hierarchical competency framework
- `articles` - Competency library articles
- `cases` - Business case simulations
- `simulations` - User simulation attempts
- `debriefs` - AI Coach feedback
- `forum_channels`, `forum_threads`, `forum_posts` - Community forum

### Key Features
- Row-Level Security (RLS) enabled on all tables
- Role-based access control (member, editor, admin)
- Automatic profile creation on signup
- Database functions for aggregate scores and recommendations

## AI Integration

### Edge Functions

#### `/functions/v1/ask-study-assistant`
- Powers the Smart Study Assistant in the Competency Library
- Answers user questions based strictly on article content
- Uses Gemini API with constrained prompts

#### `/functions/v1/generate-debrief`
- Generates performance debriefs after simulation completion
- Evaluates user inputs against static rubrics
- Returns structured JSON with scores and feedback

## Usage

### For Users

1. **Sign Up**: Create an account at `/signup`
2. **Explore Library**: Read foundational articles with AI assistance
3. **Start Simulation**: Choose a case and work through decisions
4. **Get Debrief**: Receive AI-powered performance feedback
5. **Build Profile**: Complete simulations to build your radar chart
6. **Join Community**: Discuss with other members in the forum

### For Admins

Access the admin panel at `/admin` to:
- View platform statistics
- Manage content (articles and cases)
- Monitor user activity

## Development

### Running Tests
```bash
npm run test
```

### Type Checking
```bash
npm run type-check
```

### Database Management

View database:
```bash
supabase db diff
```

Reset database:
```bash
supabase db reset
```

Generate TypeScript types:
```bash
supabase gen types typescript --local > types/database.types.ts
```

## Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Add environment variables from `.env.local`
3. Deploy

### Backend (Supabase Cloud)
1. Create a Supabase project
2. Link local project: `supabase link --project-ref your-project-ref`
3. Push migrations: `supabase db push`
4. Deploy Edge Functions: `supabase functions deploy ask-study-assistant` and `supabase functions deploy generate-debrief`
5. Update `.env.local` with production Supabase URL and keys

## License

Proprietary - Praxis Platform

## Support

For issues or questions, contact the development team.
