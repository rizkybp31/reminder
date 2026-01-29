-- CreateEnum
CREATE TYPE "Role" AS ENUM ('kepala', 'kepala_seksi', 'kepala_rutan');

-- CreateEnum
CREATE TYPE "StatusAgenda" AS ENUM ('pending', 'responded');

-- CreateEnum
CREATE TYPE "ResponseType" AS ENUM ('hadir', 'tidak_hadir', 'diwakilkan');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "seksi_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agendas" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "start_datetime" TIMESTAMP(3) NOT NULL,
    "end_datetime" TIMESTAMP(3) NOT NULL,
    "status" "StatusAgenda" NOT NULL DEFAULT 'pending',
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agendas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "responses" (
    "id" TEXT NOT NULL,
    "agenda_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "response_type" "ResponseType" NOT NULL,
    "delegate_name" TEXT,
    "delegate_email" TEXT,
    "notes" TEXT,
    "responded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "responses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "agendas_created_by_id_idx" ON "agendas"("created_by_id");

-- CreateIndex
CREATE INDEX "agendas_status_idx" ON "agendas"("status");

-- CreateIndex
CREATE INDEX "agendas_start_datetime_idx" ON "agendas"("start_datetime");

-- CreateIndex
CREATE UNIQUE INDEX "responses_agenda_id_key" ON "responses"("agenda_id");

-- CreateIndex
CREATE INDEX "responses_user_id_idx" ON "responses"("user_id");

-- CreateIndex
CREATE INDEX "responses_agenda_id_idx" ON "responses"("agenda_id");

-- CreateIndex
CREATE INDEX "responses_delegate_email_idx" ON "responses"("delegate_email");

-- AddForeignKey
ALTER TABLE "agendas" ADD CONSTRAINT "agendas_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "responses" ADD CONSTRAINT "responses_agenda_id_fkey" FOREIGN KEY ("agenda_id") REFERENCES "agendas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "responses" ADD CONSTRAINT "responses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
