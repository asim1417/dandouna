-- CreateTable
CREATE TABLE "ChallengeProgram" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "audience" TEXT NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "goal" TEXT NOT NULL,
    "completionBadge" TEXT,
    "suggestedForBands" JSONB,
    "days" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChallengeProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HabitTemplate" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "desc" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "HabitTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteContent" (
    "key" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteContent_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChallengeProgram_code_key" ON "ChallengeProgram"("code");

-- CreateIndex
CREATE UNIQUE INDEX "HabitTemplate_code_key" ON "HabitTemplate"("code");
