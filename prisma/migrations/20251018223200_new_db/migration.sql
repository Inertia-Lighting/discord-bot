-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "user";

-- CreateEnum
CREATE TYPE "user"."AccountType" AS ENUM ('roblox', 'discord');

-- CreateEnum
CREATE TYPE "user"."PunishmentType" AS ENUM ('kick', 'ban', 'blacklist', 'warn', 'mute', 'timeout');

-- CreateEnum
CREATE TYPE "user"."TransactionType" AS ENUM ('paypal', 'roblox', 'lumen', 'system');

-- CreateEnum
CREATE TYPE "user"."GiftcardType" AS ENUM ('product', 'balance');

-- CreateEnum
CREATE TYPE "user"."TicketPriority" AS ENUM ('low', 'medium', 'high', 'onhold');

-- CreateTable
CREATE TABLE "user"."User" (
    "_id" TEXT NOT NULL,
    "discordId" TEXT NOT NULL,
    "robloxId" TEXT NOT NULL,
    "lumens" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "user"."Punishments" (
    "_id" TEXT NOT NULL,
    "punishmentType" "user"."PunishmentType" NOT NULL,
    "punishmentReason" TEXT NOT NULL,
    "staffUserId" TEXT NOT NULL,
    "punishedUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "duration" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Punishments_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "user"."Transactions" (
    "_id" TEXT NOT NULL,
    "transactionType" "user"."TransactionType" NOT NULL,
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
CREATE TABLE "user"."Transfers" (
    "_id" TEXT NOT NULL,
    "transferReason" TEXT NOT NULL,
    "TransactionId" TEXT NOT NULL,
    "NewUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transfers_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "user"."Giftcards" (
    "_id" TEXT NOT NULL,
    "giftcardType" "user"."GiftcardType" NOT NULL,
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
CREATE TABLE "user"."Reviews" (
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
CREATE TABLE "user"."Products" (
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
CREATE TABLE "user"."ProductTags" (
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
CREATE TABLE "user"."Verification" (
    "_id" TEXT NOT NULL,
    "accountType" "user"."AccountType" NOT NULL,
    "accountId" TEXT NOT NULL,
    "code" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "user"."TicketPriorities" (
    "_id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "priority" "user"."TicketPriority" NOT NULL DEFAULT 'low',
    "slaDeadline" TIMESTAMP(3) NOT NULL,
    "lastStaffResponse" TIMESTAMP(3),
    "escalationStarted" TIMESTAMP(3),
    "escalationCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TicketPriorities_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_discordId_key" ON "user"."User"("discordId");

-- CreateIndex
CREATE UNIQUE INDEX "User_robloxId_key" ON "user"."User"("robloxId");

-- CreateIndex
CREATE UNIQUE INDEX "Transactions_purchaseId_key" ON "user"."Transactions"("purchaseId");

-- CreateIndex
CREATE UNIQUE INDEX "Giftcards_code_key" ON "user"."Giftcards"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Products_name_key" ON "user"."Products"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Products_code_key" ON "user"."Products"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ProductTags_name_key" ON "user"."ProductTags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Verification_accountId_key" ON "user"."Verification"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "Verification_code_key" ON "user"."Verification"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TicketPriorities_channelId_key" ON "user"."TicketPriorities"("channelId");

-- AddForeignKey
ALTER TABLE "user"."Punishments" ADD CONSTRAINT "Punishments_punishedUserId_fkey" FOREIGN KEY ("punishedUserId") REFERENCES "user"."User"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user"."Punishments" ADD CONSTRAINT "Punishments_staffUserId_fkey" FOREIGN KEY ("staffUserId") REFERENCES "user"."User"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user"."Transactions" ADD CONSTRAINT "Transactions_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "user"."User"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user"."Transfers" ADD CONSTRAINT "Transfers_NewUserId_fkey" FOREIGN KEY ("NewUserId") REFERENCES "user"."User"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user"."Transfers" ADD CONSTRAINT "Transfers_TransactionId_fkey" FOREIGN KEY ("TransactionId") REFERENCES "user"."Transactions"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user"."Giftcards" ADD CONSTRAINT "Giftcards_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "user"."User"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user"."Reviews" ADD CONSTRAINT "Reviews_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "user"."User"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;
