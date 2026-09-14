import './globals.css'
import React from 'react'
import AdminGate from './AdminGate'
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body><AdminGate>{children}</AdminGate></body></html>}
