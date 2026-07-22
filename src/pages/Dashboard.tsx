import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';
import { Summary, Transaction, Budget } from '../types';
import { TrendingUp, TrendingDown, Wallet, Plus, ShieldCheck, CheckCircle2, Calendar, ChevronDown, AlertTriangle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { motion } from 'motion/react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { getMonthOptions } from '../lib/dateUtils';

import LoadingSpinner from '../components/LoadingSpinner';
import UserBadge from '../components/UserBadge';
import { IconRenderer } from '../components/IconRenderer';

export default function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [budgetWarnings, setBudgetWarnings] = useState<{name: string, spent: number, budget: number, percentage: number}[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);
    
    const startIso = start.toISOString();
    const endIso = end.toISOString();

    setLoading(true);
    Promise.all([
      api.summary.get(undefined, startIso, endIso),
      api.transactions.getAll(),
      api.budgets.getAll()
    ]).then(([s, t, b]) => {
      setSummary(s);
      // Filter transactions for selected month for the recent list
      const filteredTransactions = t.filter(trans => trans.date >= startIso && trans.date <= endIso);
      setRecentTransactions(filteredTransactions.slice(0, 5));

      const monthBudgets = b.filter(budget => budget.month === selectedMonth);
      const warnings: {name: string, spent: number, budget: number, percentage: number}[] = [];
      
      for (const budget of monthBudgets) {
        if (!budget.category_name) continue;
        
        const spentObj = s.categorySpending.find(cat => cat.name === budget.category_name);
        const spent = spentObj ? spentObj.total : 0;
        
        if (budget.amount > 0 && (spent / budget.amount) >= 0.8) {
          warnings.push({
            name: budget.category_name,
            spent,
            budget: budget.amount,
            percentage: Math.round((spent / budget.amount) * 100)
          });
        }
      }
      setBudgetWarnings(warnings);
    }).finally(() => setLoading(false));
  }, [selectedMonth]);

  if (loading) return <LoadingSpinner message="Loading your dashboard..." />;
  const stats = [
    { name: 'Total Balance', value: summary?.balance || 0, icon: Wallet, color: 'bg-brand-primary', textColor: 'text-white' },
    { name: 'Total Income', value: summary?.totalIncome || 0, icon: TrendingUp, color: 'bg-emerald-50', textColor: 'text-emerald-600' },
    { name: 'Total Expenses', value: summary?.totalExpense || 0, icon: TrendingDown, color: 'bg-red-50', textColor: 'text-red-600' },
    { name: 'Total Adjustments', value: summary?.totalAdjustment || 0, icon: CheckCircle2, color: 'bg-emerald-50', textColor: 'text-emerald-600' },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary text-2xl font-bold overflow-hidden border-2 border-white shadow-sm relative shrink-0">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              (user?.name || 'U').charAt(0)
            )}
            <div className="absolute bottom-0 right-0">
              {user?.role === 'admin' ? (
                <div className="bg-red-500 p-0.5 rounded-md shadow-sm">
                  <ShieldCheck className="w-3 h-3 text-white" />
                </div>
              ) : (
                <img 
                  src="https://chatter.retrytech.site/asset/image/verified.svg" 
                  alt="Verified" 
                  className="w-4 h-4"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Dashboard</h1>
            <p className="text-zinc-500 flex items-center gap-1">
              Welcome back, {user?.name}
              <UserBadge role={user?.role} className="ml-0.5" />
              ! Here's your {selectedMonth === format(new Date(), 'yyyy-MM') ? 'monthly' : format(new Date(selectedMonth), 'MMMM yyyy')} summary.
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-black/5 shadow-sm">
            <Calendar className="w-4 h-4 ml-3 text-zinc-400" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent px-3 py-2 text-sm font-bold outline-none appearance-none cursor-pointer pr-8"
            >
              {getMonthOptions(60).map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 -ml-7 mr-3 text-zinc-400 pointer-events-none" />
          </div>
          <button 
            onClick={() => navigate('/transactions?add=true')}
            className="flex items-center justify-center gap-2 bg-brand-accent text-white px-6 py-3 rounded-2xl font-bold hover:bg-brand-accent-hover transition-all shadow-xl shadow-brand-accent/20"
          >
            <Plus className="w-5 h-5" />
            Add Transaction
          </button>
        </div>
      </header>

      {budgetWarnings.length > 0 && (
        <div className="space-y-4">
          {budgetWarnings.map((warning, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`border p-4 rounded-3xl flex items-center gap-4 ${
                warning.percentage >= 100 
                  ? 'bg-red-50 border-red-200 text-red-900' 
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
            >
              <div className={`p-3 rounded-2xl ${
                warning.percentage >= 100 ? 'bg-red-100' : 'bg-amber-100'
              }`}>
                <AlertTriangle className={`w-6 h-6 ${
                  warning.percentage >= 100 ? 'text-red-600' : 'text-amber-600'
                }`} />
              </div>
              <div>
                <p className="font-bold text-lg">
                  {warning.percentage >= 100 ? 'Budget Exceeded:' : 'Budget Warning:'} {warning.name}
                </p>
                <p className={`text-sm ${warning.percentage >= 100 ? 'text-red-700' : 'text-amber-700'}`}>
                  You have spent {warning.percentage}% (₹{warning.spent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}) of your ₹{warning.budget.toLocaleString('en-IN', { maximumFractionDigits: 0 })} budget for this month.
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl ${stat.color}`}>
                <stat.icon className={`w-6 h-6 ${stat.name === 'Total Balance' ? 'text-white' : stat.textColor}`} />
              </div>
            </div>
            <p className="text-zinc-500 text-sm font-medium">{stat.name}</p>
            <p className="text-2xl sm:text-3xl font-bold tracking-tight mt-1 truncate">
              ₹{stat.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Spending by Category */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm"
        >
          <h2 className="text-xl font-bold mb-6">Spending by Category</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={summary?.categorySpending || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="total"
                >
                  {summary?.categorySpending.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Recent Transactions</h2>
            <button className="text-sm font-bold text-zinc-400 hover:text-black transition-colors">View All</button>
          </div>
          <div className="space-y-4">
            {recentTransactions.length === 0 ? (
              <p className="text-zinc-500 text-center py-10">No transactions yet.</p>
            ) : (
              recentTransactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3 hover:bg-zinc-50 rounded-2xl transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: t.category_color }}>
                      <IconRenderer name={t.category_icon} className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-zinc-900">{t.description || t.category_name}</p>
                      <p className="text-xs text-zinc-500">{format(new Date(t.date), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                  <div className={`font-bold ${t.type === 'income' || t.type === 'adjustment' ? 'text-emerald-600' : 'text-zinc-900'}`}>
                    {t.type === 'income' || t.type === 'adjustment' ? '+' : '-'}₹{t.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
