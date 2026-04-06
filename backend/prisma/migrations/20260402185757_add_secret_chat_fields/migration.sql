-- AlterTable
ALTER TABLE "Chat" ADD COLUMN     "isSecret" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "selfDestructTimer" INTEGER DEFAULT 0;
