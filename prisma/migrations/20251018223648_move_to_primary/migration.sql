-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "primary";

-- CreateEnum
CREATE TYPE "primary"."AccountType" AS ENUM ('roblox', 'discord');

-- CreateEnum
CREATE TYPE "primary"."PunishmentType" AS ENUM ('kick', 'ban', 'blacklist', 'warn', 'mute', 'timeout');

-- CreateEnum
CREATE TYPE "primary"."TransactionType" AS ENUM ('paypal', 'roblox', 'lumen', 'system');

-- CreateEnum
CREATE TYPE "primary"."GiftcardType" AS ENUM ('product', 'balance');

-- CreateEnum
CREATE TYPE "primary"."TicketPriority" AS ENUM ('low', 'medium', 'high', 'onhold');

-- CreateTable
CREATE TABLE "primary"."primary" (
    "_id" TEXT NOT NULL,
    "discordId" TEXT NOT NULL,
    "robloxId" TEXT NOT NULL,
    "lumens" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "primary_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "primary"."Punishments" (
    "_id" TEXT NOT NULL,
    "punishmentType" "primary"."PunishmentType" NOT NULL,
    "punishmentReason" TEXT NOT NULL,
    "staffprimaryId" TEXT NOT NULL,
    "punishedprimaryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "duration" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Punishments_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "primary"."Transactions" (
    "_id" TEXT NOT NULL,
    "transactionType" "primary"."TransactionType" NOT NULL,
    "transactionAmount" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "productCode" TEXT NOT NULL,
    "oneTimeTransferUsed" BOOLEAN DEFAULT false,
    "primaryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transactions_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "primary"."Transfers" (
    "_id" TEXT NOT NULL,
    "transferReason" TEXT NOT NULL,
    "TransactionId" TEXT NOT NULL,
    "NewprimaryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transfers_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "primary"."Giftcards" (
    "_id" TEXT NOT NULL,
    "giftcardType" "primary"."GiftcardType" NOT NULL,
    "purchased" TEXT[],
    "code" TEXT NOT NULL,
    "primaryLocked" BOOLEAN NOT NULL,
    "primaryId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Giftcards_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "primary"."Reviews" (
    "_id" TEXT NOT NULL,
    "productCode" TEXT[],
    "review" TEXT NOT NULL,
    "Score" INTEGER NOT NULL,
    "primaryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reviews_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "primary"."Products" (
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
CREATE TABLE "primary"."ProductTags" (
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
CREATE TABLE "primary"."Verification" (
    "_id" TEXT NOT NULL,
    "accountType" "primary"."AccountType" NOT NULL,
    "accountId" TEXT NOT NULL,
    "code" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "primary"."TicketPriorities" (
    "_id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "priority" "primary"."TicketPriority" NOT NULL DEFAULT 'low',
    "slaDeadline" TIMESTAMP(3) NOT NULL,
    "lastStaffResponse" TIMESTAMP(3),
    "escalationStarted" TIMESTAMP(3),
    "escalationCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TicketPriorities_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "primary_discordId_key" ON "primary"."primary"("discordId");

-- CreateIndex
CREATE UNIQUE INDEX "primary_robloxId_key" ON "primary"."primary"("robloxId");

-- CreateIndex
CREATE UNIQUE INDEX "Transactions_purchaseId_key" ON "primary"."Transactions"("purchaseId");

-- CreateIndex
CREATE UNIQUE INDEX "Giftcards_code_key" ON "primary"."Giftcards"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Products_name_key" ON "primary"."Products"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Products_code_key" ON "primary"."Products"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ProductTags_name_key" ON "primary"."ProductTags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Verification_accountId_key" ON "primary"."Verification"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "Verification_code_key" ON "primary"."Verification"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TicketPriorities_channelId_key" ON "primary"."TicketPriorities"("channelId");

-- AddForeignKey
ALTER TABLE "primary"."Punishments" ADD CONSTRAINT "Punishments_punishedprimaryId_fkey" FOREIGN KEY ("punishedprimaryId") REFERENCES "primary"."primary"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "primary"."Punishments" ADD CONSTRAINT "Punishments_staffprimaryId_fkey" FOREIGN KEY ("staffprimaryId") REFERENCES "primary"."primary"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "primary"."Transactions" ADD CONSTRAINT "Transactions_primaryId_fkey" FOREIGN KEY ("primaryId") REFERENCES "primary"."primary"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "primary"."Transfers" ADD CONSTRAINT "Transfers_NewprimaryId_fkey" FOREIGN KEY ("NewprimaryId") REFERENCES "primary"."primary"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "primary"."Transfers" ADD CONSTRAINT "Transfers_TransactionId_fkey" FOREIGN KEY ("TransactionId") REFERENCES "primary"."Transactions"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "primary"."Giftcards" ADD CONSTRAINT "Giftcards_primaryId_fkey" FOREIGN KEY ("primaryId") REFERENCES "primary"."primary"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "primary"."Reviews" ADD CONSTRAINT "Reviews_primaryId_fkey" FOREIGN KEY ("primaryId") REFERENCES "primary"."primary"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;
