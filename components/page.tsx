"use client";
import { useState } from 'react';
import type { ToolbarProps } from './toolbar/page';
import ActivityBar, { type ActivityTabId } from '../components/activitybar/page';
import Toolbar from './toolbar/page';
import WorkBox from './WorkBox/page';

type PageProps = ToolbarProps;

export default function Page({ user }: PageProps) {
  const [activeTab, setActiveTab] = useState<ActivityTabId>('Home');

  return (
    <div className="h-screen flex flex-col">
      <Toolbar user={user} />
      <div className='flex flex-1'>
        <ActivityBar activeTab={activeTab} onTabSelect={setActiveTab} />
        <div className="flex-1 bg-[#1a1a1a]">
          {activeTab === 'WorkBox' && <WorkBox />}
        </div>
      </div>
    </div>
  );
}
