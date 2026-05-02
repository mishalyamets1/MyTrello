'use client'

import React, { useState } from 'react'
import { Card } from '../ui/card'
import styles from './InBox.module.css'
import Image from 'next/image'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
const InBox = () => {

    const [isOpen, setIsOpen] = useState(false)
    const [inputValue, setInputValue] = useState('')

    

  return (
    <div className={styles.inBox}>
        <Card className="border border-border ring-0" id='card'>
            <div className={styles.inBox_header}>
                <div className={styles.inBox_headerLogo}>
                    <Image src="/inbox.svg" alt="inbox logo" width={16} height={16}></Image>
                    <div>InBox</div>
                </div>
                <div className={styles.inBox_headerBtn}>
                    <Button variant="default" size="sm">Edit</Button>
                    <Button variant="outline" size="sm">...</Button>
                </div>
            </div>
            <div className={styles.inBox_content}>
                <div className={styles.InBox_addItem}>
                    <Input
                     placeholder="Add a card"
                     value={inputValue}
                     onChange={(e) => setInputValue(e.target.value)}
                     onFocus={() => setIsOpen(true)}
                     onBlur={() => setIsOpen(false)}
                      />
                      {isOpen && (
                        <div className={styles.InBox_addItemBtns}>
                            <Button variant="default" >Добавить</Button>
                            <Button variant="outline" onClick={() => setIsOpen(false)}>Отмена</Button>
                        </div>
                      )}
                </div>
            </div>
        </Card>
    </div>
  )
}

export default InBox