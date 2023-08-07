-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('TODO', 'SOLVED', 'ATTEMPTED');

-- CreateTable
CREATE TABLE "Submission" (
    "exerciseId" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'TODO',
    "code" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("userId")
);

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
