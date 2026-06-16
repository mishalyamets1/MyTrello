import React, { useEffect, useState } from 'react'
import styles from './BoardMembers.module.css'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import Image from 'next/image'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '../ui/command'
import { useBoardStore } from '@/stores/boardStore'
import { useAuthStore } from '@/stores/authStore'
import { Badge } from '../ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'


const BoardMembers = () => {
    const {boards, currentBoardId, members, loadMembers, inviteMember, removeMember, changeMemberRole} = useBoardStore();
    const {userId} = useAuthStore()

    const [email, setEmail] = useState('')
    const [role, setRole] = useState<'editor' | 'viewer'>('viewer')
    const [inviteOpen, setInviteOpen] = useState(false)
    const [isInviting, setIsInviting] = useState(false)

    const currentBoard = boards.find((b) => b.id === currentBoardId)
    const isOwner = currentBoard?.ownerId === userId

    const handleInvite = async () => {

        const trimmed = email.trim().toLowerCase()
        if (!trimmed) {
            toast.error('Введите email!')
            return
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
            toast.error('Некорректный email')
            return
        }

        if (members.some((m) => m.email.toLowerCase() === trimmed)) {
            toast.error('Пользователь уже в доске')
            return
        }
        setIsInviting(true)
        try {
            const ok = await inviteMember(trimmed, role)
            if (!ok) return toast.error('Что то пошло не так')
            toast.success(`${trimmed} приглашен`)
            setEmail('')
            setRole('viewer')
            setInviteOpen(false)
        } finally {
            setIsInviting(false)
        }

    }

    const handleRemove = async (memberUserId: string, memberEmail: string) => {
        await removeMember(memberUserId)
        toast.success(`${memberEmail} удалён из доски`)
    }
    const handleRoleChange = async (memberUserId: string, newRole: 'editor' | 'viewer') => {
        await changeMemberRole(memberUserId, newRole)
        toast.success('Роль обновлена')
    }

    useEffect(() => {
        if (!currentBoardId) return
        loadMembers()
    }, [currentBoardId, loadMembers])


  return (
    <Popover>
        <PopoverTrigger asChild>
            <Image className={styles.popoverImg} src='/users.svg' alt='участники' width={20} height={20}></Image>
        </PopoverTrigger>
        <PopoverContent>
            <Command>
            <CommandInput placeholder='Поиск'></CommandInput>
            <CommandEmpty>Не найдено</CommandEmpty>
            <CommandGroup>
                {members.map((m) => (
                    <CommandItem 
                    className={styles.commandItem}
                    key={m.userId}
                    value={m.email}
                    >
                        <Dialog>
                            <DialogTrigger asChild>
                                <div className={styles.memberItem}>
                                    <Avatar>
                                    {m.avatar && <AvatarImage src={m.avatar} alt="" />}
                                    <AvatarFallback>
                                        {m.displayName?.[0]?.toUpperCase() || m.email[0].toUpperCase()}
                                    </AvatarFallback>
                                    </Avatar>
                                    <span className={styles.memberEmail}>{m.email}</span>
                                    <Badge className={styles.memberRole}>{m.role}</Badge>  
                                </div>
                            </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>
                                    {m.displayName || m.email}
                                </DialogTitle>
                            </DialogHeader>
                           {m.role === 'owner' ? (
                            <p className={styles.roleHint}>Владелец доски</p>
                           ) : isOwner ? (
                            <>
                            <Tabs
                            value={m.role}
                            onValueChange={(v) => handleRoleChange(m.userId, v as 'editor' | 'viewer')}
                            >
                                <TabsList>
                                    <TabsTrigger value='viewer'>Viewer</TabsTrigger>
                                    <TabsTrigger value='editor'>Editor</TabsTrigger>
                                </TabsList>
                                <TabsContent value="viewer">Только просмотр</TabsContent>
                                <TabsContent value="editor">Просмотр и редактирование</TabsContent>
                            </Tabs>
                            <Button variant='destructive'
                            onClick={() => handleRemove(m.userId, m.email)}
                            >
                                Удалить из списка
                            </Button>
                            </>
                           ) : (
                            <p>Роль: {m.role}</p>
                           )}
                        </DialogContent>
                        </Dialog>
                       
                    </CommandItem>
                ))}
            </CommandGroup>
            <hr/>
            {isOwner && (
                <CommandGroup>
                <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                    <DialogTrigger asChild>
                        <Button className={styles.inviteBtn} variant='outline'>+ Пригласить</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogTitle>
                                 Приглашение   
                        </DialogTitle>
                        <Input 
                           placeholder='email'
                           value={email}
                           onChange={(e) => setEmail(e.target.value)}
                           onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                           />

                        <Tabs value={role} onValueChange={(v) => setRole(v as 'editor' | 'viewer')}>
                            <TabsList>
                                <TabsTrigger value='viewer' >Viewer</TabsTrigger>
                                <TabsTrigger  value='editor'>Editor</TabsTrigger>
                            </TabsList>
                                <TabsContent value="viewer">Доступ к просмотру задач</TabsContent>
                                <TabsContent value="editor">Доступ к просмотру, реадктированию, добавлению задач</TabsContent>
                        </Tabs>
                        <Button onClick={() => handleInvite()} variant={isInviting ? 'ghost' : 'default'}>{isInviting ? 'Отправка...' : 'Пригласить'}</Button>
                    </DialogContent>
                </Dialog>
                    
            </CommandGroup>
            )}
            
            </Command>
        </PopoverContent>
    </Popover>
  )
}

export default BoardMembers