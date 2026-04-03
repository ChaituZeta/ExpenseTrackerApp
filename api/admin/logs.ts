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
    const { data, error } = await supabase.from("activity_logs").select("*").order("created_at", { ascending: false });
    if (error) {
      console.error("Admin logs error details:", error.message);
      return res.status(500).json({ message: error.message || "Failed to fetch logs" });
    }
    res.json(data);
  } catch (error: any) {
    console.error("Admin logs catch error:", error.message || error);
    res.status(500).json({ message: "Internal server error fetching logs" });
  }
}
