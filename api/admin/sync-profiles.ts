import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, isAdmin } from '../lib/shared';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const auth = await isAdmin(req);
  if (auth.error) {
    return res.status(auth.status || 401).json({ message: auth.error });
  }

  try {
    if (!supabase.auth.admin) {
      console.error("Supabase Admin SDK not initialized");
      return res.status(500).json({ 
        message: "Supabase Admin SDK not initialized. Ensure SUPABASE_SERVICE_ROLE_KEY is set in Secrets." 
      });
    }
    
    console.log("Listing users from auth.admin...");
    const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.error("Auth admin list users error:", authError.message);
      throw authError;
    }

    console.log(`Found ${authUsers.length} users in auth. Syncing to profiles...`);
    const results = [];
    for (const user of authUsers) {
      const { error: upsertError } = await supabase.from('profiles').upsert([{
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        role: user.email === 'cbogineni@gmail.com' ? 'admin' : 'user'
      }], { onConflict: 'id' });
      
      if (!upsertError) {
        results.push(user.email);
      } else {
        console.error(`Failed to sync profile for ${user.email}:`, upsertError.message);
      }
    }

    console.log(`Sync complete. Synced ${results.length} profiles.`);
    res.json({ success: true, synced: results });
  } catch (error: any) {
    console.error("Sync profiles catch error:", error.message || error);
    res.status(500).json({ message: error.message || "Internal server error syncing profiles" });
  }
}
