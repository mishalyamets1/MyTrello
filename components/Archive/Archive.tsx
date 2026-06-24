import React, { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { Popover, PopoverContent, PopoverHeader, PopoverTitle, PopoverTrigger } from '../ui/popover'
import { Sheet, SheetContent } from '../ui/sheet'
import styles from './Archive.module.css'
import { useBoardStore } from '@/stores/boardStore'
import Task from '../Task'
import { Input } from '../ui/input'
import {
    Command,
    CommandGroup,
    CommandInput,
    CommandList,
} from '../ui/command'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/useMediaQuery'

const Archive = () => {
    const { archive, loadArchive, currentBoardId } = useBoardStore()
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState('')
    const isMobile = useIsMobile()

    useEffect(() => {
        if (!open || !currentBoardId) return
        loadArchive()
    }, [loadArchive, currentBoardId, open])

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (!open) setSearch('')
    }, [open])

    const filteredArchive = useMemo(() => {
        const query = search.trim().toLowerCase()
        if (!query) return archive
        return archive.filter((task) => task.title.toLowerCase().includes(query))
    }, [archive, search])

    const taskItems = filteredArchive.map((task) => (
        <div className={styles.taskWrapper} key={task.id}>
            <Task task={task} columnId='archive' draggable={false} />
        </div>
    ))

    if (isMobile) {
        return (
            <>
                <button
                    type="button"
                    className={styles.archiveTrigger}
                    aria-label="Открыть архив"
                    onClick={() => setOpen(true)}
                >
                    <Image className={styles.archive} src='/archive.svg' alt='' width={24} height={24} />
                </button>
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetContent
                        side="right"
                        title="Архив"
                        overlayClassName="!z-[100]"
                        className={cn(styles.sheetContent, '!z-[100]')}
                    >
                        <h2 className={styles.sheetTitle}>Архив</h2>
                        <Input
                            className={styles.searchInput}
                            placeholder='Поиск задач'
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                        <div className={styles.taskListMobile}>
                            {filteredArchive.length === 0 ? (
                                <p className={styles.emptyState}>Нет выполненных задач</p>
                            ) : (
                                taskItems
                            )}
                        </div>
                    </SheetContent>
                </Sheet>
            </>
        )
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Image className={styles.archive} src='/archive.svg' alt='archive' width={24} height={24} />
            </PopoverTrigger>
            <PopoverContent className={styles.popoverContent}>
                <PopoverHeader>
                    <PopoverTitle>Архив</PopoverTitle>
                </PopoverHeader>
                <Command shouldFilter={false} value={search} onValueChange={setSearch}>
                    <CommandInput placeholder='Поиск задач' />
                    <CommandList className={styles.commandList}>
                        {filteredArchive.length === 0 ? (
                            <p className={styles.emptyState}>Нет выполненных задач</p>
                        ) : (
                            <CommandGroup>
                                {taskItems}
                            </CommandGroup>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

export default Archive
