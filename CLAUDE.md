# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tubely is a TypeScript-based video sharing application that demonstrates file storage and CDN concepts using S3 and CloudFront. It's built with Bun as the runtime and uses SQLite for data persistence.

## Development Commands

```bash
# Run the server (main development command)
bun run src/index.ts

# Download sample assets for testing
./samplesdownload.sh

# Run tests
bun test

# Run tests in watch mode
bun test --watch
```

## Architecture

### Core Structure
- **Entry point**: `src/index.ts` - Bun server with route definitions
- **Configuration**: `src/config.ts` - Environment-based config with type safety
- **Authentication**: `src/auth.ts` - JWT token management and bcrypt password hashing
- **Database**: `src/db/` - SQLite schemas and operations for users, videos, and refresh tokens
- **API routes**: `src/api/` - RESTful endpoints for all application functionality
- **Frontend**: `src/app/` - Single-page application served at root

### Database Layer
- SQLite database with separate modules for each entity:
  - `users.ts` - User management and authentication
  - `videos.ts` - Video metadata and file references
  - `refresh-tokens.ts` - JWT refresh token storage
- Database initialized and migrated in `db/db.ts`

### API Architecture
- Route handlers in `src/api/` follow pattern: `handler{Entity}{Action}`
- Middleware in `api/middleware.ts` provides config injection, caching, and error handling
- Error types defined in `api/errors.ts` for consistent error responses
- File uploads handled for both videos and thumbnails with local storage

### Environment Configuration
Required environment variables (see `.env.example`):
- Database path, JWT secret, platform mode
- File storage paths (assets root, filepath root)
- S3 configuration (bucket, region, CloudFront distribution)
- AWS credentials for S3 operations

### Key Dependencies
- **Bun**: Runtime and package manager
- **bcrypt**: Password hashing
- **jsonwebtoken**: JWT authentication
- **bun:sqlite**: Database operations
- **FFMPEG**: Required in PATH for video processing

### File Storage
- Local assets stored in `./assets/` directory
- S3 integration configured but implementation varies by course progress
- Static file serving for `/assets` requests handled in main server fetch function

### Testing
- Test framework: Bun's built-in testing (Jest-compatible)
- Configuration: `jest.config.js` for Jest Runner extension compatibility
- Test database: Separate SQLite instance (`tubely-test.db`) with automatic cleanup
- Coverage: 31 tests covering authentication, database operations, and API endpoints
- Key test areas:
  - Authentication functions (password hashing, JWT operations)
  - Database CRUD operations for users
  - Auth API endpoints (login, refresh, revoke)
- Note: File upload features (thumbnails, videos) not yet implemented, so no tests for those