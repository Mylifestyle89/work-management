-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "quadrant" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "note" TEXT,
    "deadline" DATETIME,
    "amountDisbursement" INTEGER,
    "serviceFee" INTEGER,
    "amountRecovery" INTEGER,
    "amountMobilized" INTEGER,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" DATETIME,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Task" ("amountDisbursement", "amountMobilized", "amountRecovery", "completed", "completedAt", "createdAt", "deadline", "id", "note", "quadrant", "serviceFee", "title", "type") SELECT "amountDisbursement", "amountMobilized", "amountRecovery", "completed", "completedAt", "createdAt", "deadline", "id", "note", "quadrant", "serviceFee", "title", "type" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
