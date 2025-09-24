# Poutiri Indici Ingest Service

Headless S3→Postgres ingestion for Indici extracts (raw/stg/core with audits). A modern Node.js TypeScript project built with best practices for 2025.

## Features

- 🚀 **TypeScript 5.9+** with strict type checking
- 📦 **ESM modules** for modern JavaScript
- 🔧 **pnpm** for fast, efficient package management
- 🧪 **Vitest** for modern testing
- 📝 **ESLint** + **Prettier** for code quality
- ⚡ **tsx** for fast development with hot reload
- 🛡️ **Strict TypeScript** configuration

## Prerequisites

- Node.js 18.17+ or 20+
- pnpm 9.5.0+

## Quick Start

```bash
# Install dependencies
pnpm install

# Development mode with hot reload
pnpm dev

# Build for production
pnpm build

# Start production build
pnpm start

# Run tests
pnpm test

# Run all checks (type-check, lint, format, test)
pnpm check-all
```

## Available Scripts

- `pnpm dev` - Start development server with hot reload
- `pnpm dev:debug` - Start development server with debugging enabled
- `pnpm build` - Build TypeScript to JavaScript
- `pnpm build:clean` - Clean and build TypeScript to JavaScript
- `pnpm start` - Start production server
- `pnpm start:prod` - Start production server with NODE_ENV=production
- `pnpm clean` - Clean build directory
- `pnpm type-check` - Type check without building
- `pnpm lint` - Run ESLint
- `pnpm lint:fix` - Fix ESLint issues automatically
- `pnpm format` - Format code with Prettier
- `pnpm format:check` - Check code formatting without fixing
- `pnpm test` - Run tests in watch mode
- `pnpm test:run` - Run tests once
- `pnpm test:coverage` - Run tests with coverage report
- `pnpm check-all` - Run all quality checks

## Project Structure

```
/
├── src/
│   ├── index.ts          # Main entry point
│   ├── utils/            # Utility functions
│   └── __tests__/        # Test files
├── config/               # Configuration files
├── docs/                 # Documentation
└── dist/                 # Compiled output (generated)
```

## Environment Variables

Create a `.env` file in the project root with the following variables:

```env
NODE_ENV=development
PORT=3000
LOG_LEVEL=info
```

The project uses `dotenv` to load environment variables automatically.

## Development

This project uses modern TypeScript features and strict type checking. The configuration is optimized for:

- ES2022 target
- ESM modules
- Strict null checks
- No implicit any
- Source maps for debugging
- Declaration files for better IDE support

## Testing

Tests are written using Vitest and can be found in the `src/__tests__/` directory. Run tests with:

```bash
pnpm test        # Watch mode
pnpm test:run    # Single run
pnpm test:coverage # With coverage report
```

## Code Quality

- **ESLint**: TypeScript-aware linting with strict rules
- **Prettier**: Automatic code formatting
- **TypeScript**: Strict type checking and compilation

Run quality checks with:

```bash
pnpm check-all
```

## License

MIT
