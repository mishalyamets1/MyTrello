'use client'
import { useAuthStore } from "@/stores/authStore";
import MainPage from "./MainPage";
import AuthPage from './AuthPage'
import { useEffect, useState, useRef } from "react";
import Header from "@/components/header";

export default function Home() {
  const {token, fetchProfile} = useAuthStore()
  const mounted = useRef(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    if (mounted.current) return
    mounted.current = true
    setHydrated(true)
  }, [])
  useEffect(() => {
    if (token) fetchProfile()
  }, [token, fetchProfile])

  if (!hydrated) {
    return null
  }
  if (!token) {
    return <AuthPage/>
  }
  return (
    <>
      <Header></Header>
      <MainPage />
    </>
      
  );
}
