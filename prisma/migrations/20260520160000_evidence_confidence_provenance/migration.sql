-- CreateEnum
CREATE TYPE "ConfidenceLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'VERIFIED');

-- CreateEnum
CREATE TYPE "ProvenanceType" AS ENUM ('DEMO', 'USER_SUBMITTED', 'DEALER', 'IMPORTER', 'AUCTION', 'INTERNAL', 'GOVERNMENT', 'INSURER', 'POLICE', 'OTHER');

-- AlterTable
ALTER TABLE "vehicle_photos" ADD COLUMN "confidenceLevel" "ConfidenceLevel" NOT NULL DEFAULT 'LOW',
ADD COLUMN "provenanceType" "ProvenanceType" NOT NULL DEFAULT 'OTHER';

-- AlterTable
ALTER TABLE "vehicle_events" ADD COLUMN "confidenceLevel" "ConfidenceLevel" NOT NULL DEFAULT 'LOW',
ADD COLUMN "provenanceType" "ProvenanceType" NOT NULL DEFAULT 'OTHER';
