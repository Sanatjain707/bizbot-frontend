'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export default function LandingPage() {
  return (
    <div style={{ background: '#FBF7F0', minHeight: '100vh', color: '#1A1410' }}>
      <Nav />
      <Hero />
      <Problem />
      <LiveDemo />
      <Features />
      <HowItWorks />
      <WhoFor />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  )
}

function Nav() {
  return (
    <nav className="lp" style={{ position:'sticky', top:0, zIndex:50, background:'rgba(251,247,240,0.85)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(0,0,0,0.06)' }}>
      <div style={{ maxWidth:1100, margin:'0 auto', padding:'16px 24px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:32, height:32, borderRadius:9, background:'#0A8754', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🤖</div>
          <span className="display" style={{ fontSize:22, fontWeight:700 }}>BizBot</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <Link href="/login" style={{ padding:'9px 18px', fontSize:14, fontWeight:600 }}>Log in</Link>
          <Link href="/signup" style={{ padding:'9px 20px', fontSize:14, fontWeight:700, background:'#0A8754', color:'#fff', borderRadius:10 }}>Start free</Link>
        </div>
      </div>
    </nav>
  )
}

function Hero() {
  return (
    <section className="lp hero-grid" style={{ maxWidth:1100, margin:'0 auto', padding:'70px 24px 50px', display:'grid', gridTemplateColumns:'1.1fr 0.9fr', gap:50, alignItems:'center' }}>
      <div className="reveal">
        <div style={{ display:'inline-flex', alignItems:'center', gap:7, background:'#FFF1CC', color:'#9A6B00', padding:'6px 13px', borderRadius:20, fontSize:13, fontWeight:600, marginBottom:22 }}>
          <span>🇮🇳</span> Made for Indian businesses
        </div>
        <h1 className="display hero-h1" style={{ fontSize:54, lineHeight:1.05, fontWeight:700, letterSpacing:'-1px', marginBottom:20 }}>
          Your WhatsApp,<br/>answered <span style={{ color:'#0A8754' }}>24/7</span> by AI.
        </h1>
        <p style={{ fontSize:18, lineHeight:1.6, color:'#5C5248', marginBottom:30, maxWidth:440 }}>
          BizBot replies to customers, books appointments, and chases payments on WhatsApp — in Hindi, English, or Hinglish. Even while you sleep.
        </p>
        <div style={{ display:'flex', gap:12, marginBottom:18, flexWrap:'wrap' }}>
          <Link href="/signup" style={{ padding:'14px 28px', fontSize:16, fontWeight:700, background:'#0A8754', color:'#fff', borderRadius:12, boxShadow:'0 8px 24px rgba(10,135,84,0.25)' }}>Start 30-day free trial →</Link>
          <a href="#demo" style={{ padding:'14px 24px', fontSize:16, fontWeight:600, background:'#fff', border:'1.5px solid rgba(0,0,0,0.1)', borderRadius:12 }}>See it work</a>
        </div>
        <p style={{ fontSize:13, color:'#8A7E72' }}>✓ No credit card &nbsp; ✓ Set up in 15 minutes &nbsp; ✓ Cancel anytime</p>
      </div>
      <div className="reveal" style={{ animationDelay:'0.15s' }}>
        <PhoneMock />
      </div>
    </section>
  )
}

function PhoneMock() {
  const msgs = [
    { from:'cust', text:'Hello, facial ka kya rate hai?' },
    { from:'bot',  text:'Namaste! 🙏 Facial ₹800 ka hai. Book karna chahenge?' },
    { from:'cust', text:'Haan kal 4 baje' },
    { from:'bot',  text:'✅ Confirmed: Kal 4:00 PM, Facial. See you! 😊' },
  ]
  return (
    <div style={{ background:'#0A8754', borderRadius:32, padding:14, boxShadow:'0 24px 60px rgba(0,0,0,0.18)', maxWidth:320, margin:'0 auto' }}>
      <div style={{ background:'#E5DDD5', borderRadius:22, overflow:'hidden', minHeight:440 }}>
        <div style={{ background:'#0A8754', color:'#fff', padding:'14px 16px', display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:'50%', background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>🏪</div>
          <div><div style={{ fontWeight:700, fontSize:14 }}>Priya Beauty Parlour</div><div style={{ fontSize:11, opacity:0.85 }}>● online</div></div>
        </div>
        <div style={{ padding:16, display:'flex', flexDirection:'column', gap:10 }}>
          {msgs.map((m,i)=>(
            <div key={i} style={{ alignSelf: m.from==='bot'?'flex-end':'flex-start', maxWidth:'80%', background: m.from==='bot'?'#DCF8C6':'#fff', padding:'8px 12px', borderRadius:12, fontSize:13.5, lineHeight:1.4, boxShadow:'0 1px 1px rgba(0,0,0,0.08)', animation:`popIn 0.5s ease both`, animationDelay:`${0.4+i*0.5}s` }}>
              {m.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Problem() {
  return (
    <section className="lp" style={{ background:'#1A1410', color:'#FBF7F0', padding:'60px 24px' }}>
      <div style={{ maxWidth:900, margin:'0 auto', textAlign:'center' }}>
        <h2 className="display" style={{ fontSize:36, fontWeight:600, marginBottom:18, lineHeight:1.2 }}>
          Every missed WhatsApp is a <span style={{ color:'#FFD96B' }}>lost customer.</span>
        </h2>
        <p style={{ fontSize:17, color:'#B5ACA0', maxWidth:560, margin:'0 auto 40px', lineHeight:1.6 }}>
          Most Indian customers message businesses on WhatsApp. But owners are busy with clients, asleep, or just can't reply fast enough. So enquiries go cold.
        </p>
        <div className="feat-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20, maxWidth:680, margin:'0 auto' }}>
          {[['7 hrs','average reply delay for small businesses'],['40%','of enquiries never get any reply'],['→ 0','customers you ignore go to your competitor']].map(([n,l],i)=>(
            <div key={i} style={{ background:'rgba(255,255,255,0.05)', borderRadius:14, padding:'22px 16px' }}>
              <div className="display" style={{ fontSize:34, fontWeight:700, color:'#FFD96B', marginBottom:6 }}>{n}</div>
              <div style={{ fontSize:13, color:'#B5ACA0', lineHeight:1.4 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function LiveDemo() {
  const [messages, setMessages] = useState<any[]>([
    { from:'bot', text:'Namaste! 🙏 I\'m BizBot for a sample salon. Ask me anything — try "facial ka rate?" or "appointment book karni hai"' }
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(()=>{ endRef.current?.scrollIntoView({ behavior:'smooth' }) }, [messages, typing])

  async function send() {
    if (!input.trim() || typing) return
    const userMsg = input.trim()
    setInput('')
    setMessages(m => [...m, { from:'cust', text:userMsg }])
    setTyping(true)
    try {
      const res = await fetch(`${API}/api/demo/chat`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ message: userMsg, history: messages.slice(-6) })
      })
      const data = await res.json()
      setMessages(m => [...m, { from:'bot', text: data.reply || 'Namaste! Thoda issue aa gaya, dobara try karein 🙏' }])
    } catch {
      setMessages(m => [...m, { from:'bot', text:'Demo abhi busy hai — par real BizBot aapke business ke liye 24/7 ready rahega! 😊' }])
    }
    setTyping(false)
  }

  return (
    <section id="demo" className="lp" style={{ padding:'70px 24px', maxWidth:760, margin:'0 auto' }}>
      <div style={{ textAlign:'center', marginBottom:34 }}>
        <div style={{ display:'inline-block', background:'#FFF1CC', color:'#9A6B00', padding:'5px 13px', borderRadius:20, fontSize:13, fontWeight:600, marginBottom:14 }}>Try it live</div>
        <h2 className="display" style={{ fontSize:38, fontWeight:600, marginBottom:12 }}>Talk to BizBot right now</h2>
        <p style={{ fontSize:16, color:'#5C5248' }}>This is the real AI. Type like a customer would — in Hindi, English, or Hinglish.</p>
      </div>
      <div style={{ background:'#E5DDD5', borderRadius:20, overflow:'hidden', boxShadow:'0 16px 50px rgba(0,0,0,0.12)' }}>
        <div style={{ background:'#0A8754', color:'#fff', padding:'14px 18px', display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:'50%', background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>🤖</div>
          <div><div style={{ fontWeight:700, fontSize:15 }}>BizBot Demo</div><div style={{ fontSize:11, opacity:0.85 }}>● always online</div></div>
        </div>
        <div style={{ padding:18, minHeight:280, maxHeight:380, overflowY:'auto', display:'flex', flexDirection:'column', gap:10 }}>
          {messages.map((m,i)=>(
            <div key={i} style={{ alignSelf:m.from==='bot'?'flex-start':'flex-end', maxWidth:'78%', background:m.from==='bot'?'#fff':'#DCF8C6', padding:'9px 13px', borderRadius:12, fontSize:14, lineHeight:1.45, boxShadow:'0 1px 1px rgba(0,0,0,0.08)' }}>{m.text}</div>
          ))}
          {typing && <div style={{ alignSelf:'flex-start', background:'#fff', padding:'11px 14px', borderRadius:12, display:'flex', gap:4 }}>
            {[0,1,2].map(d=><span key={d} style={{ width:7, height:7, borderRadius:'50%', background:'#0A8754', animation:`typing 1.2s infinite`, animationDelay:`${d*0.2}s` }} />)}
          </div>}
          <div ref={endRef} />
        </div>
        <div style={{ padding:14, background:'#F0EBE4', display:'flex', gap:8 }}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Type a message…" style={{ flex:1, border:'none', borderRadius:22, padding:'11px 16px', fontSize:14, outline:'none', fontFamily:'inherit' }} />
          <button onClick={send} style={{ width:44, height:44, borderRadius:'50%', background:'#0A8754', color:'#fff', border:'none', cursor:'pointer', fontSize:18 }}>➤</button>
        </div>
      </div>
    </section>
  )
}

function Features() {
  const items = [
    ['💬','Replies instantly, 24/7','Never miss an enquiry again. BizBot answers in seconds, day or night, in your customer\'s language.'],
    ['📅','Books appointments','Customers pick a time over chat. It lands in your dashboard automatically — no double-booking.'],
    ['💰','Chases payments','Sends polite payment reminders with your UPI, so you stop awkwardly asking for money.'],
    ['❤️','Wins back customers','Spots customers who haven\'t visited in a while and gently invites them back.'],
    ['📊','One simple dashboard','See every chat, booking, and payment in one place. On your phone or laptop.'],
    ['🇮🇳','Speaks your language','Fluent Hindi, English, and Hinglish — sounds natural, never robotic.'],
  ]
  return (
    <section className="lp" style={{ padding:'70px 24px', maxWidth:1080, margin:'0 auto' }}>
      <h2 className="display" style={{ fontSize:38, fontWeight:600, textAlign:'center', marginBottom:12 }}>Everything a busy owner needs</h2>
      <p style={{ textAlign:'center', fontSize:16, color:'#5C5248', marginBottom:44 }}>One assistant that handles the repetitive work, so you handle the customers.</p>
      <div className="feat-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20 }}>
        {items.map(([icon,title,desc],i)=>(
          <div key={i} style={{ background:'#fff', borderRadius:18, padding:'26px 22px', border:'1px solid rgba(0,0,0,0.05)', boxShadow:'0 4px 16px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize:30, marginBottom:14 }}>{icon}</div>
            <h3 style={{ fontSize:17, fontWeight:700, marginBottom:8 }}>{title}</h3>
            <p style={{ fontSize:14, color:'#5C5248', lineHeight:1.55 }}>{desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function HowItWorks() {
  const steps = [
    ['Connect your WhatsApp','We link your business WhatsApp number to BizBot. Takes about 15 minutes — we do it with you.'],
    ['Tell it about your business','Your services, prices, and timings. BizBot learns them and starts answering like your best staff member.'],
    ['It handles your customers','From the first "hello" to a booked appointment and paid bill — automatically, while you work.'],
  ]
  return (
    <section className="lp" style={{ background:'#0A8754', color:'#fff', padding:'70px 24px' }}>
      <div style={{ maxWidth:920, margin:'0 auto' }}>
        <h2 className="display" style={{ fontSize:38, fontWeight:600, textAlign:'center', marginBottom:48 }}>Up and running in three steps</h2>
        <div className="steps-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:24 }}>
          {steps.map(([t,d],i)=>(
            <div key={i}>
              <div className="display" style={{ fontSize:48, fontWeight:700, color:'#FFD96B', marginBottom:10, opacity:0.9 }}>{i+1}</div>
              <h3 style={{ fontSize:18, fontWeight:700, marginBottom:10 }}>{t}</h3>
              <p style={{ fontSize:14.5, color:'rgba(255,255,255,0.82)', lineHeight:1.6 }}>{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function WhoFor() {
  const types = [['💇','Salons & Spas'],['📚','Coaching Centres'],['🧘','Yoga Studios'],['🏥','Clinics'],['💅','Beauty Parlours'],['🔧','Home Services']]
  return (
    <section className="lp" style={{ padding:'60px 24px', maxWidth:900, margin:'0 auto', textAlign:'center' }}>
      <h2 className="display" style={{ fontSize:32, fontWeight:600, marginBottom:36 }}>Built for businesses like yours</h2>
      <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', gap:14 }}>
        {types.map(([icon,name],i)=>(
          <div key={i} style={{ display:'flex', alignItems:'center', gap:10, background:'#fff', border:'1px solid rgba(0,0,0,0.06)', borderRadius:14, padding:'14px 22px', fontSize:15, fontWeight:600 }}>
            <span style={{ fontSize:22 }}>{icon}</span> {name}
          </div>
        ))}
      </div>
    </section>
  )
}

function Pricing() {
  const plans = [
    ['Starter','999',['200 AI conversations/month','Appointment booking','Automated reminders','1 WhatsApp number'],false],
    ['Growth','1,999',['1,000 conversations/month','Everything in Starter','Payment follow-ups','Win-back campaigns'],true],
    ['Pro','3,999',['Unlimited conversations','Everything in Growth','Multi-location','Priority support'],false],
  ]
  return (
    <section id="pricing" className="lp" style={{ padding:'70px 24px', maxWidth:1000, margin:'0 auto' }}>
      <h2 className="display" style={{ fontSize:38, fontWeight:600, textAlign:'center', marginBottom:10 }}>Simple, honest pricing</h2>
      <p style={{ textAlign:'center', fontSize:16, color:'#5C5248', marginBottom:14 }}>Start free for 30 days. No credit card. Cancel anytime.</p>
      <div style={{ textAlign:'center', marginBottom:40 }}>
        <span style={{ background:'#FFF1CC', color:'#9A6B00', padding:'6px 15px', borderRadius:20, fontSize:13.5, fontWeight:700 }}>🎁 First 10 businesses: ₹999 locked forever</span>
      </div>
      <div className="price-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20, alignItems:'start' }}>
        {plans.map(([name,price,feats,popular]:any,i)=>(
          <div key={i} style={{ background: popular?'#1A1410':'#fff', color: popular?'#fff':'#1A1410', borderRadius:20, padding:'30px 26px', border: popular?'none':'1px solid rgba(0,0,0,0.07)', boxShadow: popular?'0 16px 40px rgba(0,0,0,0.18)':'0 4px 16px rgba(0,0,0,0.04)', position:'relative' }}>
            {popular && <div style={{ position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)', background:'#FFD96B', color:'#1A1410', padding:'4px 14px', borderRadius:14, fontSize:12, fontWeight:700 }}>MOST POPULAR</div>}
            <h3 style={{ fontSize:18, fontWeight:700, marginBottom:6 }}>{name}</h3>
            <div style={{ marginBottom:20 }}><span className="display" style={{ fontSize:40, fontWeight:700 }}>₹{price}</span><span style={{ fontSize:14, opacity:0.6 }}>/month</span></div>
            <Link href="/signup" style={{ display:'block', textAlign:'center', padding:'12px', borderRadius:11, fontWeight:700, fontSize:15, marginBottom:22, background:'#0A8754', color:'#fff' }}>Start free trial</Link>
            <div style={{ display:'flex', flexDirection:'column', gap:11 }}>
              {feats.map((f:string,j:number)=>(
                <div key={j} style={{ display:'flex', gap:9, fontSize:14, alignItems:'flex-start' }}>
                  <span style={{ color:'#0A8754', fontWeight:700 }}>✓</span>
                  <span style={{ opacity: popular?0.85:0.75 }}>{f}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function FAQ() {
  const qs = [
    ['Do I need any technical skills?','None at all. We set everything up with you in about 15 minutes. After that, you just use a simple dashboard — as easy as WhatsApp itself.'],
    ['What if the AI says something wrong?','You stay in control. You can pause the AI on any chat and reply yourself, and you set exactly what services and prices it knows about.'],
    ['Is my WhatsApp and customer data safe?','Yes. BizBot uses the official WhatsApp Business API. Your data is private and never shared or sold.'],
    ['What happens after the free trial?','Nothing automatic — we never charge a card you didn\'t give us. After 30 days you choose a plan if BizBot is helping your business.'],
    ['Can it really understand Hinglish?','Absolutely. BizBot replies in whatever language your customer uses — pure Hindi, English, or the mix everyone actually types in.'],
  ]
  const [open, setOpen] = useState<number|null>(0)
  return (
    <section className="lp" style={{ padding:'70px 24px', maxWidth:740, margin:'0 auto' }}>
      <h2 className="display" style={{ fontSize:36, fontWeight:600, textAlign:'center', marginBottom:40 }}>Questions, answered</h2>
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {qs.map(([q,a],i)=>(
          <div key={i} onClick={()=>setOpen(open===i?null:i)} style={{ background:'#fff', borderRadius:14, padding:'18px 22px', border:'1px solid rgba(0,0,0,0.06)', cursor:'pointer' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}>
              <span style={{ fontSize:16, fontWeight:700 }}>{q}</span>
              <span style={{ fontSize:20, color:'#0A8754', transform: open===i?'rotate(45deg)':'none', transition:'transform 0.2s' }}>+</span>
            </div>
            {open===i && <p style={{ fontSize:14.5, color:'#5C5248', lineHeight:1.6, marginTop:12 }}>{a}</p>}
          </div>
        ))}
      </div>
    </section>
  )
}

function FinalCTA() {
  return (
    <section className="lp" style={{ padding:'20px 24px 80px', maxWidth:900, margin:'0 auto' }}>
      <div style={{ background:'linear-gradient(135deg,#0A8754,#0d6e47)', borderRadius:28, padding:'56px 40px', textAlign:'center', color:'#fff', boxShadow:'0 20px 50px rgba(10,135,84,0.3)' }}>
        <h2 className="display" style={{ fontSize:40, fontWeight:700, marginBottom:14, lineHeight:1.15 }}>Stop losing customers to slow replies.</h2>
        <p style={{ fontSize:17, opacity:0.9, maxWidth:480, margin:'0 auto 30px', lineHeight:1.5 }}>Give BizBot 30 days. Watch it book appointments and recover payments while you focus on your work.</p>
        <Link href="/signup" style={{ display:'inline-block', background:'#FFD96B', color:'#1A1410', padding:'16px 36px', borderRadius:13, fontSize:17, fontWeight:700, boxShadow:'0 8px 20px rgba(0,0,0,0.15)' }}>Start your free trial →</Link>
        <p style={{ fontSize:13, opacity:0.8, marginTop:16 }}>No card needed · We help you set up · Cancel anytime</p>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="lp" style={{ background:'#1A1410', color:'#B5ACA0', padding:'40px 24px' }}>
      <div style={{ maxWidth:1000, margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, color:'#fff' }}>
          <span style={{ fontSize:20 }}>🤖</span><span className="display" style={{ fontSize:20, fontWeight:700 }}>BizBot</span>
        </div>
        <div style={{ display:'flex', gap:24, fontSize:14 }}>
          <a href="#demo">Demo</a><a href="#pricing">Pricing</a><Link href="/login">Log in</Link><Link href="/signup">Start free</Link>
        </div>
        <div style={{ fontSize:13 }}>© 2026 BizBot · Made in India 🇮🇳</div>
      </div>
    </footer>
  )
}