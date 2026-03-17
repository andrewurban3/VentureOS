import { supabase } from '@/lib/supabase'

export type ActivityAction =
  | 'venture_created'
  | 'stage_changed'
  | 'document_generated'
  | 'risk_added'
  | 'risk_updated'
  | 'gate_requested'
  | 'gate_approved'
  | 'gate_rejected'
  | 'kpi_snapshot_added'
  | 'design_partner_added'
  | 'other'

export interface ActivityEvent {
  id: string
  venture_id: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  details: Record<string, unknown>
  actor: string | null
  created_at: string
}

export interface ActivityEventRow {
  id: string
  venture_id: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  details: Record<string, unknown>
  actor: string | null
  created_at: string
}

export async function logActivity(params: {
  ventureId: string | null
  action: ActivityAction
  entityType?: string
  entityId?: string
  details?: Record<string, unknown>
  actor?: string
}): Promise<void> {
  await supabase.from('activity_events').insert({
    venture_id: params.ventureId,
    action: params.action,
    entity_type: params.entityType ?? null,
    entity_id: params.entityId ?? null,
    details: params.details ?? {},
    actor: params.actor ?? null,
  })
}

export async function getActivityForVenture(
  ventureId: string,
  limit = 50
): Promise<ActivityEvent[]> {
  const { data, error } = await supabase
    .from('activity_events')
    .select('*')
    .eq('venture_id', ventureId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) return []
  return (data ?? []) as ActivityEvent[]
}

export async function getRecentActivityAcrossPortfolio(
  limit = 30
): Promise<(ActivityEvent & { venture_name?: string })[]> {
  const { data, error } = await supabase
    .from('activity_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) return []
  const rows = (data ?? []) as ActivityEvent[]
  const ventureIds = [...new Set(rows.map((r) => r.venture_id).filter(Boolean))] as string[]
  if (ventureIds.length === 0) return rows
  const { data: ventures } = await supabase
    .from('ventures')
    .select('id, name_value')
    .in('id', ventureIds)
  const nameMap = new Map((ventures ?? []).map((v: { id: string; name_value: string }) => [v.id, v.name_value]))
  return rows.map((r) => ({
    ...r,
    venture_name: r.venture_id ? nameMap.get(r.venture_id) : undefined,
  }))
}
