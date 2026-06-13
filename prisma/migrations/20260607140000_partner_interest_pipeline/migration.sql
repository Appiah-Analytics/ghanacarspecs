-- CreateEnum
CREATE TYPE "PartnerInterestStatus" AS ENUM (
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'NOT_A_FIT',
  'DEFERRED'
);

-- AlterTable
ALTER TABLE "partner_interests"
ADD COLUMN "status" "PartnerInterestStatus" NOT NULL DEFAULT 'NEW',
ADD COLUMN "internalNotes" TEXT,
ADD COLUMN "lastContactedAt" TIMESTAMP(3),
ADD COLUMN "nextFollowUpAt" TIMESTAMP(3),
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "partner_interests_status_idx" ON "partner_interests"("status");
