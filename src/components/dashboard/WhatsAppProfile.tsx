'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Card, Button, Input, Textarea, Select, Badge, showToast } from '@/components/ui'
import { MessageCircle, Upload, ExternalLink } from 'lucide-react'

const NAME_STATUS: Record<string, { variant: string; label: string }> = {
  APPROVED: { variant: 'green', label: 'Approved' },
  AVAILABLE_WITHOUT_REVIEW: { variant: 'green', label: 'Approved' },
  PENDING_REVIEW: { variant: 'amber', label: 'Pending Meta review' },
  DECLINED: { variant: 'red', label: 'Declined' },
  NONE: { variant: 'default', label: 'Not set' },
}
const QUALITY: Record<string, { color: string; label: string }> = {
  GREEN: { color: '#00C57A', label: 'High' }, YELLOW: { color: '#FFA040', label: 'Medium' }, RED: { color: '#FF5A5A', label: 'Low' },
}
const VERTICALS = [
  { value: '', label: 'Select category' },
  { value: 'PROF_SERVICES', label: 'Professional Services' },
  { value: 'BEAUTY', label: 'Beauty, Spa & Salon' },
  { value: 'HEALTH', label: 'Medical & Health' },
  { value: 'EDU', label: 'Education' },
  { value: 'RESTAURANT', label: 'Restaurant' },
  { value: 'RETAIL', label: 'Shopping & Retail' },
  { value: 'HOTEL', label: 'Hotel & Lodging' },
  { value: 'EVENT_PLAN', label: 'Event Planning' },
  { value: 'OTHER', label: 'Other' },
]

