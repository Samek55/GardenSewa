import { supabase } from '../lib/supabase';

// The anon key has no SELECT grant on `booking` (see
// supabase/migrations/0009_booking_and_leads.sql) — a customer must never be
// able to read back any booking row, including their own, through the anon
// key — so this deliberately does not chain `.select()` after the insert.
export const createBooking = async (fields) => {
    const { error } = await supabase.from('booking').insert([fields]);
    if (error) throw new Error(error.message);
};
