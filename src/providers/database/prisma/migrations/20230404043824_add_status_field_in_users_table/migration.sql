-- CreateEnum
CREATE TYPE "status" AS ENUM ('active', 'inactive');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "status" "status";
