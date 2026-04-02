/*
  Warnings:

  - You are about to drop the column `size` on the `Rating` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "User_shirtNumber_key";

-- AlterTable
ALTER TABLE "Rating" DROP COLUMN "size";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "height" DOUBLE PRECISION,
ADD COLUMN     "weight" DOUBLE PRECISION;
