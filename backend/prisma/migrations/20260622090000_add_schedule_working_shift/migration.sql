-- Add shift-aware schedules and persisted time slot shift metadata.
ALTER TABLE `Schedule`
  DROP INDEX `Schedule_doctorId_workingDate_key`,
  ADD COLUMN `workingShift` ENUM('MORNING', 'AFTERNOON', 'ALL_DAY') NOT NULL DEFAULT 'ALL_DAY',
  ADD COLUMN `morningShiftStart` VARCHAR(191) NULL,
  ADD COLUMN `morningShiftEnd` VARCHAR(191) NULL,
  ADD COLUMN `afternoonShiftStart` VARCHAR(191) NULL,
  ADD COLUMN `afternoonShiftEnd` VARCHAR(191) NULL;

UPDATE `Schedule`
SET
  `morningShiftStart` = COALESCE(`morningShiftStart`, '08:00'),
  `morningShiftEnd` = COALESCE(`morningShiftEnd`, '11:30'),
  `afternoonShiftStart` = COALESCE(`afternoonShiftStart`, '13:30'),
  `afternoonShiftEnd` = COALESCE(`afternoonShiftEnd`, '17:00');

CREATE UNIQUE INDEX `Schedule_doctorId_workingDate_workingShift_key`
  ON `Schedule`(`doctorId`, `workingDate`, `workingShift`);
CREATE INDEX `Schedule_workingShift_idx` ON `Schedule`(`workingShift`);

ALTER TABLE `TimeSlot`
  ADD COLUMN `workingShift` ENUM('MORNING', 'AFTERNOON', 'ALL_DAY') NOT NULL DEFAULT 'MORNING';

ALTER TABLE `ApprovalRequest`
  MODIFY `shift` ENUM('MORNING', 'AFTERNOON', 'ALL_DAY') NULL;

UPDATE `TimeSlot`
SET `workingShift` = CASE
  WHEN `startTime` < '12:00' THEN 'MORNING'
  ELSE 'AFTERNOON'
END;

CREATE INDEX `TimeSlot_workingShift_idx` ON `TimeSlot`(`workingShift`);
