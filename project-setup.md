# Node.js TypeScript Project Setup Guide with pnpm

> **Complete setup guide for creating a modern Node.js TypeScript project using pnpm package manager with current best practices for 2025.**

## Prerequisites

Before starting, ensure you have the following installed:

- **Node.js** (v18.17+ or v20+) - [Download from nodejs.org](https://nodejs.org/)
- **pnpm** - Install globally with: `npm install -g pnpm`
- **Git** (optional but recommended)

Check your installations:

```bash
node -v
pnpm -v
git --version
```

## Project Initialization

### 1. Create Project Directory and Initialize

```bash
# Initialize pnpm project
pnpm init
```

### 2. Configure Package.json for ESM

Edit the generated `package.json` to add the following essential fields:

```json
{
  "name": "my-typescript-project",
  "version": "1.0.0",
  "description": "A modern Node.js TypeScript project",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx --watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "clean": "rm -rf dist",
    "type-check": "tsc --noEmit",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix",
    "format": "prettier --write src/**/*.ts",
    "test": "vitest",
    "test:run": "vitest run"
  },
  "keywords": [],
  "author": "Your Name <your.email@example.com>",
  "license": "MIT"
}
```

## Dependencies Installation

### 3. Install TypeScript and Core Dependencies

```bash
# Install TypeScript and essential dev dependencies
pnpm add -D typescript @types/node tsx

# Install dotenv for environment variables
pnpm add dotenv

# Install additional dev tools
pnpm add -D @types/dotenv
```

### 4. Install Development Tools (Recommended)

```bash
# ESLint for code linting
pnpm add -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin @eslint/js

# Prettier for code formatting
pnpm add -D prettier

# Vitest for testing (modern alternative to Jest)
pnpm add -D vitest

# Nodemon alternative that works well with TypeScript
pnpm add -D nodemon
```

## TypeScript Configuration

### 5. Create tsconfig.json

Create a `tsconfig.json` file with modern 2025 best practices:

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    // Language and Environment
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "Node",

    // Strict Type Checking
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noImplicitOverride": true,
    "noUncheckedIndexedAccess": true,

    // Module Resolution
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,

    // Emit Options
    "outDir": "./dist",
    "rootDir": "./src",
    "removeComments": true,
    "sourceMap": true,
    "declaration": true,
    "declarationMap": true,

    // Performance and Optimization
    "skipLibCheck": true,
    "incremental": true,
    "tsBuildInfoFile": "./dist/.tsbuildinfo",

    // Advanced Options
    "allowImportingTsExtensions": false,
    "verbatimModuleSyntax": false,
    "types": ["node"]
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

### 6. Create TypeScript Config for Testing (Optional)

Create `tsconfig.test.json` for test files:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": true,
    "types": ["node", "vitest/globals"]
  },
  "include": ["src/**/*.ts", "src/**/*.test.ts", "src/**/*.spec.ts"]
}
```

## Project Structure

### 7. Create Project Structure

```bash
# Create source directory structure
mkdir -p src/{controllers,services,models,utils,types}
mkdir -p src/__tests__

# Create configuration and documentation directories
mkdir -p config docs

# Create entry point
touch src/index.ts

# Create environment file
touch .env
```

### 8. Set Up Entry Point

Create `src/index.ts`:

```typescript
import "dotenv/config";

interface AppConfig {
  port: number;
  environment: string;
}

const config: AppConfig = {
  port: parseInt(process.env.PORT || "3000", 10),
  environment: process.env.NODE_ENV || "development",
};

async function main(): Promise<void> {
  console.log("🚀 Starting application...");
  console.log(`📡 Environment: ${config.environment}`);
  console.log(`🌐 Port: ${config.port}`);

  // Your application logic here
  console.log("✅ Application started successfully!");
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("👋 Received SIGINT. Shutting down gracefully...");
  process.exit(0);
});

// Start the application
main().catch((error) => {
  console.error("❌ Failed to start application:", error);
  process.exit(1);
});
```

## Configuration Files

### 9. Create .env File

Create `.env` with basic environment variables:

```env
# Application Configuration
NODE_ENV=development
PORT=3000

# Database Configuration (example)
# DATABASE_URL=postgresql://username:password@localhost:5432/mydb

# API Keys (example)
# API_KEY=your-api-key-here

# Logging
LOG_LEVEL=info
```

### 10. Create .env.example

Create `.env.example` as a template:

```env
# Application Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
# DATABASE_URL=postgresql://username:password@localhost:5432/mydb

# API Keys
# API_KEY=your-api-key-here

# Logging
LOG_LEVEL=info
```

## Code Quality Tools

### 11. Configure ESLint

Create `eslint.config.js`:

```javascript
import js from "@eslint/js";
import typescript from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";

