'use client'
import { useAuthStore } from "@/stores/authStore";
import MainPage from "./MainPage";
import AuthPage from './AuthPage'
import { useEffect, useState, useRef } from "react";
import Header from "@/components/header";

export default function Home() {
  const {accessToken, fetchProfile} = useAuthStore()
  const mounted = useRef(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    if (mounted.current) return
    mounted.current = true
    setHydrated(true)
  }, [])
  useEffect(() => {
    if (accessToken) fetchProfile()
  }, [accessToken, fetchProfile])

  if (!hydrated) {
    return null
  }
  if (!accessToken) {
    return <AuthPage/>
  }
  return (
    <>
      <Header></Header>
      <MainPage />
    </>
      
  );
}
