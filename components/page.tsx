"use client";
import { useState } from 'react';
import type { ToolbarProps } from './toolbar/page';
import ActivityBar, { type ActivityTabId } from '../components/activitybar/page';
import HowToPage from './howto/page';
import Toolbar from './toolbar/page';
import VendorContracts from './vendors/VendorContracts';

interface Vendor {
  id: string;
  name: string;
  endDate: Date;
  noticePeriod: number;
  monthlyCost: number;
}

type PageProps = ToolbarProps & { vendors: Vendor[] };

export default function Page({ user, vendors }: PageProps) {
  const [activeTab, setActiveTab] = useState<ActivityTabId>('Home');

  return (
    <div className="h-screen flex flex-col">
      <Toolbar user={user} />
      <div className='flex flex-1 overflow-hidden'>
        <ActivityBar activeTab={activeTab} onTabSelect={setActiveTab} />
        <div className="flex-1 bg-[#1a1a1a] overflow-hidden">
          {activeTab === 'Home' && <HowToPage />}
          {activeTab === 'Workspace' && <VendorContracts vendors={vendors} />}
        </div>
      </div>
    </div>
  );
}
