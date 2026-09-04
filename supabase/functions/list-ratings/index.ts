import { corsHeaders, json } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';

// No session required — ratings are meant to build public trust (e.g. a
// "4.8 stars, 32 jobs" line on a gardener's profile), same as star ratings
// on any marketplace. Pass bookingId to check whether a specific booking has
// already been rated from either side, or gardenerPhone for that gardener's
// overall rating history.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const bookingId = url.searchParams.get('bookingId');
    const gardenerPhone = url.searchParams.get('gardenerPhone');

    let query = supabaseAdmin
      .from('booking_ratings')
      .select('booking_id, rater_role, rated_phone, rating, comment, created_at');

    if (bookingId) query = query.eq('booking_id', bookingId);
    else if (gardenerPhone) query = query.eq('rated_phone', gardenerPhone).eq('rater_role', 'customer');
    else return json({ success: false, message: 'bookingId or gardenerPhone is required' }, 400);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return json({ success: true, ratings: data });
  } catch (e) {
    console.error('list-ratings error:', e);
    return json({ success: false, message: 'Could not load ratings' }, 500);
  }
});
