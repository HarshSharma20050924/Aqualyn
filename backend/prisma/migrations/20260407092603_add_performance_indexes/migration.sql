-- AlterTable
ALTER TABLE "Chat" ADD COLUMN     "isTempGroup" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "originalChatId" TEXT;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "audioUrl" TEXT,
ADD COLUMN     "contact" JSONB,
ADD COLUMN     "document" JSONB,
ADD COLUMN     "isEdited" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "location" JSONB,
ADD COLUMN     "payment" JSONB,
ADD COLUMN     "replyToId" TEXT,
ADD COLUMN     "schedule" JSONB,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'sent',
ADD COLUMN     "wallet" JSONB;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "invitationSettings" TEXT NOT NULL DEFAULT 'everyone';

-- CreateIndex
CREATE INDEX "Message_chatId_createdAt_idx" ON "Message"("chatId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_senderId_createdAt_idx" ON "Message"("senderId", "createdAt");
