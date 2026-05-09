/*
  Warnings:

  - You are about to drop the column `correctRespose` on the `Feedback` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Feedback" DROP COLUMN "correctRespose",
ADD COLUMN     "correctResponse" TEXT;
