'use client'
import React, { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import AvatarUpload from '@/components/AvatarUpload'
import styles from './page.module.css'
import { useRouter } from 'next/navigation'

const AuthPage = () => {
    const {login, register, token} = useAuthStore()

    const router = useRouter()
    
    useEffect(() => {
        if (token) { 
            router.push('/')
        }
    }, [router, token])
    

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [mode, setMode] = useState<'login' | 'register'>('login')
    const [displayName, setDisplayName] = useState('')
    const [avatar, setAvatar] = useState<string | null>('')
    

    const handleSubmit = async () => {
        if (mode === 'login') {
            await login(email, password)
        } else {
            await register(email, password, displayName, avatar)
        }
    }

  return (
    <div className={styles.authPage}>
      <div className={styles.authForm}>
        <h1>Welcome</h1>
        {mode === 'register' && (
          <>
            <div className={styles.avatar}>
            <AvatarUpload value={avatar} onChange={setAvatar} fallbackLabel={displayName?.[0]?.toUpperCase() || '+'}/>
            </div>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder='Имя'
            />
            
          </>
        )}
        <Input value={email} onChange={e => setEmail(e.target.value)} placeholder='email'></Input>
        <Input value={password} onChange={e => setPassword(e.target.value)} placeholder='password'></Input>
        <Button className={styles.authButton} onClick={handleSubmit}>{mode === 'login' ? 'Login' : 'Register'}</Button>
        <Button  variant='link' onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? 'No account? Register' : 'Have an account? Login'}
        </Button>
      </div>
    </div>
  )
}

export default AuthPage