-- AlterTable
ALTER TABLE `Appointment` ADD COLUMN `patientAddress` TEXT NULL,
    ADD COLUMN `patientDob` DATE NULL,
    ADD COLUMN `patientGender` ENUM('MALE', 'FEMALE', 'OTHER') NULL,
    ADD COLUMN `patientName` VARCHAR(191) NULL,
    ADD COLUMN `patientPhone` VARCHAR(191) NULL,
    MODIFY `patientId` VARCHAR(191) NULL,
    MODIFY `patientEmail` VARCHAR(191) NULL;
