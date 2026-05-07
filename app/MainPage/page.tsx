import React from 'react'
import styles from './page.module.css'
import InBox from '@/components/InBox'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import Task from '@/components/Task'
import MainBoard from '@/components/MainBoard'
const MainPage = () => {
  return (
    <div className={styles.mainPage}>
      <ResizablePanelGroup orientation="horizontal">
        <ResizablePanel defaultSize={300} minSize={300}>
          <InBox />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel>
          <ScrollArea >
            <MainBoard />
            
            <ScrollBar orientation='horizontal' />
          </ScrollArea>
        </ResizablePanel>
      </ResizablePanelGroup>
      
    </div>
  )
}

export default MainPage