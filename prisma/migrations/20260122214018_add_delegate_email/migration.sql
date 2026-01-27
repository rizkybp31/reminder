-- AlterTable
ALTER TABLE `responses` ADD COLUMN `delegate_email` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `responses_delegate_email_idx` ON `responses`(`delegate_email`);
