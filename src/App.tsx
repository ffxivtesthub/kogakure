import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import EntryIntro from './components/EntryIntro'
import { HomePage, OtherPage } from './pages/OtherPages'
const AdminPage=lazy(()=>import('./pages/AdminPage'))
const StaffPage=lazy(()=>import('./pages/StaffPage'))
export default function App(){return <><Layout><Suspense fallback={<div className="empty-staff">正在載入頁面…</div>}><Routes>
 <Route path="/" element={<HomePage/>}/>
 <Route path="/staff" element={<StaffPage/>}/>
 <Route path="/admin" element={<AdminPage/>}/>
 <Route path="*" element={<OtherPage/>}/>
 </Routes></Suspense></Layout><EntryIntro/></>}
