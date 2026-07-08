import type { SupabaseClient } from '@supabase/supabase-js'
import type { AdminSummary } from '@/lib/types'

export function mapAssigner(raw: unknown): AdminSummary | null {
  if (Array.isArray(raw)) return mapAssigner(raw[0])
  if (!raw || typeof raw !== 'object') return null

  const a = raw as Record<string, unknown>
  const id = typeof a.id === 'number' ? a.id : Number(a.id)
  if (!Number.isFinite(id) || typeof a.name !== 'string' || typeof a.email !== 'string') return null

  return { id, name: a.name, email: a.email }
}

export function resolveAssigner(
  assignerRaw: unknown,
  assignedBy: unknown,
  lookup: Map<number, AdminSummary>,
): AdminSummary | null {
  const fromJoin = mapAssigner(assignerRaw)
  if (fromJoin) return fromJoin

  const id = typeof assignedBy === 'number' ? assignedBy : Number(assignedBy)
  if (!Number.isFinite(id)) return null
  return lookup.get(id) ?? null
}

export function adminFirstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name
}

export function formatAllottedByLabel(name: string | null | undefined): string {
  if (!name) return 'An admin allotted'
  return `${adminFirstName(name)} allotted`
}

export async function fetchAdminLookup(
  supabase: SupabaseClient,
  ids: number[],
): Promise<Map<number, AdminSummary>> {
  const lookup = new Map<number, AdminSummary>()
  if (ids.length === 0) return lookup

  const { data } = await supabase
    .from('users')
    .select('id, name, email')
    .in('id', ids)

  for (const row of data ?? []) {
    const mapped = mapAssigner(row)
    if (mapped) lookup.set(mapped.id, mapped)
  }

  return lookup
}
