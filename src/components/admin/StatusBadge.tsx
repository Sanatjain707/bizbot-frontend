import { Badge } from '@/components/ui'

const MAP: Record<string, string> = {
  active: 'green', trial: 'blue', expired: 'red', suspended: 'amber',
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={MAP[status] || 'default'}>{status}</Badge>
}
