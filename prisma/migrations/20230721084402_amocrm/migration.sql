-- CreateTable
CREATE TABLE "amoCRM" (
    "id" SERIAL NOT NULL,
    "tokenType" TEXT NOT NULL,
    "expiresIn" DECIMAL(65,30) NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "amoCRM_pkey" PRIMARY KEY ("id")
);
