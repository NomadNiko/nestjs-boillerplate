# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
npm run start:dev          # Start with hot reload
npm run build             # Build for production
npm run start:prod        # Start production server
npm run lint              # Run ESLint
npm run format            # Format code with Prettier
```

### Testing
```bash
npm run test              # Run unit tests
npm run test:watch        # Run tests in watch mode
npm run test:cov          # Run tests with coverage
npm run test:e2e          # Run e2e tests
npm run test:e2e:relational:docker  # E2E tests for PostgreSQL in Docker
npm run test:e2e:document:docker    # E2E tests for MongoDB in Docker
```

### Database - PostgreSQL/TypeORM
```bash
npm run migration:generate -- src/database/migrations/MigrationName  # Generate migration from entities
npm run migration:run                                               # Run pending migrations
npm run migration:revert                                            # Revert last migration
npm run seed:run:relational                                         # Run seeds
npm run seed:create:relational -- --name EntityName                 # Create new seed
```

### Database - MongoDB/Mongoose
```bash
npm run seed:run:document                    # Run seeds
npm run seed:create:document -- --name EntityName  # Create new seed
```

### Code Generation
```bash
npm run generate:resource:relational -- --name ResourceName  # Generate CRUD for PostgreSQL
npm run generate:resource:document -- --name ResourceName    # Generate CRUD for MongoDB
npm run generate:resource:all-db -- --name ResourceName      # Generate CRUD for both DBs
npm run add:property:to-relational                          # Add property to PostgreSQL entity
npm run add:property:to-document                            # Add property to MongoDB schema
npm run add:property:to-all-db                              # Add property to both
```

## Architecture

This project follows **Hexagonal Architecture** (Ports and Adapters) with Domain-Driven Design principles:

### Module Structure Pattern
Each feature module follows this structure:
```
module/
├── domain/           # Business entities (pure TypeScript classes)
├── dto/             # Data Transfer Objects with validation
├── infrastructure/  # External adapters
│   └── persistence/
│       ├── document/    # MongoDB implementation
│       │   ├── entities/      # Mongoose schemas
│       │   ├── mappers/       # Domain <-> Entity mappers
│       │   └── repositories/  # MongoDB repository implementation
│       ├── relational/  # PostgreSQL implementation
│       │   ├── entities/      # TypeORM entities
│       │   ├── mappers/       # Domain <-> Entity mappers
│       │   └── repositories/  # PostgreSQL repository implementation
│       └── repository.ts # Abstract repository interface (port)
├── services/        # Business logic services (often split into CRUD operations)
├── controller.ts    # HTTP endpoints with Swagger decorators
├── module.ts        # NestJS module configuration
└── service.ts       # Main service orchestrator
```

### Key Architectural Decisions

1. **Dual Database Support**: The application can work with either PostgreSQL (TypeORM) or MongoDB (Mongoose), determined by `DATABASE_TYPE` environment variable. The repository pattern ensures business logic remains database-agnostic.

2. **Service Decomposition**: Large services are split into focused CRUD services (e.g., `UserCreateService`, `UserReadService`, etc.) for better maintainability.

3. **Authentication Architecture**:
   - JWT tokens with refresh token flow
   - Session management in database for multi-device support
   - Multiple auth strategies: email/password, Apple, Facebook, Google
   - Role-based access control (Admin, User)

4. **File Upload Strategy**: Supports multiple storage backends (local, S3, S3-presigned) with a unified interface through the strategy pattern.

5. **Configuration Management**: Typed configuration with validation using `@nestjs/config` with separate config files for each module.

### Database Abstraction
The repository pattern is used to abstract database operations:
- Abstract `Repository` interface defines the contract
- `RelationalRepository` implements for TypeORM
- `DocumentRepository` implements for Mongoose
- Services depend only on the abstract interface

### Authentication Flow
1. User authenticates via email or social provider
2. JWT access token (15min) and refresh token (10 years) are generated
3. Session is stored in database with device info
4. Refresh token is used to get new access token when expired
5. Sessions can be managed (view all devices, logout specific device)

### Code Generation with Hygen
The project uses Hygen templates to generate boilerplate code. Templates follow the hexagonal architecture pattern and create all necessary files including domain entities, DTOs, repositories, services, and controllers.