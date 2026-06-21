-- AlterTable
ALTER TABLE "Review" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "College_saveCount_idx" ON "College"("saveCount");

-- CreateIndex
CREATE INDEX "College_compareCount_idx" ON "College"("compareCount");

-- CreateIndex
CREATE INDEX "ContactInquiry_createdAt_idx" ON "ContactInquiry"("createdAt");
