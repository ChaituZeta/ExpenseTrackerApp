import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  ArrowRight, 
  BarChart3, 
  ShieldCheck, 
  Wallet,
  Activity,
  ArrowUpRight
} from 'lucide-react';
import { useAuth } from '../App';

export default function Home() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) return null;

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 selection:bg-zinc-900 selection:text-white font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#FAFAFA]/80 backdrop-blur-xl border-b border-zinc-200/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-zinc-900 rounded-full flex items-center justify-center text-white font-bold text-lg">
              F
            </div>
            <span className="text-xl font-bold tracking-tight text-zinc-900">FinTrack</span>
          </div>
          
          <div className="hidden md:flex items-center gap-10">
            <a href="#features" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">Platform</a>
            <a href="#solutions" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">Solutions</a>
            <a href="#security" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">Security</a>
          </div>

          <div className="flex items-center gap-6">
            {user ? (
              <Link 
                to="/dashboard" 
                className="bg-zinc-900 text-white px-6 py-2.5 rounded-full font-semibold hover:bg-zinc-800 transition-all text-sm"
              >
                Enter Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm font-semibold text-zinc-600 hover:text-zinc-900 transition-colors">
                  Log in
                </Link>
                <Link 
                  to="/register" 
                  className="bg-zinc-900 text-white px-6 py-2.5 rounded-full font-semibold hover:bg-zinc-800 transition-all text-sm shadow-md"
                >
                  Start free
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-48 pb-32 px-6 overflow-hidden relative">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 max-w-2xl"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-200 bg-white text-xs font-semibold uppercase tracking-widest mb-8 text-zinc-500">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                FinTrack 2.0 is live
              </div>
              <h1 className="text-5xl md:text-7xl font-semibold tracking-tighter text-zinc-900 leading-[1.05] mb-8">
                Clarity for your <br />
                <span className="text-zinc-400">capital.</span>
              </h1>
              <p className="text-lg md:text-xl text-zinc-500 leading-relaxed mb-10 max-w-lg font-light">
                A disciplined approach to personal finance. Track expenses, forecast budgets, and achieve financial clarity without the noise.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Link 
                  to="/register" 
                  className="w-full sm:w-auto bg-zinc-900 text-white px-8 py-4 rounded-full font-semibold text-base flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all shadow-xl group"
                >
                  Open an account
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link 
                  to="/login"
                  className="w-full sm:w-auto px-8 py-4 rounded-full font-semibold text-base text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors flex items-center justify-center"
                >
                  Sign in to existing
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 relative w-full"
            >
              <div className="relative z-10 bg-white rounded-3xl shadow-2xl shadow-zinc-200/50 border border-zinc-200 p-2 overflow-hidden aspect-[4/3]">
                <img 
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1200" 
                  className="rounded-2xl w-full h-full object-cover object-center"
                  alt="Financial Analytics Dashboard"
                  referrerPolicy="no-referrer"
                />
                
                {/* Floating Metric */}
                <motion.div 
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute bottom-8 left-8 bg-white/90 backdrop-blur-md p-5 rounded-2xl shadow-lg border border-zinc-100 flex items-center gap-4"
                >
                  <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center text-white">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-1">Monthly Cashflow</p>
                    <p className="text-2xl font-bold tracking-tight text-zinc-900">+₹124,500</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Feature Grid / Bento */}
      <section id="features" className="py-32 px-6 bg-white border-t border-zinc-100">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mb-20">
            <h2 className="text-4xl font-semibold tracking-tight text-zinc-900 mb-6">Designed for precision.</h2>
            <p className="text-lg text-zinc-500 font-light">
              Remove the friction from financial management. FinTrack provides institutional-grade tools refined into a beautiful, minimal interface.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <BarChart3 className="w-6 h-6" />,
                title: "Deep Analytics",
                desc: "Real-time charts and spending categorizations to reveal exactly where your money flows.",
                span: "md:col-span-2"
              },
              {
                icon: <ShieldCheck className="w-6 h-6" />,
                title: "Secure by Design",
                desc: "Encrypted data architecture ensuring your financial history remains private.",
                span: "md:col-span-1"
              },
              {
                icon: <Wallet className="w-6 h-6" />,
                title: "Dynamic Budgeting",
                desc: "Set thresholds and receive intelligent alerts before you overspend.",
                span: "md:col-span-1"
              },
              {
                icon: <ArrowUpRight className="w-6 h-6" />,
                title: "Goal Tracking",
                desc: "Visualize your path to financial independence with automated milestone tracking and forecasting.",
                span: "md:col-span-2"
              }
            ].map((feature, i) => (
              <div
                key={i}
                className={`bg-[#FAFAFA] p-10 rounded-[2rem] border border-zinc-100 hover:border-zinc-200 transition-colors ${feature.span}`}
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-6 bg-white border border-zinc-200 text-zinc-900 shadow-sm">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-zinc-900 mb-3 tracking-tight">{feature.title}</h3>
                <p className="text-zinc-500 leading-relaxed font-light">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Simple CTA */}
      <section className="py-40 px-6 bg-zinc-900 text-white text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-8">
            Start tracking today.
          </h2>
          <p className="text-zinc-400 text-lg mb-12 font-light max-w-xl mx-auto">
            Join the professionals who use FinTrack to maintain absolute clarity over their personal capital.
          </p>
          <Link 
            to="/register" 
            className="inline-flex items-center gap-2 bg-white text-zinc-900 px-8 py-4 rounded-full font-semibold text-base hover:bg-zinc-100 transition-colors"
          >
            Create an account
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="py-12 px-6 bg-zinc-950 text-zinc-400 border-t border-zinc-800/50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-zinc-900 font-bold text-xs">
              F
            </div>
            <span className="font-semibold tracking-tight text-zinc-100">FinTrack</span>
          </div>
          
          <div className="flex gap-8 text-sm">
            <a href="#" className="hover:text-white transition-colors">Twitter</a>
            <a href="#" className="hover:text-white transition-colors">GitHub</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
          </div>
          
          <p className="text-sm font-light">&copy; {new Date().getFullYear()} FinTrack. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

