-- CreateEnum
CREATE TYPE "PartnerType" AS ENUM (
  'GARAGE',
  'DEALER',
  'IMPORTER',
  'FLEET_OPERATOR',
  'INSURER',
  'LENDER',
  'SERVICE_PROVIDER',
  'OTHER'
);

-- CreateTable
CREATE TABLE "partner_interests" (
    "id" TEXT NOT NULL,
    "partnerType" "PartnerType" NOT NULL,
    "businessName" TEXT NOT NULL,
    "contactPerson" TEXT NOT NULL,
    "whatsappNumber" TEXT NOT NULL,
    "email" TEXT,
    "city" TEXT NOT NULL,
    "monthlyVehicleVolume" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partner_interests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "partner_interests_createdAt_idx" ON "partner_interests"("createdAt");

-- CreateIndex
CREATE INDEX "partner_interests_partnerType_idx" ON "partner_interests"("partnerType");
