import React from 'react'
import styles from './Header.module.css'
import Image from 'next/image'
import { Input } from '../ui/input'
import { Avatar } from '../ui/avatar'
import { Button } from '../ui/button'

const Header = () => {
  return (
    <div className={styles.header_wrapper}>
        <div className={styles.header_logo}>
            <Image src="/logo.svg" alt="logo" width={32} height={32} />
            <span className={styles.header_title}>MyTrello</span>
        </div>
        <div className={styles.header_board}>
            <div>Board name</div>
        </div>
        <div className={styles.header_search}>
            <Input placeholder='Search boards'></Input>
        </div>
        <div className={styles.header_user}>
            <Avatar></Avatar>
            <Button variant="default">Sign in</Button>
        </div>
    </div>
  )
}

export default Header