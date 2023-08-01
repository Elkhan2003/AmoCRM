-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER', 'BETATESTER', 'MENTOR');

-- CreateEnum
CREATE TYPE "UserPlan" AS ENUM ('FREE', 'PAID', 'PRO', 'PREMIUM');

-- CreateEnum
CREATE TYPE "PlanRange" AS ENUM ('FREE', 'MONTHLY', 'ANNUALLY');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "plan" "UserPlan" NOT NULL DEFAULT 'FREE',
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "photo" TEXT,
    "isPhoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "phone" TEXT,
    "traffic" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
