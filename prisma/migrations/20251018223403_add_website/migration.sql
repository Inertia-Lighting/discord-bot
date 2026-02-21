-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "staff_website";

-- CreateTable
CREATE TABLE "staff_website"."Session" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "image" TEXT,
    "username" TEXT NOT NULL,
    "displayName" TEXT,
    "attributes" JSONB,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);
