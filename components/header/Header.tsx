import React from 'react'
import styles from './Header.module.css'
import Image from 'next/image'
import { Input } from '../ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Button } from '../ui/button'
import { useAuthStore } from '@/stores/authStore'
import SelectBoards from '../SelectBoards'
import { useBoardStore } from '@/stores/boardStore'
import BoardMembers from '../BoardMembers'
import { useRouter } from 'next/navigation'

const Header = () => {
    const {logout, user} = useAuthStore()
    const {boards, currentBoardId } = useBoardStore()
    const router = useRouter()
    const current = boards.find((b) => b.id === currentBoardId)
    const fallback = user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'
  return (
    <div className={styles.header_wrapper}>
        <div className={styles.header_logo}>
            <Image src="/logo.svg" alt="logo" width={32} height={32} />
            <span className={styles.header_title}>MyTrello</span>
            
        </div>
        <div className={styles.header_board}>
            {current ? current.title : 'Нет досок'}
            <BoardMembers/>
        </div>
        <div className={styles.header_search}>
            {/* <Input placeholder='Search boards'></Input> */}
            <SelectBoards></SelectBoards>
        </div>
        <div className={styles.header_user}>
            <button>
            <Avatar onClick={() => router.push('/ProfilePage')}>
                {user?.avatar && <AvatarImage src={user.avatar} alt=""/>}
                <AvatarFallback>{fallback}</AvatarFallback>
            </Avatar>
            </button>
            
            <Button onClick={() => logout()} variant="default">Выйти</Button>
        </div>
    </div>
  )
}

export default Header