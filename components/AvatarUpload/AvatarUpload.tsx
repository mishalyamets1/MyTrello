'use client'

import React, { useRef } from 'react'
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar'
import {Button} from '../ui/button'
import { toast } from 'sonner'
import styles from './AvatarUpload.module.css'
export type Props = {
    value: string | null
    onChange: (value: string | null) => void
    fallbackLabel?: string
}

const MAX_SIZE = 2 * 1024 * 1024

const AvatarUpload = ({value, onChange, fallbackLabel = '+'}: Props) => {
    const inputRef = useRef<HTMLInputElement>(null)

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) return toast.error('Добавлено не фото')
        if (file.size > MAX_SIZE) return toast.error('До 2МБ')

        const reader = new FileReader()
        reader.onload = () => onChange(reader.result as string)
        reader.readAsDataURL(file)

        e.target.value = ''
    }
  return (
    <div className={styles.avatar}>
        <button className={styles.avatarBtn} onClick={() => inputRef.current?.click()}>
            <Avatar size='lg'>
                {value && <AvatarImage src={value}/>}
                <AvatarFallback>{fallbackLabel}</AvatarFallback>
            </Avatar>
        </button>

        <input ref={inputRef} type="file" accept='image/*' hidden onChange={handleFile}></input>
        {value && <Button onClick={() => onChange(null)} variant='destructive'>Удалить</Button>}
    </div>
  )
}

export default AvatarUpload