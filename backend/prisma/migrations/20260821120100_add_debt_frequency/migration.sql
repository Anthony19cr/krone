-- AlterTable
ALTER TABLE "Debt" RENAME COLUMN "monthlyPayment" TO "paymentAmount";
ALTER TABLE "Debt" ADD COLUMN "frequency" "Frequency" NOT NULL DEFAULT 'MONTHLY';
