import React, { useState, useEffect } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Button } from '../ui/button'
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandInput } from '../ui/command'
import { useBoardStore } from '@/stores/boardStore'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '../ui/input'
import { toast } from 'sonner'
import styles from './SelectBoards.module.css'

const SelectBoards = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const boardFromUrl = searchParams.get("board")

    const {boards, loadBoards, selectBoard, createBoard, deleteBoard} = useBoardStore()
    const [open, setOpen] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [newBoardTitle, setNewBoardTitle] = useState('')

    const setBoardInUrl = (boardId: string) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set("board", boardId)
        router.replace(`?${params.toString()}`, {scroll: false})
    }

    useEffect(() => {
        loadBoards(boardFromUrl ?? undefined)
    }, [boardFromUrl, loadBoards])

    const handleSelect = async (boardId: string) => {
        await selectBoard(boardId);
        setBoardInUrl(boardId)
        setOpen(false)
    }

    const handleCreate = async () => {
        const title = newBoardTitle.trim()
        if (!title) return toast.warning("Введите название доски")

        await createBoard(title)
        const id = useBoardStore.getState().currentBoardId
        if (id) setBoardInUrl(id)

        setNewBoardTitle('')
        setIsCreating(false)
        setOpen(false)
    }
    const clearBoardFromUrl = () => {
        const params = new URLSearchParams(searchParams.toString())
        params.delete("board")
        const qs = params.toString()
        router.replace(qs ? `?${qs}` : "?", {scroll: false})
    }

    const handleDelete = async (boardId: string) => {
        const wasCurrent = await deleteBoard(boardId)
        if (!wasCurrent) return

        const nextId = useBoardStore.getState().currentBoardId
        if (nextId) setBoardInUrl(nextId)
        else clearBoardFromUrl()
    }
  return (
    <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
            <Button>
                Выбрать доску
            </Button>
        </PopoverTrigger>
        <PopoverContent>
        <Command>
            <CommandInput placeholder='Поиск'></CommandInput>
            <CommandEmpty>Не найдено</CommandEmpty>
            <CommandGroup>
                {boards.map((b) => (
                    <CommandItem
                    className={styles.item}
                    key = {b.id}
                    value = {b.id}
                    keywords={[b.title]}
                    onSelect={() => {
                        handleSelect(b.id)
                        setOpen(false)
                    }}
                    >
                        <div className={styles.row}>
                        <span>{b.title}</span>
                        <Button
                        className={styles.deleteBtn}
                        variant='outline'
                         onMouseDown={(e) => {e.preventDefault(); e.stopPropagation()}}
                         onClick={(e) => {e.stopPropagation(); handleDelete(b.id)}}
                         >
                        ✕
                        </Button>
                        </div>
                    </CommandItem>
                ))}
            </CommandGroup>
            <hr/>
            <CommandGroup>
                {!isCreating && (
                <CommandItem
                value='create'
                onSelect={() => {setIsCreating(true)}}
                >
                    + Новая доска
                </CommandItem>)}
            </CommandGroup>
            {isCreating && (
                <CommandGroup>
                <div>
                    <Input
                    autoFocus
                    placeholder='Название доски'
                    value={newBoardTitle}
                    onBlur={()=> {setIsCreating(false); setNewBoardTitle('')}}
                    onChange={(e) => setNewBoardTitle(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreate()
                        if (e.key === 'Escape') {
                            setIsCreating(false)
                            setNewBoardTitle('')
                        }
                    }}
                    />
                    <div className={styles.btns}>
                        <Button
                         size='sm'
                         onMouseDown={(e) => e.preventDefault()}
                         onClick={handleCreate}
                         >
                        Создать
                        </Button>
                        <Button
                         size='sm'
                         onMouseDown={(e) => e.preventDefault()}
                         variant='outline'
                         onClick={() => {
                            setIsCreating(false)
                            setNewBoardTitle('')
                         }}
                         >
                        Отмена
                        </Button>
                    </div>
                </div>
                </CommandGroup>
            )}
        </Command>
        </PopoverContent>
    </Popover>
  )
}

export default SelectBoards

