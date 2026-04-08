-- CreateTable
CREATE TABLE "vendors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "notice_period" INTEGER NOT NULL DEFAULT 30,
    "monthly_cost" DECIMAL(10,2) NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_sent_alerts" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "days_left" INTEGER NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendor_sent_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_alert_settings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "alert_days" INTEGER[] DEFAULT ARRAY[90, 60, 30]::INTEGER[],
    "weekly_summary" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_alert_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vendors_user_id_idx" ON "vendors"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_sent_alerts_vendor_id_days_left_key" ON "vendor_sent_alerts"("vendor_id", "days_left");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_alert_settings_user_id_key" ON "vendor_alert_settings"("user_id");

-- AddForeignKey
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_sent_alerts" ADD CONSTRAINT "vendor_sent_alerts_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_alert_settings" ADD CONSTRAINT "vendor_alert_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
