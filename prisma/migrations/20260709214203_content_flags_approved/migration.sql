-- AlterTable
ALTER TABLE "Scale" ADD COLUMN     "approved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "approvedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ScaleFlag" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "operator" TEXT NOT NULL DEFAULT 'GTE',
    "threshold" DOUBLE PRECISION NOT NULL,
    "onSubscale" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'WARN',

    CONSTRAINT "ScaleFlag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScaleFlag_versionId_idx" ON "ScaleFlag"("versionId");

-- CreateIndex
CREATE INDEX "Scale_approved_idx" ON "Scale"("approved");

-- AddForeignKey
ALTER TABLE "ScaleFlag" ADD CONSTRAINT "ScaleFlag_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "ScaleVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
