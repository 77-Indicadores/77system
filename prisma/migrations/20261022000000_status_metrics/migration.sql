CREATE TABLE "DashboardScreenUsage" (
    "screenId" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DashboardScreenUsage_pkey" PRIMARY KEY ("screenId")
);

ALTER TABLE "DashboardScreenUsage" ADD CONSTRAINT "DashboardScreenUsage_screenId_fkey" FOREIGN KEY ("screenId") REFERENCES "DashboardScreen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "UserActivity" (
    "email" TEXT NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "UserActivity_pkey" PRIMARY KEY ("email")
);

CREATE INDEX "UserActivity_lastSeenAt_idx" ON "UserActivity"("lastSeenAt");

CREATE TABLE "UserAccessEvent" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserAccessEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "UserAccessEvent_occurredAt_kind_idx" ON "UserAccessEvent"("occurredAt", "kind");
CREATE INDEX "UserAccessEvent_email_occurredAt_idx" ON "UserAccessEvent"("email", "occurredAt");
