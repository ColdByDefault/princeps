-- AlterTable
ALTER TABLE "user" ADD COLUMN     "chatsDailyCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "chatsDailyDate" TEXT,
ADD COLUMN     "widgetChatsCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "widgetCountsDate" TEXT,
ADD COLUMN     "widgetToolsCount" INTEGER NOT NULL DEFAULT 0;
