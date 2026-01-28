/*
  Warnings:

  - You are about to alter the column `status` on the `agendas` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(2))` to `Enum(EnumId(1))`.
  - The values [HADIR,TIDAK_HADIR,DIWAKILKAN] on the enum `responses_response_type` will be removed. If these variants are still used in the database, this will fail.
  - The values [KEPALA_RUTAN,KEPALA_SEKSI] on the enum `users_role` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `agendas` MODIFY `status` ENUM('pending', 'responded') NOT NULL DEFAULT 'pending';

-- AlterTable
ALTER TABLE `responses` MODIFY `response_type` ENUM('hadir', 'tidak_hadir', 'diwakilkan') NOT NULL;

-- AlterTable
ALTER TABLE `users` MODIFY `role` ENUM('kepala') NOT NULL;
