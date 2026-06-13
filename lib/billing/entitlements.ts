import { prisma } from "@/lib/prisma";
import { BILLING_PLANS, canExportCsv, getVendorLimit, type BillingPlanId } from "@/lib/billing/plans";

export interface BillingState {
  plan: BillingPlanId;
  vendorLimit: number | null;
  csvExport: boolean;
  isPaid: boolean;
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: Date | null;
}

function normalizePlan(plan: string | null | undefined): BillingPlanId {
  const found = BILLING_PLANS.find((item) => item.id === plan);
  return found ? found.id : "FREE";
}

function isActiveSubscriptionStatus(status: string | null | undefined): boolean {
  if (!status) return false;
  return status === "ACTIVE" || status === "TRIALING" || status === "PAST_DUE";
}

export async function getBillingStateForUser(userId: string): Promise<BillingState> {
  const subscription = await prisma.subscription.findUnique({ where: { userId } });

  const plan = normalizePlan(subscription?.plan);
  const status = subscription?.status ?? "CANCELED";

  // เพิ่มส่วนนี้: ถ้าตั้งยกเลิกไว้แล้ว และรอบบิลผ่านไปแล้ว ให้ถือว่าหมดสิทธิ์ทันที
  // ไม่ต้องรอ Stripe webhook (กันกรณี webhook ตกหรือมาช้า)
  const periodExpired =
    Boolean(subscription?.cancelAtPeriodEnd) &&
    Boolean(subscription?.currentPeriodEnd) &&
    subscription!.currentPeriodEnd! < new Date();

  const isActive = isActiveSubscriptionStatus(status) && !periodExpired;

  const effectivePlan: BillingPlanId = isActive ? plan : "FREE";

  return {
    plan: effectivePlan,
    vendorLimit: getVendorLimit(effectivePlan),
    csvExport: canExportCsv(effectivePlan),
    isPaid: effectivePlan !== "FREE",
    status: periodExpired ? "CANCELED" : status,
    cancelAtPeriodEnd: Boolean(subscription?.cancelAtPeriodEnd),
    currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
  };
}

export async function assertCanCreateVendors(userId: string, addCount: number) {
  const billing = await getBillingStateForUser(userId);

  if (billing.vendorLimit === null) {
    return billing;
  }

  const currentCount = await prisma.vendor.count({ where: { userId } });
  const nextCount = currentCount + addCount;

  if (nextCount > billing.vendorLimit) {
    throw new Error(
      `Plan limit reached. ${billing.plan} allows up to ${billing.vendorLimit} vendors. Please upgrade to add more.`,
    );
  }

  return billing;
}

export async function getLockedVendorIds(userId: string): Promise<string[]> {
  const billing = await getBillingStateForUser(userId);

  if (billing.vendorLimit === null) {
    return [];
  }

  // เก่าสุดอยู่ก่อน = ใช้งานได้, ที่เหลือหลัง limit = ถูกล็อก
  const vendors = await prisma.vendor.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  return vendors.slice(billing.vendorLimit).map((v) => v.id);
}

export async function assertVendorNotLocked(userId: string, vendorId: string) {
  const lockedIds = await getLockedVendorIds(userId);
  if (lockedIds.includes(vendorId)) {
    throw new Error(
      "This vendor is locked because it exceeds your current plan limit. Upgrade your plan or delete other vendors to unlock it.",
    );
  }
}
