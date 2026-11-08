import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu, X, AtSign, ArrowUpRight } from 'lucide-react'
import { asset } from '../lib/paths'
const links=[['/','首頁'],['/about','館內介紹'],['/services','服務內容'],['/staff','人員介紹'],['/shifts','值班排班'],['/menu','點菜'],['/booking','預約']]
export default function Layout({children}:{children:React.ReactNode}){
 const [menuOpen,setMenuOpen]=useState(false)
 const loc=useLocation()
 return <div className="site">
  <header className="site-header">
   <div className="header-inner">
    <Link to="/" className="brand" onClick={()=>setMenuOpen(false)} aria-label="狐隱首頁">
     <img src={asset('images/logo-mark-small.webp')} alt="" width="44" height="44"/>
     <span><strong>狐隱</strong><small>KOGAKURE</small></span>
    </Link>
    <nav className="desktop-nav" aria-label="主要導覽">{links.map(([to,label])=><NavLink key={to} to={to} end={to==='/'} className={({isActive})=>isActive?'active':''}>{label}</NavLink>)}</nav>
    <a className="social-header" target="_blank" rel="noopener noreferrer" href="https://www.threads.com/@kogakure_ffxiv" aria-label="狐隱 Threads"><AtSign size={19}/></a>
    <button className="mobile-menu-button" type="button" onClick={()=>setMenuOpen(v=>!v)} aria-label={menuOpen?'關閉導覽':'開啟導覽'} aria-expanded={menuOpen}>{menuOpen?<X/>:<Menu/>}</button>
   </div>
   {menuOpen&&<nav className="mobile-nav" aria-label="手機導覽">{links.map(([to,label],index)=><NavLink key={to} to={to} onClick={()=>setMenuOpen(false)} className={loc.pathname===to?'active':''}><span>{String(index+1).padStart(2,'0')}</span>{label}</NavLink>)}</nav>}
  </header>
  <main>{children}</main>
  <footer className="site-footer">
   <div className="footer-inner">
    <div><div className="footer-brand">狐隱 <span>KOGAKURE</span></div><p>世有百鬼，夜有萬境。循狐而入，借湯忘憂。</p></div>
    <div className="footer-side"><span>FFXIV · 利維坦 · 白銀鄉 6-7</span><a href="https://www.threads.com/@kogakure_ffxiv" target="_blank" rel="noopener noreferrer">官方 Threads <ArrowUpRight size={15}/></a></div>
   </div>
   <div className="copyright">本網站為 Final Fantasy XIV 玩家 RP 店鋪非官方網站。</div>
  </footer>
 </div>
}
