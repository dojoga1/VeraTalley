-- CreateTable
CREATE TABLE "Election" (
    "address" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "publicKey" TEXT NOT NULL,
    "createdAtBlock" TEXT NOT NULL,

    CONSTRAINT "Election_pkey" PRIMARY KEY ("address")
);

-- CreateTable
CREATE TABLE "Ballot" (
    "id" TEXT NOT NULL,
    "electionAddress" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "ballotHash" TEXT NOT NULL,
    "voterAddress" TEXT NOT NULL,
    "ciphertext" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "blockNumber" TEXT NOT NULL,
    "castAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ballot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Voter" (
    "id" TEXT NOT NULL,
    "electionAddress" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "registeredAtBlock" TEXT NOT NULL,
    "revokedAtBlock" TEXT,

    CONSTRAINT "Voter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndexerState" (
    "id" TEXT NOT NULL,
    "electionAddress" TEXT NOT NULL,
    "lastProcessedBlock" TEXT NOT NULL,

    CONSTRAINT "IndexerState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Ballot_txHash_idx" ON "Ballot"("txHash");

-- CreateIndex
CREATE UNIQUE INDEX "Ballot_electionAddress_sequence_key" ON "Ballot"("electionAddress", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "Ballot_electionAddress_voterAddress_key" ON "Ballot"("electionAddress", "voterAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Voter_electionAddress_walletAddress_key" ON "Voter"("electionAddress", "walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "IndexerState_electionAddress_key" ON "IndexerState"("electionAddress");

-- AddForeignKey
ALTER TABLE "Ballot" ADD CONSTRAINT "Ballot_electionAddress_fkey" FOREIGN KEY ("electionAddress") REFERENCES "Election"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voter" ADD CONSTRAINT "Voter_electionAddress_fkey" FOREIGN KEY ("electionAddress") REFERENCES "Election"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndexerState" ADD CONSTRAINT "IndexerState_electionAddress_fkey" FOREIGN KEY ("electionAddress") REFERENCES "Election"("address") ON DELETE RESTRICT ON UPDATE CASCADE;
