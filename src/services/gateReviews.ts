import { supabase } from '@/lib/supabase'
import { logActivity } from '@/services/activityFeed'

export interface GateReview {
  id: string
  ventureId: string
  fromStage: string
  toStage: string
  status: 'pending' | 'approved' | 'rejected'
  requestedAt: string
  requestedBy: string
  decidedAt?: string
  decidedBy?: string
  notes?: string
  createdAt: string
}

export interface GateReviewWithVenture extends GateReview {
  ventureName?: string
}

export async function listAllPendingGateReviews(): Promise<GateReviewWithVenture[]> {
  const { data, error } = await supabase
    .from('gate_reviews')
    .select('*')
    .eq('status', 'pending')
    .order('requested_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map((r) => ({
    id: r.id,
    ventureId: r.venture_id,
    fromStage: r.from_stage,
    toStage: r.to_stage,
    status: r.status as GateReview['status'],
    requestedAt: r.requested_at,
    requestedBy: r.requested_by,
    decidedAt: r.decided_at,
    decidedBy: r.decided_by,
    notes: r.notes,
    createdAt: r.created_at,
    ventureName: undefined,
  }))
}

export async function getPendingGateReview(ventureId: string): Promise<GateReview | null> {
  const { data, error } = await supabase
    .from('gate_reviews')
    .select('*')
    .eq('venture_id', ventureId)
    .eq('status', 'pending')
    .order('requested_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return {
    id: data.id,
    ventureId: data.venture_id,
    fromStage: data.from_stage,
    toStage: data.to_stage,
    status: data.status,
    requestedAt: data.requested_at,
    requestedBy: data.requested_by,
    decidedAt: data.decided_at,
    decidedBy: data.decided_by,
    notes: data.notes,
    createdAt: data.created_at,
  }
}

export async function getGateReviewHistory(ventureId: string): Promise<GateReview[]> {
  const { data, error } = await supabase
    .from('gate_reviews')
    .select('*')
    .eq('venture_id', ventureId)
    .order('requested_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map((r) => ({
    id: r.id,
    ventureId: r.venture_id,
    fromStage: r.from_stage,
    toStage: r.to_stage,
    status: r.status,
    requestedAt: r.requested_at,
    requestedBy: r.requested_by,
    decidedAt: r.decided_at,
    decidedBy: r.decided_by,
    notes: r.notes,
    createdAt: r.created_at,
  }))
}

export async function requestGateReview(
  ventureId: string,
  fromStage: string,
  toStage: string,
  requestedBy: string = 'Founder'
): Promise<GateReview> {
  const { data, error } = await supabase
    .from('gate_reviews')
    .insert({
      venture_id: ventureId,
      from_stage: fromStage,
      to_stage: toStage,
      status: 'pending',
      requested_by: requestedBy,
    })
    .select()
    .single()

  if (error) throw error

  logActivity({
    ventureId: ventureId,
    action: 'gate_requested',
    details: { fromStage, toStage, requestedBy },
  }).catch(() => {})

  return {
    id: data.id,
    ventureId: data.venture_id,
    fromStage: data.from_stage,
    toStage: data.to_stage,
    status: data.status,
    requestedAt: data.requested_at,
    requestedBy: data.requested_by,
    decidedAt: data.decided_at,
    decidedBy: data.decided_by,
    notes: data.notes,
    createdAt: data.created_at,
  }
}

export async function decideGateReview(
  reviewId: string,
  decision: 'approved' | 'rejected',
  decidedBy: string,
  notes?: string
): Promise<void> {
  const { data: review } = await supabase
    .from('gate_reviews')
    .select('venture_id, from_stage, to_stage')
    .eq('id', reviewId)
    .single()

  const { error } = await supabase
    .from('gate_reviews')
    .update({
      status: decision,
      decided_at: new Date().toISOString(),
      decided_by: decidedBy,
      notes: notes ?? null,
    })
    .eq('id', reviewId)

  if (error) throw error

  if (review?.venture_id) {
    logActivity({
      ventureId: review.venture_id,
      action: decision === 'approved' ? 'gate_approved' : 'gate_rejected',
      details: {
        fromStage: review.from_stage,
        toStage: review.to_stage,
        decidedBy,
        notes,
      },
    }).catch(() => {})
  }
}
