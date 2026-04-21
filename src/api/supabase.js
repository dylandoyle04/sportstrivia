import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in environment.');
}

export const supabase = createClient(url, key);

export async function upsertProfile({ id, email, displayName }) {
  return supabase
    .from('users')
    .upsert({ id, email, display_name: displayName }, { onConflict: 'id' });
}

export async function getMyDailyScore(userId, quizDate) {
  return supabase
    .from('daily_scores')
    .select('score, total, duration_ms')
    .eq('user_id', userId)
    .eq('quiz_date', quizDate)
    .maybeSingle();
}

export async function submitDailyScore({ userId, quizDate, score, total, durationMs }) {
  return supabase
    .from('daily_scores')
    .insert({
      user_id: userId,
      quiz_date: quizDate,
      score,
      total,
      duration_ms: durationMs,
    });
}

export async function getDailyLeaderboard(quizDate, limit = 50) {
  return supabase
    .from('daily_scores')
    .select('score, total, duration_ms, user_id, users!inner(display_name)')
    .eq('quiz_date', quizDate)
    .order('score', { ascending: false })
    .order('duration_ms', { ascending: true, nullsFirst: false })
    .limit(limit);
}

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function generateInviteCode() {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

export async function createGroup({ name, leaderId, teams }) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const inviteCode = generateInviteCode();
    const { data, error } = await supabase
      .from('groups')
      .insert({
        name,
        leader_id: leaderId,
        invite_code: inviteCode,
        team_ids: teams,
      })
      .select()
      .single();
    if (!error) {
      await supabase
        .from('group_members')
        .insert({ group_id: data.id, user_id: leaderId });
      return { data, error: null };
    }
    if (error.code !== '23505') return { data: null, error };
  }
  return { data: null, error: { message: 'Could not generate unique invite code.' } };
}

export async function findGroupByCode(code) {
  return supabase
    .from('groups')
    .select('id, name, leader_id, team_ids, invite_code')
    .eq('invite_code', code.toUpperCase())
    .maybeSingle();
}

export async function joinGroup(groupId, userId) {
  return supabase
    .from('group_members')
    .insert({ group_id: groupId, user_id: userId });
}

export async function getMyGroups(userId) {
  return supabase
    .from('group_members')
    .select('group_id, groups!inner(id, name, leader_id, team_ids, invite_code)')
    .eq('user_id', userId);
}

export async function getGroup(groupId) {
  return supabase
    .from('groups')
    .select('id, name, leader_id, team_ids, invite_code')
    .eq('id', groupId)
    .single();
}

export async function getMyGroupScore(userId, groupId, quizDate) {
  return supabase
    .from('group_scores')
    .select('score, total, duration_ms')
    .eq('user_id', userId)
    .eq('group_id', groupId)
    .eq('quiz_date', quizDate)
    .maybeSingle();
}

export async function submitGroupScore({ userId, groupId, quizDate, score, total, durationMs }) {
  return supabase
    .from('group_scores')
    .insert({
      user_id: userId,
      group_id: groupId,
      quiz_date: quizDate,
      score,
      total,
      duration_ms: durationMs,
    });
}

export async function getGroupScores(groupId) {
  return supabase
    .from('group_scores')
    .select('score, total, user_id, users!inner(display_name)')
    .eq('group_id', groupId);
}

export async function submitCollegeScore({ userId, league, score, attempted, durationMs }) {
  return supabase
    .from('college_scores')
    .insert({
      user_id: userId,
      league,
      score,
      attempted,
      duration_ms: durationMs,
    });
}

export async function getCollegeScores(limit = 500) {
  return supabase
    .from('college_scores')
    .select('score, attempted, league, user_id, users!inner(display_name)')
    .order('score', { ascending: false })
    .limit(limit);
}
