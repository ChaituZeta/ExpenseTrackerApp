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
    const { data, error } = await supabase
      .from("transactions")
      .select(`
        *,
        categories (name, icon, color)
      `)
      .order("date", { ascending: false });
    
    if (error) {
      console.error("Admin transactions error details:", error.message);
      return res.status(500).json({ message: error.message || "Failed to fetch transactions" });
    }
    
    const formatted = data.map((t: any) => ({
      ...t,
      category_name: t.categories?.name,
      category_icon: t.categories?.icon,
      category_color: t.categories?.color,
      user_name: "User",
      user_email: "Email",
    }));
    
    res.json(formatted);
  } catch (error: any) {
    console.error("Admin transactions catch error:", error.message || error);
    res.status(500).json({ message: "Internal server error fetching transactions" });
  }
}