export default [
  js.configs.recommended,
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: "./tsconfig.json",
      },
    },
    plugins: {
      "@typescript-eslint": typescript,
    },
    rules: {
      ...typescript.configs.recommended.rules,
      ...typescript.configs["recommended-requiring-type-checking"].rules,
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/explicit-function-return-type": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "prefer-const": "off",
    },
  },
  {
    ignores: ["dist", "node_modules", "*.js"],
  },
];
```

### 12. Configure Prettier

Create `.prettierrc`:

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": false,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "endOfLine": "lf"
}
```

Create `.prettierignore`:

```
node_modules
dist
*.log
.env
```

### 13. Configure Vitest (Testing)

Create `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.{test,spec}.{js,ts}"],
    exclude: ["node_modules", "dist"],
  },
});
```

## Git Configuration

### 14. Create .gitignore

```gitignore
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
.pnpm-debug.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov
.nyc_output

# Compiled output
dist/
build/
*.tsbuildinfo

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDEs and editors
.vscode/
.idea/
*.swp
*.swo
*~

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Logs
logs
*.log

# Runtime data
*.pid
*.seed
*.pid.lock

# Temporary folders
tmp/
temp/
```

## Development Workflow

### 15. Additional Useful Scripts

Add these additional scripts to your `package.json`:

```json
{
  "scripts": {
    "dev": "tsx --watch src/index.ts",
    "dev:debug": "tsx --inspect --watch src/index.ts",
    "build": "tsc",
    "build:clean": "pnpm clean && pnpm build",
    "start": "node dist/index.js",
    "start:prod": "NODE_ENV=production node dist/index.js",
    "clean": "rm -rf dist",
    "type-check": "tsc --noEmit",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix",
    "format": "prettier --write src/**/*.ts",
    "format:check": "prettier --check src/**/*.ts",
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "check-all": "pnpm type-check && pnpm lint && pnpm format:check && pnpm test:run"
  }
}
```

## Quick Start Commands

### 16. Running Your Project

```bash
# Development mode with hot reload
pnpm dev

# Type checking
pnpm type-check

# Build for production
pnpm build

# Start production build
pnpm start

# Run tests
pnpm test

# Run all checks
pnpm check-all
```

## Modern Features & Best Practices

### 17. Path Mapping (Optional)

For cleaner imports, you can add path mapping to `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": "./src",
    "paths": {
      "@/*": ["./*"],
      "@/types/*": ["./types/*"],
      "@/utils/*": ["./utils/*"],
      "@/services/*": ["./services/*"]
    }
  }
}
```

Then install and configure:

```bash
pnpm add -D tsconfig-paths
```

Update your scripts to use `tsx` with path mapping:

```json
{
  "scripts": {
    "dev": "tsx --watch -r tsconfig-paths/register src/index.ts"
  }
}
```

### 18. Package.json Optimization

Final optimized `package.json`:

```json
{
  "name": "my-typescript-project",
  "version": "1.0.0",
  "description": "A modern Node.js TypeScript project",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": ["dist"],
  "engines": {
    "node": ">=18.17.0",
    "pnpm": ">=8.0.0"
  },
  "packageManager": "pnpm@9.0.0",
  "scripts": {
    "dev": "tsx --watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "clean": "rm -rf dist",
    "type-check": "tsc --noEmit",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix",
    "format": "prettier --write src/**/*.ts",
    "test": "vitest",
    "check-all": "pnpm type-check && pnpm lint && pnpm format:check && pnpm test:run"
  },
  "keywords": ["typescript", "node", "pnpm"],
  "author": "Your Name <your.email@example.com>",
  "license": "MIT",
  "dependencies": {
    "dotenv": "^17.2.1"
  },
  "devDependencies": {
    "@eslint/js": "^9.0.0",
    "@types/node": "^24.2.1",
    "@typescript-eslint/eslint-plugin": "^8.39.1",
    "@typescript-eslint/parser": "^8.39.1",
    "eslint": "^9.33.0",
    "prettier": "^3.6.2",
    "tsx": "^4.20.4",
    "typescript": "^5.9.2",
    "vitest": "^3.2.4"
  }
}
```

## Final Project Structure

Your completed project structure should look like this:

```
/
├── .env
├── .env.example
├── eslint.config.js
├── .gitignore
├── .prettierrc
├── .prettierignore
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── vitest.config.ts
├── README.md
├── src/
│   ├── index.ts
│   ├── types/
│   ├── utils/
│   ├── services/
│   ├── controllers/
│   ├── models/
│   └── __tests__/
├── config/
├── docs/
└── dist/ (generated after build)
```
