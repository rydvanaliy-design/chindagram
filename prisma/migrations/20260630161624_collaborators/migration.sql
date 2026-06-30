-- CreateTable
CREATE TABLE "PostCollaborator" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accepted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "PostCollaborator_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PostCollaborator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "PostCollaborator_userId_accepted_idx" ON "PostCollaborator"("userId", "accepted");

-- CreateIndex
CREATE UNIQUE INDEX "PostCollaborator_postId_userId_key" ON "PostCollaborator"("postId", "userId");
