-- AlterEnum
ALTER TYPE "AccountDeletionStatus" ADD VALUE 'CANCELLED';

-- AlterTable
ALTER TABLE "account_deletion_requests" ADD COLUMN     "cancelled_at" TIMESTAMP(3),
ADD COLUMN     "restored_by" TEXT;
