-- CreateEnum
CREATE TYPE "EvidenceStatus" AS ENUM ('DRAFT', 'REVIEWED', 'PUBLISHED', 'REJECTED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "vehicle_photos"
ADD COLUMN "status" "EvidenceStatus" NOT NULL DEFAULT 'PUBLISHED',
ADD COLUMN "deletedAt" TIMESTAMP(3),
ADD COLUMN "deletedBy" TEXT;

-- AlterTable
ALTER TABLE "vehicle_events"
ADD COLUMN "status" "EvidenceStatus" NOT NULL DEFAULT 'PUBLISHED',
ADD COLUMN "deletedAt" TIMESTAMP(3),
ADD COLUMN "deletedBy" TEXT;
