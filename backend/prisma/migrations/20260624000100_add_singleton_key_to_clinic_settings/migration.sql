-- Add unique singleton keys so ClinicInfo and SystemSetting are enforced at the database level.
ALTER TABLE `ClinicInfo`
    ADD COLUMN `singletonKey` VARCHAR(191) NOT NULL DEFAULT 'CLINIC_INFO';

ALTER TABLE `SystemSetting`
    ADD COLUMN `singletonKey` VARCHAR(191) NOT NULL DEFAULT 'SYSTEM_SETTING';

CREATE UNIQUE INDEX `ClinicInfo_singletonKey_key` ON `ClinicInfo`(`singletonKey`);
CREATE UNIQUE INDEX `SystemSetting_singletonKey_key` ON `SystemSetting`(`singletonKey`);
