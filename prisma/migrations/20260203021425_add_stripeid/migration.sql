-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "inertia_main";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "website";

-- CreateEnum
CREATE TYPE "inertia_main"."AccountType" AS ENUM ('roblox', 'discord');

-- CreateEnum
CREATE TYPE "inertia_main"."GiftcardType" AS ENUM ('product', 'balance');

-- CreateEnum
CREATE TYPE "inertia_main"."PunishmentType" AS ENUM ('warn', 'kick', 'ban', 'blacklist', 'mute', 'timeout');

-- CreateEnum
CREATE TYPE "inertia_main"."TicketPriority" AS ENUM ('low', 'medium', 'high', 'onhold');

-- CreateEnum
CREATE TYPE "inertia_main"."TransactionType" AS ENUM ('paypal', 'roblox', 'lumen', 'system');

-- CreateEnum
CREATE TYPE "website"."IdType" AS ENUM ('discord', 'roblox', 'authentik');

-- CreateTable
CREATE TABLE "inertia_main"."Giftcards" (
    "_id" TEXT NOT NULL,
    "giftcardType" "inertia_main"."GiftcardType" NOT NULL,
    "purchased" TEXT[],
    "code" TEXT NOT NULL,
    "Locked" BOOLEAN NOT NULL,
    "UserId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Giftcards_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "inertia_main"."ProductTags" (
    "_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "viewable" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductTags_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "inertia_main"."Products" (
    "_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "robloxProductId" TEXT NOT NULL,
    "price_in_usd" TEXT NOT NULL,
    "price_in_robux" INTEGER NOT NULL,
    "price_in_lumens" INTEGER NOT NULL,
    "viewable" BOOLEAN NOT NULL,
    "purchaseable" BOOLEAN NOT NULL,
    "downloadable" BOOLEAN NOT NULL,
    "supporter_perk" BOOLEAN NOT NULL,
    "sortingPriority" INTEGER NOT NULL,
    "tags" TEXT[],
    "robloxImageId" TEXT NOT NULL DEFAULT '',
    "stripeProductId" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Products_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "inertia_main"."Punishments" (
    "_id" TEXT NOT NULL,
    "punishmentType" "inertia_main"."PunishmentType" NOT NULL,
    "punishmentReason" TEXT NOT NULL,
    "duration" TIMESTAMP(3) NOT NULL,
    "staffUserId" TEXT NOT NULL,
    "punishedUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Punishments_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "inertia_main"."Reviews" (
    "_id" TEXT NOT NULL,
    "productCode" TEXT[],
    "review" TEXT NOT NULL,
    "Score" INTEGER NOT NULL,
    "UserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reviews_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "inertia_main"."TicketPriorities" (
    "_id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "priority" "inertia_main"."TicketPriority" NOT NULL DEFAULT 'low',
    "slaDeadline" TIMESTAMP(3) NOT NULL,
    "lastStaffResponse" TIMESTAMP(3),
    "escalationStarted" TIMESTAMP(3),
    "escalationCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TicketPriorities_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "inertia_main"."Transactions" (
    "_id" TEXT NOT NULL,
    "transactionType" "inertia_main"."TransactionType" NOT NULL,
    "transactionAmount" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "productCode" TEXT NOT NULL,
    "oneTimeTransferUsed" BOOLEAN DEFAULT false,
    "UserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transactions_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "inertia_main"."Transfers" (
    "_id" TEXT NOT NULL,
    "transferReason" TEXT NOT NULL,
    "TransactionId" TEXT NOT NULL,
    "NewUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transfers_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "inertia_main"."User" (
    "_id" TEXT NOT NULL,
    "discordId" TEXT NOT NULL,
    "robloxId" TEXT NOT NULL,
    "lumens" INTEGER NOT NULL DEFAULT 0,
    "stripeCustomerID" TEXT DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "inertia_main"."Verification" (
    "_id" TEXT NOT NULL,
    "accountType" "inertia_main"."AccountType" NOT NULL,
    "accountId" TEXT NOT NULL,
    "code" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "website"."Session" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "idType" "website"."IdType" NOT NULL,
    "image" TEXT,
    "username" TEXT NOT NULL,
    "displayName" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attributes" JSONB,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Giftcards_code_key" ON "inertia_main"."Giftcards"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ProductTags_name_key" ON "inertia_main"."ProductTags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Products_name_key" ON "inertia_main"."Products"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Products_code_key" ON "inertia_main"."Products"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TicketPriorities_channelId_key" ON "inertia_main"."TicketPriorities"("channelId");

-- CreateIndex
CREATE UNIQUE INDEX "Transactions_purchaseId_key" ON "inertia_main"."Transactions"("purchaseId");

-- CreateIndex
CREATE UNIQUE INDEX "User_discordId_key" ON "inertia_main"."User"("discordId");

-- CreateIndex
CREATE UNIQUE INDEX "User_robloxId_key" ON "inertia_main"."User"("robloxId");

-- CreateIndex
CREATE UNIQUE INDEX "Verification_accountId_key" ON "inertia_main"."Verification"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "Verification_code_key" ON "inertia_main"."Verification"("code");

-- AddForeignKey
ALTER TABLE "inertia_main"."Giftcards" ADD CONSTRAINT "Giftcards_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "inertia_main"."User"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inertia_main"."Punishments" ADD CONSTRAINT "Punishments_punishedUserId_fkey" FOREIGN KEY ("punishedUserId") REFERENCES "inertia_main"."User"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inertia_main"."Punishments" ADD CONSTRAINT "Punishments_staffUserId_fkey" FOREIGN KEY ("staffUserId") REFERENCES "inertia_main"."User"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inertia_main"."Reviews" ADD CONSTRAINT "Reviews_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "inertia_main"."User"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inertia_main"."Transactions" ADD CONSTRAINT "Transactions_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "inertia_main"."User"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inertia_main"."Transfers" ADD CONSTRAINT "Transfers_NewUserId_fkey" FOREIGN KEY ("NewUserId") REFERENCES "inertia_main"."User"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inertia_main"."Transfers" ADD CONSTRAINT "Transfers_TransactionId_fkey" FOREIGN KEY ("TransactionId") REFERENCES "inertia_main"."Transactions"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;
