# Alumni Platform

Modern alumni networking platform built with Next.js and Supabase.

## Features

- User authentication with role-based access
- Admin user verification system  
- Alumni and recruiter portals
- Event management
- Responsive design with shadcn/ui

## Tech Stack

- **Frontend**: Next.js 15, React, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **UI Components**: shadcn/ui
- **Deployment**: Vercel

## Quick Start

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Run database migrations in Supabase
5. Start development server: `npm run dev`

## Database Setup

Run these SQL scripts in Supabase SQL Editor:

1. `database/fix-rls-policies.sql` - Fix Row Level Security policies
2. `database/migration-add-status-column.sql` - Add user verification status

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```
