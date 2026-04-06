-- AlterTable
ALTER TABLE "User" ADD COLUMN     "searchByPhone" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showPhoneTo" TEXT NOT NULL DEFAULT 'everyone';
