'use client'

import AvatarUpload from '@/components/AvatarUpload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import styles from './ProfilePage.module.css'

const ProfilePage = () => {
    const router = useRouter()

    const {accessToken, user, fetchProfile, updateProfile, changePassword} = useAuthStore()
    
    const [displayName, setDisplayName] = useState('')
    const [avatar, setAvatar] = useState<string | null>('')
    const [oldPassword, setOldPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    useEffect(() => {
        if (!accessToken) router.push('/')
        else fetchProfile()
    }, [accessToken, router, fetchProfile])

    useEffect(() => {
        if(user) {
            
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setDisplayName(user.displayName ?? '')
            setAvatar(user.avatar)
        }
    }, [user])
    if (!user) return null
  return (
    <div className={styles.profilePage}>
        <div className={styles.profilePage_inner}>
            <h1>Личный кабинет</h1>
            <Button onClick={() => router.push('/')}>Назад</Button>
        </div>
        <div className={styles.data}>
            <h2>Профиль</h2>
            <p>{user.email}</p>
            <AvatarUpload value={avatar} onChange={setAvatar} fallbackLabel={displayName?.[0]?.toUpperCase() || user.email[0].toUpperCase()}/>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder='Имя'/>
            <Button disabled={!displayName} onClick={()=> updateProfile({displayName, avatar})}>Сохранить</Button>
        </div>
        <div className={styles.password}>
            <h2>Смена пароля</h2>
            <Input type='password' value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} placeholder='Текущий пароль'/>
            <Input type='password' value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder='Новый пароль'/>
            <Input type='password' value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder='Подтвердите новый пароль'/>
            <Button
            disabled={!oldPassword || newPassword.length < 6 || newPassword !== confirmPassword}
            onClick={async () => {
                const ok = await changePassword(oldPassword, newPassword)
                if (ok) {
                    setOldPassword('')
                    setNewPassword('')
                    setConfirmPassword('')
                }
            }}
            >
                Изменить пароль
            </Button>
        </div>
    </div>
  )
}

export default ProfilePage