-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Post" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kind" TEXT NOT NULL DEFAULT 'PHOTO',
    "caption" TEXT,
    "linkUrl" TEXT,
    "category" TEXT NOT NULL DEFAULT 'NONE',
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "removed" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'VISIBLE',
    "flagReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "authorId" TEXT NOT NULL,
    CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Post" ("authorId", "caption", "createdAt", "flagReason", "id", "kind", "removed", "status") SELECT "authorId", "caption", "createdAt", "flagReason", "id", "kind", "removed", "status" FROM "Post";
DROP TABLE "Post";
ALTER TABLE "new_Post" RENAME TO "Post";
CREATE INDEX "Post_authorId_createdAt_idx" ON "Post"("authorId", "createdAt");
CREATE INDEX "Post_kind_createdAt_idx" ON "Post"("kind", "createdAt");
CREATE INDEX "Post_status_createdAt_idx" ON "Post"("status", "createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
