-- CreateTable
CREATE TABLE "Feedback" (
    "id" SERIAL NOT NULL,
    "query" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "isGood" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);