// Center-crop to square + downscale so the base64 stays well under the API's body cap.
function squareResize(file: File, out = 480, quality = 0.72): Promise<{ dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    const img = new Image()
    reader.onload = () => { img.src = reader.result as string }
    reader.onerror = reject
    img.onload = () => {
      const size = Math.min(img.width, img.height)
      const sx = (img.width - size) / 2, sy = (img.height - size) / 2
      const dim = Math.min(out, size)
      const canvas = document.createElement('canvas')
      canvas.width = dim; canvas.height = dim
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('no canvas'))
      ctx.drawImage(img, sx, sy, size, size, 0, 0, dim, dim)
      resolve({ dataUrl: canvas.toDataURL('image/jpeg', quality) })
    }
    img.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function WhatsAppProfile() {
  const [data, setData]       = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [uploading, setUploading] = useState(false)
  const [p, setP] = useState<any>({ about: '', description: '', address: '', email: '', website: '', vertical: '' })

  async function load() {
    const { data } = await api.getWhatsAppProfile()
    setData(data)
    if (data?.profile) setP({
      about: data.profile.about || '', description: data.profile.description || '',
      address: data.profile.address || '', email: data.profile.email || '',
      website: data.profile.website || '', vertical: data.profile.vertical || '',
    })
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function save() {
    setSaving(true)
    const { error } = await api.updateWhatsAppProfile(p)
    setSaving(false)
    showToast(error ? error : 'WhatsApp profile updated', error ? 'error' : 'success')
    if (!error) load()
  }

  async function onLogo(e: any) {
    const file = e.target.files?.[0]; e.target.value = ''
    if (!file) return
    setUploading(true)
    try {
      const { dataUrl } = await squareResize(file)
      const { error } = await api.uploadWhatsAppLogo(dataUrl, 'image/jpeg')
      showToast(error ? error : 'Logo updated on WhatsApp', error ? 'error' : 'success')
      if (!error) load()
    } catch { showToast('Could not read that image', 'error') }
    setUploading(false)
  }

  if (loading) return null
  const set = (k: string, v: string) => setP((prev: any) => ({ ...prev, [k]: v }))

  return (
    <Card className="p-5 mb-4">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[rgba(255,255,255,0.06)]">
        <MessageCircle size={15} className="text-[#00C57A]" />
        <h2 className="text-sm font-semibold text-[#E8EAED]">WhatsApp Profile</h2>
        <span className="text-xs text-[#5A6370]">— what your customers see</span>
      </div>

      {!data?.connected ? (
        <p className="text-sm text-[#5A6370]">Connect your WhatsApp number first (add the Phone Number ID above), then your business name, logo, and profile will appear here.</p>
      ) : (
        <div className="space-y-5">
          {/* Display name + review status */}
          <div className="p-3 bg-[#141618] rounded-xl">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-[#5A6370]">Display name (shown at the top of every chat)</span>
              {data.nameStatus && <Badge variant={(NAME_STATUS[data.nameStatus]?.variant || 'default') as any}>{NAME_STATUS[data.nameStatus]?.label || data.nameStatus}</Badge>}
            </div>
            <p className="text-sm font-semibold text-[#E8EAED]">{data.displayName || '—'} <span className="text-xs text-[#5A6370] font-normal">{data.phoneNumber || ''}</span></p>
            {data.newNameStatus === 'PENDING_REVIEW' && <p className="text-xs text-[#FFA040] mt-1">A name change is pending Meta review.</p>}
            {data.qualityRating && QUALITY[data.qualityRating] && (
              <p className="text-xs text-[#5A6370] mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: QUALITY[data.qualityRating].color }} />
                Quality rating: {QUALITY[data.qualityRating].label}
              </p>
            )}
            <p className="text-xs text-[#5A6370] mt-2">
              Changing your display name needs Meta&apos;s review and is limited (roughly a couple of changes, not more than once a month).
              Change it in{' '}
              <a href="https://business.facebook.com/wa/manage/phone-numbers/" target="_blank" rel="noopener noreferrer" className="text-[#4D9EFF] hover:underline inline-flex items-center gap-0.5">WhatsApp Manager <ExternalLink size={10} /></a>.
            </p>
          </div>

          {/* Logo */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-[#141618] flex items-center justify-center flex-shrink-0 border border-[rgba(255,255,255,0.08)]">
              {data.profile?.profilePictureUrl
                ? <img src={data.profile.profilePictureUrl} alt="logo" className="w-full h-full object-cover" />
                : <MessageCircle size={22} className="text-[#5A6370]" />}
            </div>
            <div>
              <label className="inline-flex">
                <Button size="sm" variant="secondary" icon={Upload} loading={uploading} onClick={(e: any) => e.currentTarget.parentElement.querySelector('input')?.click()}>Upload logo</Button>
                <input type="file" accept="image/*" className="hidden" onChange={onLogo} />
              </label>
              <p className="text-xs text-[#5A6370] mt-1.5">Square image works best; we crop &amp; resize automatically.</p>
            </div>
          </div>

          {/* Profile fields */}
          <div className="grid grid-cols-2 gap-4">
            <Input label="About (short tagline)" value={p.about} onChange={(e: any) => set('about', e.target.value)} placeholder="Premium salon in Lajpat Nagar" />
            <Select label="Category" value={p.vertical} onChange={(e: any) => set('vertical', e.target.value)} options={VERTICALS} />
            <Input label="Email" value={p.email} onChange={(e: any) => set('email', e.target.value)} placeholder="hello@business.com" />
            <Input label="Website" value={p.website} onChange={(e: any) => set('website', e.target.value)} placeholder="https://…" />
            <Input label="Address" value={p.address} onChange={(e: any) => set('address', e.target.value)} className="col-span-2" placeholder="Shop 12, Lajpat Nagar, New Delhi" />
            <Textarea label="Description" value={p.description} onChange={(e: any) => set('description', e.target.value)} className="col-span-2" rows={2} placeholder="What your business offers" />
          </div>

          <Button onClick={save} loading={saving}>Save WhatsApp profile</Button>
        </div>
      )}
    </Card>
  )
}
