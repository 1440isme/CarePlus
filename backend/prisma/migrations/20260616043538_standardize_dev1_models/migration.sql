/*
  Warnings:

  - You are about to drop the column `description` on the `SystemSetting` table. All the data in the column will be lost.
  - You are about to drop the column `key` on the `SystemSetting` table. All the data in the column will be lost.
  - You are about to drop the column `value` on the `SystemSetting` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.
  - Added the required column `passwordHash` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `SystemSetting_key_key` ON `SystemSetting`;

-- AlterTable
ALTER TABLE `SystemSetting` DROP COLUMN `description`,
    DROP COLUMN `key`,
    DROP COLUMN `value`,
    ADD COLUMN `afternoonShiftEnd` VARCHAR(191) NOT NULL DEFAULT '17:00',
    ADD COLUMN `afternoonShiftStart` VARCHAR(191) NOT NULL DEFAULT '13:30',
    ADD COLUMN `cancelBeforeHours` INTEGER NOT NULL DEFAULT 2,
    ADD COLUMN `maxBookingDaysAhead` INTEGER NOT NULL DEFAULT 7,
    ADD COLUMN `maxNoShowBeforeLock` INTEGER NOT NULL DEFAULT 3,
    ADD COLUMN `morningShiftEnd` VARCHAR(191) NOT NULL DEFAULT '11:30',
    ADD COLUMN `morningShiftStart` VARCHAR(191) NOT NULL DEFAULT '08:00',
    ADD COLUMN `slotDurationMinutes` INTEGER NOT NULL DEFAULT 30;

-- AlterTable
ALTER TABLE `User` DROP COLUMN `password`,
    ADD COLUMN `passwordHash` VARCHAR(191) NOT NULL;
