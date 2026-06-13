import React from 'react'
import ComponentsPage from '@/components/page'
import { getCurrentUser } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { getBillingStateForUser } from '@/lib/billing/entitlements'
import { getLockedVendorIdsAction } from '@/actions/vendor'

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const rawVendors = user
    ? await prisma.vendor.findMany({ where: { userId: user.sub }, orderBy: { endDate: 'asc' } })
    : [];

  const vendors = rawVendors.map((v) => ({ ...v, monthlyCost: v.monthlyCost.toNumber() }));

  const billing = user
    ? await getBillingStateForUser(user.sub)
    : { plan: 'FREE' as const, vendorLimit: 2, csvExport: false, isPaid: false, status: 'CANCELED', cancelAtPeriodEnd: false, currentPeriodEnd: null };

  const lockedVendorIds = user ? await getLockedVendorIdsAction() : [];

  return <ComponentsPage user={user} vendors={vendors} billing={billing} lockedVendorIds={lockedVendorIds} />
}