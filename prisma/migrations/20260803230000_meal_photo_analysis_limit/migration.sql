-- CreateTable
CREATE TABLE "MealPhotoAnalysis" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MealPhotoAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MealPhotoAnalysis_userId_createdAt_idx" ON "MealPhotoAnalysis"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "MealPhotoAnalysis" ADD CONSTRAINT "MealPhotoAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
