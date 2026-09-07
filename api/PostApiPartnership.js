import { supabase } from '../lib/supabase';

// Same pattern as createGardenerApplication — anon has INSERT-only on
// `partnership` (see supabase/migrations/0014_partnership_applications.sql),
// so no .select() is chained and success is simply "no error".
export const createPartnershipApplication = async (fields) => {
    const { error } = await supabase.from('partnership').insert([fields]);
    if (error) throw new Error(error.message);
};
