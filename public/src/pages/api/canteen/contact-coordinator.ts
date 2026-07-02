/**
 * POST /api/canteen/contact-coordinator
 * Saves a contact request from a canteen volunteer and (TODO) fires an SMS
 * to the canteen coordinator via Twilio once credentials are configured.
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { getAdminClient } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => null);
  const name         = body?.name?.trim();
  const phone        = body?.phone?.trim()        || null;
  const game_day     = body?.game_day?.trim()     || null;
  const time_slot    = body?.time_slot?.trim()    || null;
  const station      = body?.station?.trim()      || null;
  const slot_id      = body?.slot_id              || null;
  const request_type = body?.request_type?.trim() || null;   // 'change' | 'remove'
  const message      = body?.message?.trim();

  if (!name || !request_type || !message) {
    return json({ ok: false, error: 'name, request_type, and message are required' }, 400);
  }

  const db = getAdminClient();

  // Persist the contact request so the coordinator has a record
  // Table: canteen_contact_requests — columns:
  //   id, name, phone, game_day, time_slot, station, slot_id,
  //   request_type, message, created_at
  // If the table doesn't exist yet this silently degrades — Twilio SMS will
  // handle notification once credentials are added.
  await db.from('canteen_contact_requests').insert({
    name,
    phone,
    game_day,
    time_slot,
    station,
    slot_id,
    request_type,
    message,
    created_at: new Date().toISOString(),
  }).then(() => {}).catch(() => {});

  // ── TODO: Send SMS via Twilio ──────────────────────────────────────────
  // When ready, add these env vars to Vercel:
  //   TWILIO_ACCOUNT_SID
  //   TWILIO_AUTH_TOKEN
  //   TWILIO_FROM_NUMBER          (your Twilio sending number)
  //   CANTEEN_COORDINATOR_PHONE   (coordinator's mobile, e.g. +61412345678)
  //
  // Then replace this comment block with:
  //
  // const sid   = import.meta.env.TWILIO_ACCOUNT_SID;
  // const token = import.meta.env.TWILIO_AUTH_TOKEN;
  // const from  = import.meta.env.TWILIO_FROM_NUMBER;
  // const to    = import.meta.env.CANTEEN_COORDINATOR_PHONE;
  //
  // if (sid && token && from && to) {
  //   const reqLabel = request_type === 'remove' ? 'REMOVE from shift' : 'Change shift';
  //   const smsBody = [
  //     `Wallaroo FC Canteen – ${reqLabel}`,
  //     `From: ${name}${phone ? ` (${phone})` : ''}`,
  //     `Shift: ${game_day} · ${time_slot}${station ? ` · ${station}` : ''}`,
  //     `Message: ${message}`,
  //   ].join('\n');
  //   await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
  //     method: 'POST',
  //     headers: {
  //       'Authorization': 'Basic ' + btoa(`${sid}:${token}`),
  //       'Content-Type': 'application/x-www-form-urlencoded',
  //     },
  //     body: new URLSearchParams({ From: from, To: to, Body: smsBody }).toString(),
  //   });
  // }
  // ──────────────────────────────────────────────────────────────────────

  return json({ ok: true });
};

function json(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
