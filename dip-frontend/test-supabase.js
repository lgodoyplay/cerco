
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kelrfiwnrmtinflqcbzc.supabase.co';
const supabaseKey = 'sb_publishable_pjnzcaQmb6e410fSeutveQ_jmyXwrV4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('Testing connection with key:', supabaseKey);
  try {
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('Connection Failed:', error);
    } else {
      console.log('Connection Successful!', data);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testConnection();
