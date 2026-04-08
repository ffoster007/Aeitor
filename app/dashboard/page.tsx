import React from 'react'
import ComponentsPage from '@/components/page'
import { getCurrentUser } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const rawVendors = user
    ? await prisma.vendor.findMany({
        where: { userId: user.sub },
        orderBy: { endDate: 'asc' },
      })
    : [];

  // Serialize Decimal → number so it can cross the Server→Client boundary
  const vendors = rawVendors.map((v) => ({
    ...v,
    monthlyCost: v.monthlyCost.toNumber(),
  }));
  return <ComponentsPage user={user} vendors={vendors} />
}