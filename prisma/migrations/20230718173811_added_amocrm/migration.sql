-- CreateTable
CREATE TABLE "amoCRM" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "token_type" TEXT NOT NULL,
    "expires_in" DECIMAL(65,30) NOT NULL,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "expires_at" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "amoCRM_pkey" PRIMARY KEY ("id")
);
