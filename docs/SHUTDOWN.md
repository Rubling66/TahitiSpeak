# Shutdown Report

- Status: Project placed on hold. Maintenance mode integrated and enabled via environment flags.
- Environment flags:
  - MAINTENANCE_MODE=true (server)
  - NEXT_PUBLIC_MAINTENANCE_MODE=true (client)
- API endpoints:
  - Next.js middleware returns 503 for /api/* except /api/health
  - Express server returns 503 for all routes except /health
- Client calls:
  - DataService, SWR fetcher, and AuthService short-circuit with maintenance errors
- Background processing:
  - EmailQueueProcessor does not start and skips processing
  - EmailAutomation skips events and scheduled tasks
- Operational steps:
  - Stop dev servers: npm run dev, npm run dev:api
  - Ensure env flags set to true in deployment
- Reversal:
  - Set MAINTENANCE_MODE=false and NEXT_PUBLIC_MAINTENANCE_MODE=false to resume normal operations

