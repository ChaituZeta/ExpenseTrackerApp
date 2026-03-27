import { supabase } from './supabase';
import { User, Category, Transaction, Budget, Summary, ActivityLog } from '../types';

export const api = {
  auth: {
    register: async (data: any) => {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            phone: data.phone,
            currency: '₹',
          },
        },
      });
      if (error) throw error;

      // Manually insert into profiles table to ensure server-side lookups work
      // This is helpful if there's no database trigger set up
      if (authData.user) {
        try {
          await supabase.from('profiles').insert([{
            id: authData.user.id,
            email: data.email,
            name: data.name,
            phone: data.phone,
            role: data.email === 'cbogineni@gmail.com' ? 'admin' : 'user',
            currency: '₹'
          }]);
        } catch (profileErr) {
          console.error('Failed to create profile record:', profileErr);
          // Don't throw here, as auth was successful
        }
      }

      // Log activity
      await api.logs.create('Register', `User ${data.name} registered`);

      return authData;
    },
    
    login: async (data: any) => {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (error) throw error;
      
      // Log activity
      await api.logs.create('Login', `User ${authData.user.email} logged in`);

      return {
        user: {
          id: authData.user.id,
          email: authData.user.email,
          name: authData.user.user_metadata.name,
          phone: authData.user.user_metadata.phone,
          avatar_url: authData.user.user_metadata.avatar_url,
          currency: authData.user.user_metadata.currency || '₹',
          role: authData.user.email === 'cbogineni@gmail.com' ? 'admin' : 'user',
        }
      };
    },
    
    logout: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    
    me: async (): Promise<{ user: User | null }> => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          // If there's a refresh token error, clear the session
          if (error.message.includes('Refresh Token Not Found') || error.message.includes('refresh_token_not_found')) {
            await supabase.auth.signOut();
          }
          return { user: null };
        }
        if (!user) return { user: null };
        
        return {
          user: {
            id: user.id,
            email: user.email!,
            name: user.user_metadata.name,
            phone: user.user_metadata.phone,
            avatar_url: user.user_metadata.avatar_url,
            currency: user.user_metadata.currency || '₹',
            role: user.email === 'cbogineni@gmail.com' ? 'admin' : 'user',
          }
        };
      } catch (err) {
        console.error('Error in api.auth.me:', err);
        return { user: null };
      }
    },

    updateProfile: async (data: Partial<User>) => {
      try {
        const { data: result, error } = await supabase.auth.updateUser({
          data: {
            name: data.name,
            phone: data.phone,
            currency: data.currency,
            avatar_url: data.avatar_url,
          }
        });
        if (error) {
          if (error.message.includes('Refresh Token Not Found') || error.message.includes('refresh_token_not_found')) {
            await supabase.auth.signOut();
          }
          throw error;
        }

        // Log activity
        await api.logs.create('Update Profile', `User updated their profile`);

        return result;
      } catch (err) {
        console.error('Error in api.auth.updateProfile:', err);
        throw err;
      }
    },

    forgotPassword: async (identifier: string) => {
      // identifier can be email or phone
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier })
      });
      
      const contentType = response.headers.get("content-type");
      if (!response.ok) {
        let errorMessage = 'Failed to send OTP';
        if (contentType && contentType.includes("application/json")) {
          const err = await response.json();
          errorMessage = err.message || errorMessage;
        } else {
          const text = await response.text();
          console.error('Forgot password non-JSON error:', text.substring(0, 200));
          errorMessage += ' Backend might be unavailable.';
        }
        throw new Error(errorMessage);
      }
      
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error('Invalid response from server. Expected JSON.');
      }
      return response.json();
    },

    resetPassword: async (data: any) => {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      const contentType = response.headers.get("content-type");
      if (!response.ok) {
        let errorMessage = 'Failed to reset password';
        if (contentType && contentType.includes("application/json")) {
          const err = await response.json();
          errorMessage = err.message || errorMessage;
        } else {
          const text = await response.text();
          console.error('Reset password non-JSON error:', text.substring(0, 200));
          errorMessage += ' Backend might be unavailable.';
        }
        throw new Error(errorMessage);
      }
      
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error('Invalid response from server. Expected JSON.');
      }
      return response.json();
    }
  },

  admin: {
    getAllUsers: async (): Promise<User[]> => {
      // Try Supabase directly first (works if RLS allows and user is admin)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error) return data as User[];
      
      console.warn('Supabase direct profiles fetch failed, falling back to API:', error.message);

      // Fallback to API if Supabase direct fails (though RLS should handle it)
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      try {
        const response = await fetch('/api/admin/users', {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`
          }
        });
        
        const contentType = response.headers.get("content-type");
        if (!response.ok) {
          let errorMessage = 'Failed to fetch users.';
          if (contentType && contentType.includes("application/json")) {
            const err = await response.json();
            errorMessage = err.message || errorMessage;
          } else {
            const text = await response.text();
            console.error('Fetch users non-JSON error:', text.substring(0, 200));
            errorMessage += ' Backend might be unavailable or returned an error.';
          }
          throw new Error(errorMessage);
        }
        
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error('Invalid response from server. Expected JSON. If you are on a static host like Netlify, ensure your backend is deployed correctly.');
        }
        return response.json();
      } catch (fetchErr: any) {
        console.error('Admin API fetch error:', fetchErr);
        throw new Error(`Admin data fetch failed: ${fetchErr.message || 'Unknown error'}. Ensure your backend server is running.`);
      }
    },
    getAllTransactions: async (): Promise<Transaction[]> => {
      // Try Supabase directly first
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          categories (
            name,
            icon,
            color
          ),
          profiles (
            name,
            email,
            role
          )
        `)
        .order('date', { ascending: false });
      
      if (!error) {
        return (data as any[]).map(t => ({
          ...t,
          category_name: t.categories?.name,
          category_icon: t.categories?.icon,
          category_color: t.categories?.color,
          user_name: t.profiles?.name || "User",
          user_email: t.profiles?.email || "Email",
          user_role: t.profiles?.role || "user",
        })) as Transaction[];
      }

      console.warn('Supabase direct transactions fetch failed, falling back to API:', error.message);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      try {
        const response = await fetch('/api/admin/transactions', {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`
          }
        });
        
        const contentType = response.headers.get("content-type");
        if (!response.ok) {
          let errorMessage = 'Failed to fetch transactions.';
          if (contentType && contentType.includes("application/json")) {
            const err = await response.json();
            errorMessage = err.message || errorMessage;
          } else {
            const text = await response.text();
            console.error('Fetch transactions non-JSON error:', text.substring(0, 200));
            errorMessage += ' Backend might be unavailable or returned an error.';
          }
          throw new Error(errorMessage);
        }
        
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error('Invalid response from server. Expected JSON. If you are on a static host like Netlify, ensure your backend is deployed correctly.');
        }
        return response.json();
      } catch (fetchErr: any) {
        console.error('Admin API fetch error:', fetchErr);
        throw new Error(`Admin transactions fetch failed: ${fetchErr.message || 'Unknown error'}. Ensure your backend server is running.`);
      }
    },
    getAllLogs: async (): Promise<ActivityLog[]> => {
      // Try Supabase directly first
      const { data, error } = await supabase
        .from('activity_logs')
        .select(`
          *,
          profiles (
            role
          )
        `)
        .order('created_at', { ascending: false });
      
      if (!error) {
        return (data as any[]).map(l => ({
          ...l,
          user_role: l.profiles?.role || "user"
        })) as ActivityLog[];
      }

      console.warn('Supabase direct logs fetch failed, falling back to API:', error.message);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      try {
        const response = await fetch('/api/admin/logs', {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`
          }
        });
        
        const contentType = response.headers.get("content-type");
        if (!response.ok) {
          let errorMessage = 'Failed to fetch logs.';
          if (contentType && contentType.includes("application/json")) {
            const err = await response.json();
            errorMessage = err.message || errorMessage;
          } else {
            const text = await response.text();
            console.error('Fetch logs non-JSON error:', text.substring(0, 200));
            errorMessage += ' Backend might be unavailable or returned an error.';
          }
          throw new Error(errorMessage);
        }
        
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error('Invalid response from server. Expected JSON. If you are on a static host like Netlify, ensure your backend is deployed correctly.');
        }
        return response.json();
      } catch (fetchErr: any) {
        console.error('Admin API fetch error:', fetchErr);
        throw new Error(`Admin logs fetch failed: ${fetchErr.message || 'Unknown error'}. Ensure your backend server is running.`);
      }
    },
    deleteUser: async (id: string) => {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);
      if (error) throw error;
      await api.logs.create('Admin Action', `Deleted user ID ${id}`);
    },
    updateUser: async (id: string, data: Partial<User>) => {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', id);
      if (error) throw error;
      await api.logs.create('Admin Action', `Updated user ID ${id}`);
    },
    updateUserRole: async (id: string, role: 'admin' | 'user') => {
      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', id);
      if (error) throw error;
      await api.logs.create('Admin Action', `Updated user ID ${id} role to ${role}`);
    },
    createUser: async (userData: any) => {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(userData),
      });
      
      const contentType = response.headers.get("content-type");
      if (!response.ok || !contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error('Create user error response:', text);
        throw new Error('Failed to create user. Backend might be unavailable or returned an error.');
      }
      return response.json();
    },
    syncProfiles: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Syncing profiles, session exists:', !!session);
      const response = await fetch('/api/admin/sync-profiles', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      
      const contentType = response.headers.get("content-type");
      console.log('Sync profiles response status:', response.status, 'content-type:', contentType);
      
      if (!response.ok) {
        let errorMessage = 'Failed to sync profiles.';
        if (contentType && contentType.includes("application/json")) {
          const err = await response.json();
          errorMessage = err.message || errorMessage;
        } else {
          const text = await response.text();
          console.error('Sync profiles non-JSON error body:', text.substring(0, 200));
          errorMessage += ' Backend might be unavailable or returned an error.';
        }
        throw new Error(errorMessage);
      }
      
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error('Invalid response from server. Expected JSON.');
      }
      
      return response.json();
    }
  },

  logs: {
    create: async (action: string, details: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('activity_logs').insert([{
        user_id: user.id,
        user_name: user.user_metadata.name || user.email,
        action,
        details,
      }]);
    }
  },

  categories: {
    getAll: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as Category[];
    },
    create: async (data: Partial<Category>) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: result, error } = await supabase
        .from('categories')
        .insert([{ ...data, user_id: user?.id }])
        .select()
        .single();
      if (error) throw error;
      
      await api.logs.create('Create Category', `Created category ${data.name}`);
      return result;
    },
    delete: async (id: number | string) => {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
      if (error) throw error;
      await api.logs.create('Delete Category', `Deleted category ID ${id}`);
    },
    update: async (id: number | string, data: Partial<Category>) => {
      const { data: result, error } = await supabase
        .from('categories')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      await api.logs.create('Update Category', `Updated category ${data.name || id}`);
      return result;
    },
  },

  transactions: {
    getAll: async (userId?: string): Promise<Transaction[]> => {
      let query = supabase
        .from('transactions')
        .select(`
          *,
          categories (
            name,
            icon,
            color
          )
        `)
        .order('date', { ascending: false });
      
      if (userId) {
        query = query.eq('user_id', userId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return (data as any[]).map(t => ({
        ...t,
        category_name: t.categories?.name,
        category_icon: t.categories?.icon,
        category_color: t.categories?.color,
      })) as Transaction[];
    },
    create: async (data: Partial<Transaction>) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: result, error } = await supabase
        .from('transactions')
        .insert([{ ...data, user_id: user?.id }])
        .select()
        .single();
      if (error) {
        console.error('Transaction creation error:', error);
        throw error;
      }

      await api.logs.create('Create Transaction', `Created ${data.type} of ₹${data.amount}`);
      return result;
    },
    delete: async (id: number | string) => {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);
      if (error) throw error;
      await api.logs.create('Delete Transaction', `Deleted transaction ID ${id}`);
    },
    update: async (id: number | string, data: Partial<Transaction>) => {
      const { data: result, error } = await supabase
        .from('transactions')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      await api.logs.create('Update Transaction', `Updated transaction ID ${id}`);
      return result;
    },
  },

  budgets: {
    getAll: async (): Promise<Budget[]> => {
      const { data, error } = await supabase
        .from('budgets')
        .select(`
          *,
          categories (
            name
          )
        `);
      if (error) throw error;
      return (data as any[]).map(b => ({
        ...b,
        category_name: b.categories?.name
      })) as Budget[];
    },
    upsert: async (data: Partial<Budget>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const payload: any = { ...data, user_id: user.id };
      
      // Remove id if it's null or undefined for new records
      if (!payload.id) {
        delete payload.id;
      }

      console.log('Sending budget upsert payload:', payload);

      const { data: result, error } = await supabase
        .from('budgets')
        .upsert(payload, { onConflict: 'user_id,category_id,month' })
        .select();
      
      if (error) {
        console.error('Budget upsert error details:', error);
        throw error;
      }
      await api.logs.create('Update Budget', `Updated budget for category ID ${data.category_id}`);
      return result ? result[0] : null;
    },
    delete: async (id: number | string) => {
      console.log('Attempting to delete budget with ID:', id);
      const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
      
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', numericId);
      
      if (error) {
        console.error('Supabase budget delete error:', error);
        throw error;
      }
      
      console.log('Successfully deleted budget ID:', numericId);
      await api.logs.create('Delete Budget', `Deleted budget ID ${numericId}`);
    },
  },

  summary: {
    get: async (userId?: string, startDate?: string, endDate?: string): Promise<Summary> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const targetUserId = userId || user.id;

      let query = supabase
        .from('transactions')
        .select('amount, type, date, category_id, categories(name, color)')
        .eq('user_id', targetUserId);
      
      if (startDate) {
        query = query.gte('date', startDate);
      }
      if (endDate) {
        query = query.lte('date', endDate);
      }

      const { data: transactions, error } = await query;
      
      if (error) throw error;

      let totalIncome = 0;
      let totalExpense = 0;
      let totalAdjustment = 0;
      const catMap: Record<string, { total: number, color: string }> = {};

      (transactions as any[]).forEach(t => {
        if (t.type === 'income') {
          totalIncome += t.amount;
        } else if (t.type === 'expense') {
          totalExpense += t.amount;
          const catName = t.categories?.name || 'Uncategorized';
          if (!catMap[catName]) {
            catMap[catName] = { total: 0, color: t.categories?.color || '#ccc' };
          }
          catMap[catName].total += t.amount;
        } else if (t.type === 'adjustment') {
          totalAdjustment += t.amount;
        }
      });

      return {
        balance: totalIncome - totalExpense + totalAdjustment,
        totalIncome,
        totalExpense,
        totalAdjustment,
        categorySpending: Object.entries(catMap).map(([name, data]) => ({
          name,
          total: data.total,
          color: data.color
        }))
      };
    },
  },
};
