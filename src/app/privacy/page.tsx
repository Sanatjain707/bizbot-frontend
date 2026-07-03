import Link from 'next/link'

export const metadata = { title: 'Privacy Policy · BizBot' }

export default function PrivacyPage() {
  return (
    <Legal title="Privacy Policy">
      <Note>
        This is a starter template. Before you sell, have it reviewed by a lawyer and fill in
        the bracketed details ([Company], [contact email], [address]).
      </Note>

      <P><b>Last updated:</b> [date]. BizBot (&ldquo;we&rdquo;, &ldquo;us&rdquo;) is operated by [Company / your name], India. This policy explains what we collect and how we use it.</P>

      <H>1. Who this covers</H>
      <P>Two groups: <b>business owners</b> who sign up for BizBot, and their <b>end customers</b> who message the business on WhatsApp. Business owners are responsible for their customers&rsquo; data and for obtaining any consent required to message them.</P>

      <H>2. What we collect</H>
      <UL items={[
        'Account data: your name, email, phone, business details.',
        'Customer data (on your behalf): your customers’ names, phone numbers, and WhatsApp message content, appointments, and payments.',
        'Payment data: processed by Razorpay. We do not store card/UPI credentials.',
        'Usage/technical data: logs needed to run and secure the service.',
      ]} />

      <H>3. How we use it</H>
      <UL items={[
        'To provide the service: generate AI replies, book appointments, send reminders, and run broadcasts you configure.',
        'To process billing via Razorpay.',
        'To secure, debug, and improve the service.',
      ]} />

      <H>4. Who we share it with (processors)</H>
      <UL items={[
        'Meta (WhatsApp Business API) — to send and receive messages.',
        'AI provider (Groq) — message text is processed to generate replies.',
        'Razorpay — payments.',
        'Supabase — database hosting.',
      ]} />
      <P>We do not sell personal data.</P>

      <H>5. Messaging &amp; opt-out</H>
      <P>End customers can stop messages any time by replying <b>STOP</b> (or &ldquo;band karo&rdquo;). Marketing broadcasts are only sent to customers the business has a lawful basis to contact.</P>

      <H>6. Retention &amp; security</H>
      <P>We keep data for as long as your account is active or as needed to provide the service and meet legal obligations. We use industry-standard safeguards, but no system is perfectly secure.</P>

      <H>7. Your rights &amp; contact</H>
      <P>To access, correct, or delete your data, contact us at <b>[contact email]</b>. Business owners can delete customer data from the dashboard.</P>

      <BackLinks />
    </Legal>
  )
}

// ── Shared bits ──
function Legal({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#FBF7F0', fontFamily: "'Plus Jakarta Sans',sans-serif", color: '#1A1410' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 80px' }}>
        <Link href="/" style={{ color: '#0A8754', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>← BizBot</Link>
        <h1 style={{ fontSize: 32, fontWeight: 700, fontFamily: "'Fraunces',serif", margin: '20px 0 24px' }}>{title}</h1>
        {children}
      </div>
    </div>
  )
}
function Note({ children }: any) {
  return <p style={{ background: 'rgba(255,160,64,0.1)', border: '1px solid rgba(255,160,64,0.3)', borderRadius: 12, padding: '12px 16px', fontSize: 13.5, color: '#8A5A00', lineHeight: 1.6, marginBottom: 24 }}>{children}</p>
}
function H({ children }: any) { return <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 28, marginBottom: 8 }}>{children}</h2> }
function P({ children }: any) { return <p style={{ fontSize: 15, lineHeight: 1.7, color: '#3A332C', marginBottom: 10 }}>{children}</p> }
function UL({ items }: { items: string[] }) {
  return <ul style={{ margin: '0 0 10px', paddingLeft: 20 }}>{items.map((t, i) => <li key={i} style={{ fontSize: 15, lineHeight: 1.7, color: '#3A332C', marginBottom: 4 }}>{t}</li>)}</ul>
}
function BackLinks() {
  return <p style={{ marginTop: 36, fontSize: 14 }}><Link href="/terms" style={{ color: '#0A8754' }}>Terms of Service</Link> · <Link href="/" style={{ color: '#0A8754' }}>Home</Link></p>
}
