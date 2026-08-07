import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('brand_menu_items').select('*');
  if (error) throw error;
  
  let count = 0;
  for (const item of data) {
    let changed = false;
    let newNotes = item.notes;
    if (newNotes) {
      let str = String(newNotes).trim();
      str = str.replace(/^description\s*:\s*/i, '');
      str = str.replace(/\s*salt:\s*[\d.]+g?\s*→\s*sodium\s*\d+mg.*$/i, '');
      str = str.replace(/\s*pasted from menu nutrition panel.*$/i, '');
      str = str.trim();
      
      if (str !== newNotes) {
        newNotes = str;
        changed = true;
      }
    }
    if (changed) {
      await supabase.from('brand_menu_items').update({ notes: newNotes }).eq('id', item.id);
      console.log(`Updated notes for ${item.dish_name}`);
      count++;
    }
  }
  console.log(`Updated ${count} items.`);
}
run().catch(console.error);
