-- AlterTable
ALTER TABLE "Chat" ADD COLUMN     "deletedFor" JSONB DEFAULT '[]';

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "deletedFor" JSONB DEFAULT '[]';
