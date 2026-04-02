-- CreateTable
CREATE TABLE "FinanceCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "colour" TEXT NOT NULL DEFAULT '#60a5fa',
    "icon" TEXT NOT NULL DEFAULT 'shopping',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinanceCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceTransaction" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "categoryId" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinanceTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FinanceTransaction_date_idx" ON "FinanceTransaction"("date");

-- CreateIndex
CREATE INDEX "FinanceTransaction_type_idx" ON "FinanceTransaction"("type");

-- AddForeignKey
ALTER TABLE "FinanceTransaction" ADD CONSTRAINT "FinanceTransaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "FinanceCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
