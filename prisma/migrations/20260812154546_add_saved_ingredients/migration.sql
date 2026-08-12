-- CreateTable
CREATE TABLE "SavedIngredient" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "calories" INTEGER NOT NULL,
    "proteinG" DOUBLE PRECISION NOT NULL,
    "carbsG" DOUBLE PRECISION NOT NULL,
    "fatG" DOUBLE PRECISION NOT NULL,
    "portion" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SavedIngredient_userId_updatedAt_idx" ON "SavedIngredient"("userId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SavedIngredient_userId_key_key" ON "SavedIngredient"("userId", "key");

-- AddForeignKey
ALTER TABLE "SavedIngredient" ADD CONSTRAINT "SavedIngredient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
