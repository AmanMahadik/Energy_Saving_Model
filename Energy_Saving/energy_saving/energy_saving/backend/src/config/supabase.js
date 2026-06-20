const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('CRITICAL: Supabase environment variables (SUPABASE_URL, SUPABASE_KEY) are missing!');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
