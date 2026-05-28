-- SQLite reference migration for local environments using `schema.prisma`.
-- Local workflow remains `npm run db:push`; this script is a parity reference.

ALTER TABLE "vehicle_photos" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'PUBLISHED';
ALTER TABLE "vehicle_photos" ADD COLUMN "deletedAt" DATETIME;
ALTER TABLE "vehicle_photos" ADD COLUMN "deletedBy" TEXT;

ALTER TABLE "vehicle_events" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'PUBLISHED';
ALTER TABLE "vehicle_events" ADD COLUMN "deletedAt" DATETIME;
ALTER TABLE "vehicle_events" ADD COLUMN "deletedBy" TEXT;
