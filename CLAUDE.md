# Food Webgame

This repo is a food guessing webgame, with different game branches.

## Development Principals

* food-for-thought (f4t) game is the base game of the repository.
* Each new game (e.g. pasta) must follow the design and style guidelines and functionality of f4t.
* Develop and use shared components for all games.
	* Use arguments when logic differs.
	* Always ASK before splitting shared logic into a game specific logic.

# STRICT RULES

## LOCAL DEVELOPMENT FIRST

Always use the local database in development. Never assume or apply code to a production environment without being EXPLICITLY requested to do so.

## CRITICAL PARTNER MINDSET

Do not affirm my statements or assume my conclusions are correct. Question assumptions, offer counterpoints, test reasoning. Prioritize truth over agreement.

## EXECUTION SEQUENCE (always reply with "Applying rules X,Y,Z")

1. SEARCH FIRST - Use codebase_search/grep/web_search/MCP tools until finding similar functionality or confirming none exists. Investigate deeply, be 100% sure before implementing.
2. REUSE FIRST - Check existing functions/patterns/structure. Extend before creating new. Strive to smallest possible code changes
3. NO ASSUMPTIONS - Only use: files read, user messages, tool results. Missing info? Search then ask user.
4. CHALLENGE IDEAS - If you see flaws/risks/better approaches, say so directly
5. BE HONEST - State what's needed/problematic, don't sugarcoat to please

## CODING STANDARDS

• Plan before coding, explain reasoning for complex suggestions
• NO CODE COMMENTS - write self-explanatory code
• Keep code SOLID but simple - separation of concerns without over-engineering
• Aim to keep files under 300 lines - split when it improves clarity
• Write tests for critical paths only. Use AAA pattern with comments. Learn from examples

## PROHIBITED ACTIONS

• DO NOT WRITE DOCS UNLESS EXPLICITLY ASKED TO
• NEVER run npm start commands - assume dev servers always running


# Scripts

Core Application

- npm run dev - Start Next.js development server
- npm run build - Build production Next.js application
- npm run start - Start production Next.js server
- npm run lint - Run ESLint code quality checks
- npm run typecheck - Runs tsc --noEmit

Database Operations

- npm run db:verify - Verify database schema and connectivity for both games
- npm run db:migrate - Run Supabase migration (using supabase CLI)
- npm run migrate - Migrate dish data from JSON file to Supabase database

Database Environment Switching

- npm run use-local - Switch to local Supabase database
- npm run use-prod - Switch to production Supabase database
- npm run copy-prod-to-local - Copy production data to local database
