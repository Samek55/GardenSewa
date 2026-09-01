import { supabase } from '../lib/supabase';

// The anon key has no SELECT grant on `gardener` (see
// supabase/migrations/0001_create_gardener_table.sql) — a public applicant
// must never be able to read back any gardener row, including their own — so
// this deliberately does not chain `.select()` after the insert. A thrown
// error is the only signal the caller gets; success is simply "no error".
export const createGardenerApplication = async (fields) => {
    const { error } = await supabase.from('gardener').insert([fields]);
    if (error) throw new Error(error.message);
};
