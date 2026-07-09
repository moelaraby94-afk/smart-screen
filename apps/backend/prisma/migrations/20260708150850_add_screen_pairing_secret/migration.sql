-- AlterTable
ALTER TABLE "Screen" ADD COLUMN     "pairingSecretHash" TEXT;

-- AlterTable
ALTER TABLE "ScreenPairingSession" ADD COLUMN     "screenSecretHandoff" TEXT;
