-- AlterTable
ALTER TABLE "PostMedia" ADD COLUMN "alt" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "username" TEXT,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "bio" TEXT,
    "image" TEXT,
    "pronouns" TEXT,
    "interests" TEXT,
    "links" TEXT,
    "theme" TEXT NOT NULL DEFAULT 'default',
    "locale" TEXT NOT NULL DEFAULT 'th',
    "role" TEXT NOT NULL DEFAULT 'STUDENT',
    "gradeClass" TEXT,
    "private" BOOLEAN NOT NULL DEFAULT true,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("bio", "createdAt", "disabled", "email", "gradeClass", "id", "image", "interests", "links", "name", "passwordHash", "private", "pronouns", "role", "theme", "username") SELECT "bio", "createdAt", "disabled", "email", "gradeClass", "id", "image", "interests", "links", "name", "passwordHash", "private", "pronouns", "role", "theme", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
