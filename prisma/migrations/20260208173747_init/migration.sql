-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "quadrant" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "deadline" DATETIME,
    "amountDisbursement" INTEGER,
    "serviceFee" INTEGER,
    "amountRecovery" INTEGER,
    "amountMobilized" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
