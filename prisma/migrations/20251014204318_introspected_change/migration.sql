-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "main";

-- CreateEnum
CREATE TYPE "main"."AccountType" AS ENUM ('roblox', 'discord');

-- CreateEnum
CREATE TYPE "main"."PunishmentType" AS ENUM ('kick', 'ban', 'blacklist', 'warn', 'mute', 'timeout');

-- CreateEnum
CREATE TYPE "main"."TransactionType" AS ENUM ('paypal', 'roblox', 'lumen', 'system');

-- CreateEnum
CREATE TYPE "main"."GiftcardType" AS ENUM ('product', 'balance');

-- CreateEnum
CREATE TYPE "main"."TicketPriority" AS ENUM ('low', 'medium', 'high', 'onhold');

-- CreateTable
CREATE TABLE "main"."User" (
    "_id" TEXT NOT NULL,
    "discordId" TEXT NOT NULL,
    "robloxId" TEXT NOT NULL,
    "lumens" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "main"."Punishments" (
    "_id" TEXT NOT NULL,
    "punishmentType" "main"."PunishmentType" NOT NULL,
    "punishmentReason" TEXT NOT NULL,
    "staffUserId" TEXT NOT NULL,
    "punishedUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "duration" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Punishments_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "main"."Transactions" (
    "_id" TEXT NOT NULL,
    "transactionType" "main"."TransactionType" NOT NULL,
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
CREATE TABLE "main"."Transfers" (
    "_id" TEXT NOT NULL,
    "transferReason" TEXT NOT NULL,
    "TransactionId" TEXT NOT NULL,
    "NewUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transfers_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "main"."Giftcards" (
    "_id" TEXT NOT NULL,
    "giftcardType" "main"."GiftcardType" NOT NULL,
    "purchased" TEXT[],
    "code" TEXT NOT NULL,
    "userLocked" BOOLEAN NOT NULL,
    "UserId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Giftcards_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "main"."Reviews" (
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
CREATE TABLE "main"."Products" (
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Products_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "main"."ProductTags" (
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
CREATE TABLE "main"."Verification" (
    "_id" TEXT NOT NULL,
    "accountType" "main"."AccountType" NOT NULL,
    "accountId" TEXT NOT NULL,
    "code" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "main"."TicketPriorities" (
    "_id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "priority" "main"."TicketPriority" NOT NULL DEFAULT 'low',
    "slaDeadline" TIMESTAMP(3) NOT NULL,
    "lastStaffResponse" TIMESTAMP(3),
    "escalationStarted" TIMESTAMP(3),
    "escalationCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TicketPriorities_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_discordId_key" ON "main"."User"("discordId");

-- CreateIndex
CREATE UNIQUE INDEX "User_robloxId_key" ON "main"."User"("robloxId");

-- CreateIndex
CREATE UNIQUE INDEX "Transactions_purchaseId_key" ON "main"."Transactions"("purchaseId");

-- CreateIndex
CREATE UNIQUE INDEX "Giftcards_code_key" ON "main"."Giftcards"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Products_name_key" ON "main"."Products"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Products_code_key" ON "main"."Products"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ProductTags_name_key" ON "main"."ProductTags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Verification_accountId_key" ON "main"."Verification"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "Verification_code_key" ON "main"."Verification"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TicketPriorities_channelId_key" ON "main"."TicketPriorities"("channelId");

-- AddForeignKey
ALTER TABLE "main"."Punishments" ADD CONSTRAINT "Punishments_punishedUserId_fkey" FOREIGN KEY ("punishedUserId") REFERENCES "main"."User"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."Punishments" ADD CONSTRAINT "Punishments_staffUserId_fkey" FOREIGN KEY ("staffUserId") REFERENCES "main"."User"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."Transactions" ADD CONSTRAINT "Transactions_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "main"."User"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."Transfers" ADD CONSTRAINT "Transfers_NewUserId_fkey" FOREIGN KEY ("NewUserId") REFERENCES "main"."User"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."Transfers" ADD CONSTRAINT "Transfers_TransactionId_fkey" FOREIGN KEY ("TransactionId") REFERENCES "main"."Transactions"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."Giftcards" ADD CONSTRAINT "Giftcards_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "main"."User"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."Reviews" ADD CONSTRAINT "Reviews_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "main"."User"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;
