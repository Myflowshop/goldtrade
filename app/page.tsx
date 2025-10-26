// Gold Trade Journal — TailLead-style app (flat pastel, full pages, NO realtime XAU)
'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Legend } from 'recharts'
import { LayoutDashboard, BarChart3, Clock, Settings, TrendingUp, DollarSign, PieChart, Activity, Upload, Download, Trash2 } from 'lucide-react'

const LS_TRADES = 'gold_trade_data_v7'
const LS_SETTINGS = 'gold_trade_settings_v5'

// Types
type TradeRow = {
  id: string
  dateISO: string
  dateLabel: string
  timeLabel: string
  buy: number
  sell: number
  profit: number
  profitThb: number
  fx: number | null
  note: string
  tag: string
}

type Settings = { startingBalanceUSD: number }

// Utils
const cls = (...xs: Array<string | false | undefined | null>) => xs.filter(Boolean).join(' ')
const fmtPL = (n: number) => (n>0?'+':'') + n.toFixed(2)
function pad(n:number){ return String(n).padStart(2,'0') }
function toISOFromDateTime(dateStr: string, timeStr: string){ try{ const [y,m,d]=dateStr.split('-').map(Number); const [hh,mm]=timeStr.split(':').map(Number); return new Date(y,(m||1)-1,d||1,hh||12,mm||0,0).toISOString() }catch{ return new Date().toISOString() } }
function formatThaiDate(iso:string){ return new Date(iso).toLocaleDateString('th-TH',{year:'numeric',month:'2-digit',day:'2-digit'}) }
function formatThaiTime(iso:string){ return new Date(iso).toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'}) }

export default function Home(): JSX.Element {
  // FX only (no XAU realtime)
  const [usdThb,setUsdThb]=useState<number|null>(null)

  const today=(()=>{const d=new Date();return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`})()
  const nowTime=(()=>{const d=new Date();return d.toTimeString().slice(0,5)})()

  // settings
  const [settings,setSettings]=useState<Settings>({startingBalanceUSD: 1000})

  // form
  const [buyDate,setBuyDate]=useState(today)
  const [buyTime,setBuyTime]=useState(nowTime)
  const [buy,setBuy]=useState('')
  const [sell,setSell]=useState('')
  const [note,setNote]=useState('')
  const [tag,setTag]=useState('ทั่วไป')

  // data
  const [trades,setTrades]=useState<TradeRow[]>([])

  // filters & ui
  const [fromDate,setFromDate]=useState('')
  const [toDate,setToDate]=useState('')
  const [showN,setShowN]=useState(20)
  const [tab,setTab]=useState<'dashboard'|'charts'|'history'|'settings'>('dashboard')

  // load & persist
  useEffect(()=>{try{const raw=localStorage.getItem(LS_TRADES);if(raw)setTrades(JSON.parse(raw))}catch{}},[])
  useEffect(()=>{try{localStorage.setItem(LS_TRADES,JSON.stringify(trades))}catch{}},[trades])
  useEffect(()=>{try{const raw=localStorage.getItem(LS_SETTINGS);if(raw)setSettings(JSON.parse(raw))}catch{}},[])
  useEffect(()=>{try{localStorage.setItem(LS_SETTINGS,JSON.stringify(settings))}catch{}},[settings])

  // FX
  useEffect(()=>{fetchRate()},[])
  async function fetchRate(){ try{ const r=await fetch('https://api.frankfurter.app/latest?from=USD&to=THB'); const j=await r.json(); if(typeof j?.rates?.THB==='number') setUsdThb(j.rates.THB) }catch{} }

  // add/remove
  function addTrade(){
    const b=Number(buy); const s=Number(sell)
    if(!b||!s){ alert('กรอกข้อมูลให้ครบ'); return }
    const p=s-b
    const fx=usdThb??null
    const pthb=fx? p*fx : 0
    const iso=toISOFromDateTime(buyDate,buyTime)
    const row:TradeRow={ id:Math.random().toString(36).slice(2), dateISO:iso, dateLabel:formatThaiDate(iso), timeLabel:formatThaiTime(iso), buy:b, sell:s, profit:p, profitThb:pthb, fx, note, tag }
    setTrades(prev=>[row,...prev].sort((a,b)=>a.dateISO<b.dateISO?1:-1))
    setBuy(''); setSell(''); setNote('')
  }
  function removeTrade(id:string){ setTrades(prev=>prev.filter(t=>t.id!==id)) }

  // Export / Import
  function exportData(){ try{ const payload={trades,settings}; const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='gold_trades_with_settings.json'; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000) }catch{ alert('ไม่สามารถส่งออกข้อมูลได้') } }
  function importData(e: React.ChangeEvent<HTMLInputElement>){ const f=e.target.files?.[0]; if(!f) return; const reader=new FileReader(); reader.onload=ev=>{ try{ const data=JSON.parse(String(ev.target?.result)); if(Array.isArray(data)){ setTrades(data) } else if(data&&typeof data==='object'){ if(Array.isArray(data.trades)) setTrades(data.trades as TradeRow[]); if(data.settings&&typeof data.settings==='object'){ const s=data.settings as Partial<Settings>; setSettings(p=>({startingBalanceUSD: typeof s.startingBalanceUSD==='number'? s.startingBalanceUSD:p.startingBalanceUSD})) } } else { alert('รูปแบบไฟล์ไม่ถูกต้อง') } } catch { alert('อ่านไฟล์ไม่สำเร็จ') } finally { e.target.value='' } }; reader.readAsText(f) }

  // filtering & computed
  const filtered=useMemo(()=>{ let rows=[...trades]; if(fromDate) rows=rows.filter(r=>r.dateISO>=new Date(fromDate).toISOString()); if(toDate) rows=rows.filter(r=>r.dateISO<=new Date(toDate+'T23:59').toISOString()); return rows },[trades,fromDate,toDate])
  const visible = useMemo(()=> filtered.slice(0,showN), [filtered,showN])
  const canLoadMore = visible.length < filtered.length

    const stats = useMemo(()=>{
    const rows=filtered;
    const count=rows.length;
    const wins=rows.filter(t=>t.profit>0);
    const losses=rows.filter(t=>t.profit<0);
    const w=wins.length;
    const l=losses.length;

    const grossProfit = wins.reduce((a,t)=>a+t.profit,0);
    const grossLoss = losses.reduce((a,t)=>a+t.profit,0); // This will be a negative number

    const netUSD=grossProfit + grossLoss;
    const netTHB=rows.reduce((a,t)=>a+t.profitThb,0);

    const avgWin=w?grossProfit/w:0;
    const avgLose=l?grossLoss/l:0;
    const winRate=count?Math.round(w*100/count):0;
    const avgTrade=count?netUSD/count:0;
    const profitFactor=grossLoss===0? (grossProfit>0?Infinity:0) : (grossProfit / Math.abs(grossLoss));
    const largestWin=w?Math.max(...wins.map(t=>t.profit)):0;
    const largestLoss=l?Math.min(...losses.map(t=>t.profit)):0;

    // Max Drawdown Calculation
    const sortedTrades = [...rows].sort((a,b)=>a.dateISO<b.dateISO?-1:1); // Sort by date ascending
    let peak = settings.startingBalanceUSD;
    let maxDrawdown = 0;
    let currentBalance = settings.startingBalanceUSD;
    for(const trade of sortedTrades){
      currentBalance += trade.profit;
      if(currentBalance > peak){
        peak = currentBalance;
      }
      const drawdown = peak - currentBalance;
      if(drawdown > maxDrawdown){
        maxDrawdown = drawdown;
      }
    }

    return {count,w,l,netUSD,netTHB,avgWin,avgLose,winRate,
      grossProfit, grossLoss, avgTrade, profitFactor, largestWin, largestLoss, maxDrawdown
    }
  },[filtered, settings.startingBalanceUSD])

  const currentBalanceUSD=settings.startingBalanceUSD+stats.netUSD
  const currentBalanceTHB=usdThb?currentBalanceUSD*(usdThb||0):0

  // charts data
  const equityData=useMemo(()=>{ const arr=[...filtered].sort((a,b)=>a.dateISO<b.dateISO?-1:1); let eq=0; return arr.map((t,i)=>{ eq+=t.profit; return { idx:i+1, pl:t.profit, eq } }) },[filtered])
  const monthlySummary=useMemo(()=>{ const map=new Map<string,number>(); filtered.forEach(t=>{ const d=new Date(t.dateISO); const key=`${d.getFullYear()}-${pad(d.getMonth()+1)}`; map.set(key,(map.get(key)||0)+t.profit) }); return Array.from(map.entries()).sort((a,b)=>a[0]<b[0]?-1:1).map(([month,pl])=>({month,pl})) },[filtered])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r flex flex-col">
        <div className="h-14 flex items-center px-4 text-lg font-bold text-violet-600">GoldJournal</div>
        <nav className="flex-1 space-y-1 px-3">
          <MenuItem active={tab==='dashboard'} icon={<LayoutDashboard size={18}/>} label="Dashboard" onClick={()=>setTab('dashboard')} />
          <MenuItem active={tab==='charts'} icon={<BarChart3 size={18}/>} label="Charts" onClick={()=>setTab('charts')} />
          <MenuItem active={tab==='history'} icon={<Clock size={18}/>} label="History" onClick={()=>setTab('history')} />
          <MenuItem active={tab==='settings'} icon={<Settings size={18}/>} label="Settings" onClick={()=>setTab('settings')} />
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* DASHBOARD */}
        {tab==='dashboard' && (
          <>
            {/* Quick Overview - 4 flat cards */}
            <section>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <FlatCard color="bg-rose-100" icon={<DollarSign className="text-rose-500" />} value={`${currentBalanceUSD.toFixed(2)} USD`} label="Total Balance" sub={usdThb? `${currentBalanceTHB.toFixed(2)} THB`:'— THB'} />
                <FlatCard color="bg-emerald-100" icon={<TrendingUp className="text-emerald-500" />} value={fmtPL(stats.netUSD)} label="Net Profit (USD)" sub={fmtPL(stats.netTHB)} />
                <FlatCard color="bg-blue-100" icon={<Activity className="text-blue-500" />} value={`${stats.winRate}%`} label="Win Rate" sub={`${stats.w} ชนะ / ${stats.l} แพ้`} />
                <FlatCard color="bg-amber-100" icon={<PieChart className="text-amber-500" />} value={stats.count} label="Total Trades" sub="จำนวนรายการ" />
                <FlatCard color="bg-purple-100" icon={<Activity className="text-purple-500" />} value={`${stats.maxDrawdown.toFixed(2)} USD`} label="Max Drawdown" sub="การขาดทุนสูงสุดจากยอดสูงสุด" />
                <FlatCard color="bg-orange-100" icon={<TrendingUp className="text-orange-500" />} value={Number.isFinite(stats.profitFactor)?stats.profitFactor.toFixed(2):'Inf'} label="Profit Factor" sub="กำไรขั้นต้น / ขาดทุนขั้นต้น" />
                <FlatCard color="bg-cyan-100" icon={<DollarSign className="text-cyan-500" />} value={stats.avgTrade.toFixed(2)} label="Avg. Trade (USD)" sub="กำไร/ขาดทุนเฉลี่ยต่อรายการ" />
              </div>
            </section>

            {/* Add Trade */}
            <section className="bg-white border rounded-lg p-4">
              <h3 className="font-medium mb-3">สถิติโดยละเอียด</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
                <StatItem label="กำไรขั้นต้น (Gross Profit)" value={stats.grossProfit.toFixed(2)} color="text-emerald-600" />
                <StatItem label="ขาดทุนขั้นต้น (Gross Loss)" value={stats.grossLoss.toFixed(2)} color="text-red-600" />
                <StatItem label="ชนะสูงสุด (Largest Win)" value={stats.largestWin.toFixed(2)} color="text-emerald-600" />
                <StatItem label="แพ้สูงสุด (Largest Loss)" value={stats.largestLoss.toFixed(2)} color="text-red-600" />
                <StatItem label="Avg. Win" value={stats.avgWin.toFixed(2)} color="text-emerald-600" />
                <StatItem label="Avg. Loss" value={stats.avgLose.toFixed(2)} color="text-red-600" />
                <StatItem label="Ratio (Avg Win/Loss)" value={stats.avgLose===0?'Inf':(Math.abs(stats.avgWin/stats.avgLose)).toFixed(2)} color="text-blue-600" />
                <StatItem label="Expectancy" value={(stats.winRate/100*stats.avgWin + (1-stats.winRate/100)*stats.avgLose).toFixed(2)} color="text-violet-600" />
              </div>
            </section>

            <section className="bg-white border rounded-lg p-4">
              <h3 className="font-medium mb-3">เพิ่มรายการเทรด</h3>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                <input type="date" value={buyDate} onChange={e=>setBuyDate(e.target.value)} className="h-10 border rounded-md px-3" />
                <input type="time" value={buyTime} onChange={e=>setBuyTime(e.target.value)} className="h-10 border rounded-md px-3" />
                <input type="number" placeholder="ราคาซื้อ (USD)" value={buy} onChange={e=>setBuy(e.target.value)} className="h-10 border rounded-md px-3" />
                <input type="number" placeholder="ราคาขาย (USD)" value={sell} onChange={e=>setSell(e.target.value)} className="h-10 border rounded-md px-3" />
                <input type="text" placeholder="แท็ก (เช่น อินทราเดย์)" value={tag} onChange={e=>setTag(e.target.value)} className="h-10 border rounded-md px-3" />
                <button onClick={addTrade} className="h-10 bg-violet-600 hover:bg-violet-700 text-white rounded-md">บันทึก</button>
              </div>
              <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="โน้ต / เหตุผลเข้าออก" className="w-full mt-3 min-h-[72px] border rounded-md px-3 py-2"></textarea>
            </section>

            {/* Charts preview */}
            <section className="grid md:grid-cols-2 gap-4">
              <ChartBox title="Equity Curve" color="bg-green-100">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={equityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="idx" /><YAxis /><Tooltip /><Legend />
                    <Line type="monotone" dataKey="eq" stroke="#10b981" strokeWidth={2}/>
                  </LineChart>
                </ResponsiveContainer>
              </ChartBox>
              <ChartBox title="P/L ต่อรายการ" color="bg-rose-100">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={equityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="idx" /><YAxis /><Tooltip /><Legend />
                    <Bar dataKey="pl" fill="#f43f5e" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartBox>
            </section>
          </>
        )}

        {/* CHARTS */}
        {tab==='charts' && (
          <section className="grid lg:grid-cols-2 gap-4">
            <ChartBox title="Equity Curve" color="bg-green-100">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={equityData} margin={{left:8,right:8,top:8,bottom:8}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="idx" /><YAxis /><Tooltip /><Legend />
                  <Line type="monotone" dataKey="eq" name="Equity" stroke="#10b981" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartBox>
            <ChartBox title="P/L ต่อรายการ" color="bg-rose-100">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={equityData} margin={{left:8,right:8,top:8,bottom:8}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="idx" /><YAxis /><Tooltip /><Legend />
                  <Bar dataKey="pl" name="P/L" fill="#f43f5e" />
                </BarChart>
              </ResponsiveContainer>
            </ChartBox>
            <ChartBox title="สรุปรายเดือน" color="bg-blue-100">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlySummary} margin={{left:8,right:8,top:8,bottom:8}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" /><YAxis /><Tooltip /><Legend />
                  <Bar dataKey="pl" name="Net P/L" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </ChartBox>
          </section>
        )}

        {/* HISTORY */}
        {tab==='history' && (
                      <section className="bg-white border rounded-lg p-4">
              <h3 className="font-medium mb-3">สถิติโดยละเอียด</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
                <StatItem label="กำไรขั้นต้น (Gross Profit)" value={stats.grossProfit.toFixed(2)} color="text-emerald-600" />
                <StatItem label="ขาดทุนขั้นต้น (Gross Loss)" value={stats.grossLoss.toFixed(2)} color="text-red-600" />
                <StatItem label="ชนะสูงสุด (Largest Win)" value={stats.largestWin.toFixed(2)} color="text-emerald-600" />
                <StatItem label="แพ้สูงสุด (Largest Loss)" value={stats.largestLoss.toFixed(2)} color="text-red-600" />
                <StatItem label="Avg. Win" value={stats.avgWin.toFixed(2)} color="text-emerald-600" />
                <StatItem label="Avg. Loss" value={stats.avgLose.toFixed(2)} color="text-red-600" />
                <StatItem label="Ratio (Avg Win/Loss)" value={stats.avgLose===0?'Inf':(Math.abs(stats.avgWin/stats.avgLose)).toFixed(2)} color="text-blue-600" />
                <StatItem label="Expectancy" value={(stats.winRate/100*stats.avgWin + (1-stats.winRate/100)*stats.avgLose).toFixed(2)} color="text-violet-600" />
              </div>
            </section>

            <section className="bg-white border rounded-lg p-4">
            <div className="flex flex-wrap gap-2 items-center mb-3">
              <h2 className="font-medium mr-auto">ประวัติ ({filtered.length})</h2>
              <div className="flex items-center gap-2">
                <input type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)} className="h-9 border rounded-md px-2"/>
                <span className="text-slate-400">—</span>
                <input type="date" value={toDate} onChange={e=>setToDate(e.target.value)} className="h-9 border rounded-md px-2"/>
              </div>
              <button onClick={exportData} className="h-9 px-3 rounded-md border hover:bg-slate-50 flex items-center gap-2"><Download size={16}/> Export</button>
              <label className="h-9 px-3 rounded-md border hover:bg-slate-50 cursor-pointer flex items-center gap-2"><Upload size={16}/> Import<input type="file" onChange={importData} className="hidden"/></label>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-2 text-left">วันที่</th>
                  <th className="p-2 text-left">เวลา</th>
                  <th className="p-2 text-left">ซื้อ</th>
                  <th className="p-2 text-left">ขาย</th>
                  <th className="p-2 text-left">กำไร (USD)</th>
                  <th className="p-2 text-left">กำไร (THB)</th>
                  <th className="p-2 text-left">โน้ต</th>
                  <th className="p-2 text-left">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {visible.length===0 && (<tr><td colSpan={8} className="text-center text-slate-500 p-3">ยังไม่มีข้อมูล</td></tr>)}
                {visible.map(t=> (
                  <tr key={t.id} className="border-t hover:bg-slate-50">
                    <td className="p-2 whitespace-nowrap">{t.dateLabel}</td>
                    <td className="p-2 whitespace-nowrap">{t.timeLabel}</td>
                    <td className="p-2">{t.buy.toFixed(2)}</td>
                    <td className="p-2">{t.sell.toFixed(2)}</td>
                    <td className={cls('p-2 font-medium', t.profit>=0?'text-emerald-600':'text-red-600')}>{t.profit.toFixed(2)}</td>
                    <td className={cls('p-2 font-medium', t.profitThb>=0?'text-emerald-600':'text-red-600')}>
                      {t.profitThb.toFixed(2)}
                      <div className="text-[11px] text-slate-500">FX: {typeof t.fx==='number'? t.fx.toFixed(2) : (usdThb? `~${usdThb.toFixed(2)}` : '—')}</div>
                    </td>
                    <td className="p-2 text-xs max-w-[240px] truncate" title={t.note}>{t.note}</td>
                    <td className="p-2"><button onClick={()=>removeTrade(t.id)} className="h-8 px-3 border rounded-md hover:bg-slate-50 inline-flex items-center gap-1"><Trash2 size={14}/> ลบ</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {canLoadMore && (<div className="pt-3 flex justify-center"><button onClick={()=>setShowN(n=>n+20)} className="h-9 px-3 border rounded-md hover:bg-slate-50">แสดงเพิ่มอีก 20</button></div>)}
          </section>
        )}

        {/* SETTINGS */}
        {tab==='settings' && (
          <section className="bg-white border rounded-lg p-4 space-y-4">
            <div className="text-lg font-medium">Settings</div>
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="text-sm">
                <div className="text-slate-600 mb-1">Starting Balance (USD)</div>
                <input type="number" value={settings.startingBalanceUSD} onChange={e=>setSettings(s=>({...s, startingBalanceUSD:Number(e.target.value||0)}))} className="h-10 w-full border rounded-md px-3"/>
              </label>
              <div className="text-sm">
                <div className="text-slate-600 mb-1">อัตราแลกเปลี่ยน USD/THB</div>
                <div className="flex items-center gap-2">
                  <div className="h-10 flex items-center px-3 rounded-md border bg-slate-50">{usdThb? usdThb.toFixed(2) : '—'}</div>
                  <button onClick={fetchRate} className="h-10 px-3 rounded-md border hover:bg-slate-50">รีเฟรช</button>
                </div>
              </div>
            </div>
            <div className="pt-2 border-t">
              <div className="text-sm text-slate-600 mb-2">ข้อมูล</div>
              <div className="flex gap-2">
                <button onClick={exportData} className="h-9 px-3 rounded-md border hover:bg-slate-50 flex items-center gap-2"><Download size={16}/> Export</button>
                <label className="h-9 px-3 rounded-md border hover:bg-slate-50 cursor-pointer flex items-center gap-2"><Upload size={16}/> Import<input type="file" onChange={importData} className="hidden"/></label>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

// UI bits
function MenuItem({active,icon,label,onClick}:{active:boolean,icon:React.ReactNode,label:string,onClick:()=>void}){
  return (
    <button onClick={onClick} className={cls('w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition', active?'bg-violet-600 text-white':'text-slate-700 hover:bg-slate-100')}>
      {icon}<span>{label}</span>
    </button>
  )
}

function FlatCard({color,icon,value,label,sub}:{color:string,icon:React.ReactNode,value:string|number,label:string,sub?:string}){
  return (
    <div className={cls('p-4 rounded-lg', color)}>
      <div className="flex justify-between items-start">
        <div>
          <div className="text-2xl font-semibold">{value}</div>
          <div className="text-sm text-slate-700">{label}</div>
          {sub && <div className="text-xs text-slate-600 mt-1">{sub}</div>}
        </div>
        <div className="h-10 w-10 rounded-full bg-white grid place-items-center">{icon}</div>
      </div>
    </div>
  )
}

function StatItem({label,value,color}:{label:string,value:string,color:string}){
  return (
    <div className="flex flex-col">
      <div className="text-slate-500">{label}</div>
      <div className={cls("font-semibold text-lg", color)}>{value}</div>
    </div>
  )
}

function StatItem({label,value,color}:{label:string,value:string,color:string}){
  return (
    <div className="flex flex-col">
      <div className="text-slate-500">{label}</div>
      <div className={cls("font-semibold text-lg", color)}>{value}</div>
    </div>
  )
}

function ChartBox({title,color,children}:{title:string,color:string,children:React.ReactNode}){
  return (
    <div className={cls('rounded-lg p-4', color)}>
      <div className="font-medium mb-2">{title}</div>
      <div className="h-[240px]">{children}</div>
    </div>
  )
}
