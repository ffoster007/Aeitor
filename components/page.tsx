import React from 'react'
import Toolbar from '../components/toolbar/page';
import ActivityBar from '../components/activitybar/page';
import Content from '../components/content/page';

function page() {
  return (
    <div>
        <Toolbar />
        <div className='flex flex-1'>
            <ActivityBar  />
                <Content />
        </div>

    </div>
  )
}

export default page
