/*
  Warnings:

  - You are about to drop the column `sources` on the `Message` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Message" DROP COLUMN "sources";

-- CreateTable
CREATE TABLE "Source" (
    "id" SERIAL NOT NULL,
    "content" TEXT,
    "refference" TEXT,
    "messageId" INTEGER NOT NULL,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Source" ADD CONSTRAINT "Source_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
