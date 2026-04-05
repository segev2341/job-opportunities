# Job Hunt Intelligence

A one-click job intelligence engine for business roles in cybersecurity, defence tech, and security companies in Israel.

Click **"Run Job Hunt"** and the system automatically discovers, scores, ranks, and recommends action for every opportunity.

## Quick Start

```bash
npm install
npm run setup
npm run dev
```

Open **http://localhost:3000** and click **"Run Job Hunt"**.

## What Happens When You Click "Run Job Hunt"

The system runs a 10-step pipeline automatically:

1. **Query Expansion** - Generates 30+ search queries from your profile
2. **Job Fetch** - Fetches jobs from providers (mock data in MVP)
3. **Ingestion** - Stores raw job data
4. **Canonicalization** - Deduplicates and detects reposts
5. **Company Enrichment** - Adds company intel (sector, size, hiring signals)
6. **Network Discovery** - Finds your connections at each company
7. **Job Scoring** - Scores every job (role fit, sector, seniority, location, network, company)
8. **Warm Path Generation** - Identifies best people to reach out to
9. **Outreach Drafts** - Generates ready-to-send messages
10. **Final Ranking** - Ranks jobs and recommends next action

## For Each Job, The System Answers

- **Is this worth my time?** (score + explanation)
- **Who can help me?** (connections ranked by closeness)
- **What should I do first?** (concrete next action)

## Recommended Actions

| Action | When |
|--------|------|
| Apply Now | High score, strong fit |
| Ask for Referral | High score + 1st-degree connection |
| Request Intro | Good score + 2nd-degree connection |
| Message Recruiter | Good score, no connections |
| Low Priority | Lower score |

## Connection Priority

| Priority | Source |
|----------|--------|
| 1st | IAF connections (direct) |
| 2nd | IAF Special Forces (via mutual) |
| 3rd | Tel Aviv University alumni |
| 4th | Other 1st-degree connections |
| 5th | Other 2nd-degree connections |

## Pages

- **Dashboard** - Run job hunt + see ranked results
- **Jobs** - Browse all discovered jobs
- **Job Detail** - Full description, score breakdown, outreach messages
- **Applications** - Track application status
- **Follow-ups** - Manage follow-up tasks
- **Run History** - View past hunt runs

## Tech Stack

- Next.js 15 + TypeScript
- Tailwind CSS v4
- Prisma + SQLite (zero config)
- Mock data providers (ready for real API integration)

## Architecture

```
src/
  app/              # Next.js pages + API routes
  components/       # Reusable UI components
  lib/
    adapters/       # Data providers (mock → real)
    services/       # Business logic
    db.ts           # Prisma client
    types.ts        # Shared types
prisma/
  schema.prisma     # Database schema
  seed.ts           # Initial data
```

## V2 Roadmap

- Real LinkedIn Jobs API integration
- Real company data (Crunchbase, LinkedIn)
- Real network data (LinkedIn connections)
- AI-powered scoring and outreach generation
- Email notifications for new matches
- Calendar integration for follow-ups
- PostgreSQL + Redis for production scale
