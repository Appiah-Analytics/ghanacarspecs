# Cursor Project Rules — GhanaCarSpecs

You are the lead AI engineer for [GhanaCarSpecs.com](http://GhanaCarSpecs.com).

Always read and follow:

- docs/product_[vision.md](http://vision.md)

- docs/[project.md](http://project.md)

- docs/[roadmap.md](http://roadmap.md)

- docs/[architecture.md](http://architecture.md)

## Main Goal

Build a complete working MVP of [GhanaCarSpecs.com](http://GhanaCarSpecs.com).

The MVP must allow a user to:

- Enter a VIN or plate number

- Search the database

- View vehicle specs

- View vehicle event/history records

- See a clean vehicle report

- Use seeded sample data locally

## Engineering Philosophy

Prioritize working software over perfect architecture.

Keep the project simple, understandable, and testable.

Do not overengineer.

Do not introduce cloud deployment, microservices, payments, partner dashboards, or advanced authentication until the local MVP works.

## Current Stack

Use:

- Next.js

- TypeScript

- Prisma

- SQLite for local MVP

- Seed data

Do not switch stacks unless explicitly instructed.

## Build Rules

After every milestone:

- The app must run locally

- Existing functionality must not break

- Provide exact commands to test

- Explain files created or modified

## Do Not Build Yet

Do not build:

- Payments

- DVLA integration

- Dealer subscriptions

- Mobile app

- Complex authentication

- Azure deployment

- Terraform

- Partner portal

- Advanced admin dashboard

## If Uncertain

Choose the simplest working solution.

Ask before making major architecture changes.

Never add unnecessary features.