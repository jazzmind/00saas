/*
  Warnings:

  - Added the required column `verificationToken` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "verificationToken" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_verificationToken_fkey" FOREIGN KEY ("verificationToken") REFERENCES "VerificationToken"("token") ON DELETE RESTRICT ON UPDATE CASCADE;
