-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "fileName" TEXT,
ADD COLUMN     "fileSize" INTEGER,
ADD COLUMN     "isHD" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mimeType" TEXT;
