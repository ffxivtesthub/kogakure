import { useCallback, useEffect, useMemo, useState } from 'react'
import { Search, UsersRound, Info } from 'lucide-react'
import type { Staff } from '../types'
import StaffCard from '../components/StaffCard'
import StaffDialog from '../components/StaffDialog'
import { demoStaff } from '../data/demo'
import { configured } from '../lib/config'
export default function StaffPage(){
 const [staff,setStaff]=useState<Staff[]>(configured?[]:demoStaff)
 const [loading,setLoading]=useState(configured)
 const [error,setError]=useState('')
 const [query,setQuery]=useState('')
 const [filter,setFilter]=useState('全部')
 const [opened,setOpened]=useState<Staff|null>(null)
 const close=useCallback(()=>setOpened(null),[])
 useEffect(()=>{if(!configured)return;let mounted=true;import('../lib/staff').then(({getStaff})=>getStaff()).then(rows=>{if(mounted)setStaff(rows)}).catch(e=>{if(mounted)setError('無法載入員工資料：'+e.message)}).finally(()=>{if(mounted)setLoading(false)});return()=>{mounted=false}},[])
 const categories=useMemo(()=>['全部',...Array.from(new Set(staff.flatMap(x=>x.services)))],[staff])
 const visible=useMemo(()=>staff.filter(s=>(filter==='全部'||s.services.includes(filter))&&[s.name,s.role,s.tagline,...s.services].join(' ').toLocaleLowerCase().includes(query.toLocaleLowerCase())),[staff,query,filter])
 return <>
  <section className="staff-hero">
   <div className="hero-decoration" aria-hidden="true">狐</div>
   <div className="hero-inner">
    <p className="eyebrow"><span className="eyebrow-line"/> THE PEOPLE OF KOGAKURE <span className="eyebrow-line"/></p>
    <div className="hero-title-row"><span className="small-flower">✿</span><h1>狐隱名帖</h1><span className="small-flower">✿</span></div>
    <p className="hero-japanese">人 員 紹 介</p>
    <div className="gold-rule"><span>◇</span></div>
    <p className="hero-description">循狐火而來，與狐隱之人相遇。<br/>每一次邂逅，都是一段未完的故事。</p>
   </div>
  </section>
  <section className="staff-section container" aria-label="員工名錄">
   <div className="section-header"><div><span className="eyebrow">OUR CAST</span><h2>今宵的接待者 <span className="section-count">{String(staff.length).padStart(2,'0')}</span></h2><p>在這盞暖燈下，認識陪你度過夜晚的人。</p></div><div className="section-crest">◈</div></div>
   <div className="staff-toolbar">
    <div className="filter-list" role="group" aria-label="依服務篩選">{categories.map(item=><button key={item} type="button" className={item===filter?'selected':''} onClick={()=>setFilter(item)}>{item}</button>)}</div>
    <label className="staff-search"><Search size={18}/><span className="sr-only">搜尋員工</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="搜尋姓名或服務..." /></label>
   </div>
   {!configured&&<p className="preview-note"><Info size={16}/>目前為展示資料，完成 Supabase 設定後會自動改由後台讀取。</p>}
   {error&&<p className="error-message" role="alert">{error}</p>}
   {loading?<p className="empty-staff">正在讀取狐隱名帖…</p>:visible.length?
    <div className="staff-grid">{visible.map((person,index)=><StaffCard key={person.id} staff={person} index={index} onOpen={setOpened}/>)}</div>:
    <div className="empty-staff"><UsersRound size={28}/><h3>暫無符合條件的人員</h3><p>試著切換其他分類或搜尋條件。</p><button type="button" onClick={()=>{setFilter('全部');setQuery('')}}>清除篩選</button></div>}
   <div className="bottom-quote"><span>✧</span> 願每位旅人，都能在此尋得一夜安寧。 <span>✧</span></div>
  </section>
  {opened&&<StaffDialog staff={opened} onClose={close}/>}
 </>
}
