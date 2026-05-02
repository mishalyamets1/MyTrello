import React from 'react'
import styles from './page.module.css'
import InBox from '@/components/InBox'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
const MainPage = () => {
  return (
    <div className={styles.mainPage}>
      <ResizablePanelGroup orientation="horizontal">
        <ResizablePanel defaultSize={300} minSize={300}>
          <InBox />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel>
          <InBox />
        </ResizablePanel>
      </ResizablePanelGroup>
      
    </div>
  )
}

export default MainPage