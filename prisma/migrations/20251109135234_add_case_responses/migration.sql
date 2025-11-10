-- AlterTable
ALTER TABLE "automated_emails" ADD COLUMN     "name" TEXT,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "summary" TEXT,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'DRIP';

-- CreateTable
CREATE TABLE "newsletter_subscribers" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "newsletter_subscribers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_responses" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "simulation_id" TEXT,
    "content" TEXT NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "likes_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "case_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_response_likes" (
    "user_id" TEXT NOT NULL,
    "response_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "case_response_likes_pkey" PRIMARY KEY ("user_id","response_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_subscribers_email_key" ON "newsletter_subscribers"("email");

-- CreateIndex
CREATE INDEX "case_responses_case_id_idx" ON "case_responses"("case_id");

-- CreateIndex
CREATE INDEX "case_responses_user_id_idx" ON "case_responses"("user_id");

-- CreateIndex
CREATE INDEX "case_responses_likes_count_created_at_idx" ON "case_responses"("likes_count", "created_at");

-- CreateIndex
CREATE INDEX "case_response_likes_response_id_idx" ON "case_response_likes"("response_id");

-- CreateIndex
CREATE INDEX "automated_emails_type_idx" ON "automated_emails"("type");

-- CreateIndex
CREATE INDEX "automated_emails_publishedAt_idx" ON "automated_emails"("publishedAt");

-- AddForeignKey
ALTER TABLE "case_responses" ADD CONSTRAINT "case_responses_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_responses" ADD CONSTRAINT "case_responses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_responses" ADD CONSTRAINT "case_responses_simulation_id_fkey" FOREIGN KEY ("simulation_id") REFERENCES "simulations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_response_likes" ADD CONSTRAINT "case_response_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_response_likes" ADD CONSTRAINT "case_response_likes_response_id_fkey" FOREIGN KEY ("response_id") REFERENCES "case_responses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
