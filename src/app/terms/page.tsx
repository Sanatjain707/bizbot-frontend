import Link from 'next/link'

export const metadata = { title: 'Terms of Service · BizBot' }

export default function TermsPage() {
  return (
    <Legal title="Terms of Service">
      <Note>
        Starter template — have it reviewed by a lawyer and fill in the bracketed details
        ([Company], [contact email], [jurisdiction]) before you sell.
      </Note>

      <P><b>Last updated:</b> [date]. By creating an account you agree to these terms with [Company] (&ldquo;BizBot&rdquo;).</P>

      <H>1. The service</H>
      <P>BizBot is an AI assistant that replies to your customers on WhatsApp, books appointments, sends reminders, and runs broadcasts you configure. Features may change over time.</P>

      <H>2. Your account</H>
      <UL items={[
        'You must provide accurate details and keep your login secure.',
        'You are responsible for all activity under your account.',
        'You must be authorised to represent the business you register.',
      ]} />

      <H>3. Acceptable use &amp; WhatsApp policies</H>
      <UL items={[
        'Follow WhatsApp’s Business and Commerce policies at all times.',
        'Only message customers you have a lawful basis / consent to contact. You are responsible for that consent.',
        'No spam, unlawful, misleading, or harmful content. Honour opt-outs (STOP).',
        'Getting your WhatsApp number banned by Meta for policy violations is your responsibility.',
      ]} />

      <H>4. Fees &amp; billing</H>
      <UL items={[
        'Plans: Starter ₹999 / Growth ₹1,999 / Pro ₹3,999 per month (or as shown at checkout). 30-day free trial.',
        'Billing is handled by Razorpay. Charges recur until you cancel.',
        'WhatsApp messaging fees charged by Meta (per message, by category) are separate and are your responsibility.',
        'Fees are non-refundable except where required by law.',
      ]} />

      <H>5. Availability &amp; disclaimers</H>
      <P>The service is provided &ldquo;as is&rdquo;. We don&rsquo;t guarantee uninterrupted availability, and the AI may occasionally make mistakes — review important actions. We are not liable for third-party outages (Meta, Razorpay, Groq).</P>

      <H>6. Limitation of liability</H>
      <P>To the maximum extent permitted by law, our total liability is limited to the fees you paid in the previous [3] months. We are not liable for indirect or consequential losses.</P>

      <H>7. Termination</H>
      <P>You may cancel any time. We may suspend or terminate accounts that violate these terms. On termination, your access ends and data may be deleted after a reasonable period.</P>

      <H>8. Governing law</H>
      <P>These terms are governed by the laws of India, with courts at [city/jurisdiction] having exclusive jurisdiction.</P>

      <H>9. Contact</H>
      <P>Questions? <b>[contact email]</b>.</P>

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
  return <p style={{ marginTop: 36, fontSize: 14 }}><Link href="/privacy" style={{ color: '#0A8754' }}>Privacy Policy</Link> · <Link href="/" style={{ color: '#0A8754' }}>Home</Link></p>
}
