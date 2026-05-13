# GhanaCarSpecs Project Guide

## Project Name

[GhanaCarSpecs.com](http://GhanaCarSpecs.com)

## Product Type

Vehicle history and vehicle specification lookup platform for Ghana.

## Current Objective

Build the first working local MVP.

## MVP Definition

The MVP is considered working when:

- A user can open the app locally

- A user can enter a VIN or plate number

- The system searches a local database

- The system returns vehicle specs

- The system returns event/history records

- The report displays clearly on the page

- Sample seeded vehicle data exists

- README includes setup and run instructions

## MVP Features

### Public User Features

- Homepage

- VIN/plate lookup form

- Vehicle report display

- “No record found” message

- Sample vehicle report from seed data

### Backend Features

- Lookup API endpoint

- Vehicle model

- VehicleEvent model

- Seed data

- Basic error handling

### Database

Use SQLite for local MVP.

Use Prisma ORM.

Core tables:

- Vehicle

- VehicleEvent

## Current Stack

- Next.js

- TypeScript

- Prisma

- SQLite

- Local-first development

## Development Principle

Build the smallest complete working version first.

The first goal is not perfection. The first goal is a working app.

## Not in Current Scope

The following are future features and must not be built now:

- Payments

- Paid reports

- Dealer dashboard

- Partner dashboard

- DVLA integration

- Insurance integration

- Bank integration

- Mobile app

- Azure deployment

- Terraform

- Complex authentication

- API billing

- Subscriptions

## Definition of Done for Phase 1

Phase 1 is done when:

- `npm install` works

- `npm run dev` works

- Prisma database setup works

- Seed data loads

- Lookup by VIN works

- Lookup by plate number works

- Vehicle report page displays specs and events

- README explains how to run and test the app