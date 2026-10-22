CREATE TABLE "UserScreenView" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nome" TEXT,
    "grupo" TEXT,
    "iniciadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultimoPingEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "segundos" INTEGER NOT NULL DEFAULT 0,
    "pings" INTEGER NOT NULL DEFAULT 1,
    "encerrada" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "UserScreenView_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "UserScreenView_email_iniciadoEm_idx" ON "UserScreenView"("email", "iniciadoEm");
CREATE INDEX "UserScreenView_slug_iniciadoEm_idx" ON "UserScreenView"("slug", "iniciadoEm");
CREATE INDEX "UserScreenView_iniciadoEm_idx" ON "UserScreenView"("iniciadoEm");
