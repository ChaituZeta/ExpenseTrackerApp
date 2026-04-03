import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, isAdmin } from '../lib/shared';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const auth = await isAdmin(req);
  if (auth.error) {
    return res.status(auth.status || 401).json({ message: auth.error });
  }

  try {
    const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (error) {
      console.error("Admin users error details:", error.message);
      return res.status(500).json({ message: error.message || "Failed to fetch users" });
    }
    res.json(data);
  } catch (error: any) {
    console.error("Admin users catch error:", error.message || error);
    res.status(500).json({ message: "Internal server error fetching users" });
  }
}
