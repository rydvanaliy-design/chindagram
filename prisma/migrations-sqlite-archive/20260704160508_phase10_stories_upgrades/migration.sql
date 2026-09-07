-- AlterTable
ALTER TABLE "Notification" ADD COLUMN "storyId" TEXT;

-- CreateTable
CREATE TABLE "Highlight" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "coverUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ownerId" TEXT NOT NULL,
    CONSTRAINT "Highlight_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StoryResponse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "optionIndex" INTEGER,
    "text" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "storyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "StoryResponse_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StoryResponse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "body" TEXT NOT NULL,
    "removed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "sharedPostId" TEXT,
    "storyReplyId" TEXT,
    "parentId" TEXT,
    "mediaUrl" TEXT,
    "mediaType" TEXT,
    CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Message_sharedPostId_fkey" FOREIGN KEY ("sharedPostId") REFERENCES "Post" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Message_storyReplyId_fkey" FOREIGN KEY ("storyReplyId") REFERENCES "Story" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Message_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Message" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Message" ("body", "conversationId", "createdAt", "id", "mediaType", "mediaUrl", "parentId", "removed", "senderId", "sharedPostId") SELECT "body", "conversationId", "createdAt", "id", "mediaType", "mediaUrl", "parentId", "removed", "senderId", "sharedPostId" FROM "Message";
DROP TABLE "Message";
ALTER TABLE "new_Message" RENAME TO "Message";
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");
CREATE TABLE "new_Story" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "imageUrl" TEXT,
    "type" TEXT NOT NULL DEFAULT 'IMAGE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "authorId" TEXT NOT NULL,
    "repostOfId" TEXT,
    "highlightId" TEXT,
    "closeFriendsOnly" BOOLEAN NOT NULL DEFAULT false,
    "clubId" TEXT,
    "stickerType" TEXT,
    "stickerQuestion" TEXT,
    "stickerOptions" TEXT,
    "stickerCorrectIndex" INTEGER,
    CONSTRAINT "Story_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Story_repostOfId_fkey" FOREIGN KEY ("repostOfId") REFERENCES "Post" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Story_highlightId_fkey" FOREIGN KEY ("highlightId") REFERENCES "Highlight" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Story_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Story" ("authorId", "createdAt", "expiresAt", "id", "imageUrl", "repostOfId", "type") SELECT "authorId", "createdAt", "expiresAt", "id", "imageUrl", "repostOfId", "type" FROM "Story";
DROP TABLE "Story";
ALTER TABLE "new_Story" RENAME TO "Story";
CREATE INDEX "Story_expiresAt_idx" ON "Story"("expiresAt");
CREATE INDEX "Story_authorId_idx" ON "Story"("authorId");
CREATE INDEX "Story_highlightId_idx" ON "Story"("highlightId");
CREATE INDEX "Story_clubId_idx" ON "Story"("clubId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Highlight_ownerId_idx" ON "Highlight"("ownerId");

-- CreateIndex
CREATE INDEX "StoryResponse_storyId_idx" ON "StoryResponse"("storyId");

-- CreateIndex
CREATE UNIQUE INDEX "StoryResponse_storyId_userId_key" ON "StoryResponse"("storyId", "userId");
