import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  ArrowRight, 
  BarChart3, 
  ShieldCheck, 
  Zap, 
  Wallet, 
  PieChart, 
  Smartphone,
  CheckCircle2,
  Users,
  Star
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
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center text-white font-bold text-xl">
              E
            </div>
            <span className="text-xl font-bold tracking-tight text-zinc-900">ExpenseTracker</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">Features</a>
            <a href="#testimonials" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">Testimonials</a>
            <a href="#pricing" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <Link 
                to="/dashboard" 
                className="bg-brand-primary text-white px-6 py-2.5 rounded-xl font-bold hover:bg-brand-primary/90 transition-all"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm font-bold text-zinc-900 hover:text-brand-primary transition-colors">
                  Sign In
                </Link>
                <Link 
                  to="/register" 
                  className="bg-brand-primary text-white px-6 py-2.5 rounded-xl font-bold hover:bg-brand-primary/90 transition-all shadow-lg shadow-brand-primary/20"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold uppercase tracking-wider mb-6">
                <Zap className="w-3 h-3" />
                Smart Finance Management
              </div>
              <h1 className="text-6xl md:text-7xl font-bold tracking-tight text-zinc-900 leading-[1.1] mb-8">
                Master Your Money with <span className="text-brand-primary">Precision.</span>
              </h1>
              <p className="text-xl text-zinc-500 leading-relaxed mb-10 max-w-lg">
                The ultimate expense tracker for modern professionals. Track, analyze, and optimize your finances with AI-powered insights.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Link 
                  to="/register" 
                  className="w-full sm:w-auto bg-brand-primary text-white px-8 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-brand-primary/90 transition-all shadow-2xl shadow-brand-primary/20 group"
                >
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <div className="flex items-center gap-4 px-6 py-4">
                  <div className="flex -space-x-3">
                    {[1,2,3,4].map(i => (
                      <img 
                        key={i}
                        src={`https://i.pravatar.cc/100?img=${i+10}`} 
                        className="w-10 h-10 rounded-full border-2 border-white"
                        alt="User"
                        referrerPolicy="no-referrer"
                      />
                    ))}
                  </div>
                  <div className="text-sm">
                    <div className="flex items-center gap-1 text-amber-500">
                      {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 fill-current" />)}
                    </div>
                    <p className="text-zinc-500 font-medium">Trusted by 10k+ users</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative z-10 bg-white rounded-[3rem] shadow-2xl border border-zinc-100 p-4">
                <img 
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1000" 
                  className="rounded-[2.5rem] w-full shadow-inner"
                  alt="Dashboard Preview"
                  referrerPolicy="no-referrer"
                />
                
                {/* Floating Elements */}
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute -top-6 -right-6 bg-white p-6 rounded-3xl shadow-xl border border-zinc-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-50 rounded-2xl text-green-600">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Savings</p>
                      <p className="text-xl font-bold text-zinc-900">+₹45,200</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 5, repeat: Infinity, delay: 1 }}
                  className="absolute -bottom-6 -left-6 bg-white p-6 rounded-3xl shadow-xl border border-zinc-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-brand-primary/10 rounded-2xl text-brand-primary">
                      <PieChart className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Budget Status</p>
                      <p className="text-xl font-bold text-zinc-900">92% Efficient</p>
                    </div>
                  </div>
                </motion.div>
              </div>
              
              {/* Background Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-brand-primary/5 rounded-full blur-3xl -z-10" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="text-4xl font-bold tracking-tight text-zinc-900 mb-6">Everything you need to manage your wealth</h2>
            <p className="text-lg text-zinc-500">Powerful tools designed to give you complete control over your financial future.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <BarChart3 className="w-8 h-8" />,
                title: "Advanced Analytics",
                desc: "Deep dive into your spending habits with interactive charts and AI-driven insights.",
                color: "blue"
              },
              {
                icon: <ShieldCheck className="w-8 h-8" />,
                title: "Bank-Grade Security",
                desc: "Your data is encrypted and protected with the highest security standards.",
                color: "green"
              },
              {
                icon: <Wallet className="w-8 h-8" />,
                title: "Smart Budgeting",
                desc: "Set intelligent budgets that adapt to your lifestyle and help you save more.",
                color: "purple"
              },
              {
                icon: <Smartphone className="w-8 h-8" />,
                title: "Mobile First",
                desc: "Access your finances on the go with our fully responsive mobile experience.",
                color: "orange"
              },
              {
                icon: <Zap className="w-8 h-8" />,
                title: "Instant Sync",
                desc: "Real-time synchronization across all your devices. Never miss a transaction.",
                color: "cyan"
              },
              {
                icon: <CheckCircle2 className="w-8 h-8" />,
                title: "Goal Tracking",
                desc: "Set financial goals and track your progress with automated milestones.",
                color: "emerald"
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -5 }}
                className="bg-white p-10 rounded-[2.5rem] border border-zinc-100 shadow-sm hover:shadow-xl transition-all"
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 bg-zinc-50 text-zinc-900`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-4">{feature.title}</h3>
                <p className="text-zinc-500 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 border-y border-zinc-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-50 grayscale">
            <Users className="w-32 h-8" />
            <Zap className="w-32 h-8" />
            <ShieldCheck className="w-32 h-8" />
            <Wallet className="w-32 h-8" />
            <PieChart className="w-32 h-8" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-brand-primary rounded-[4rem] p-12 md:p-24 text-center relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 tracking-tight">
                Ready to take control of <br />your financial life?
              </h2>
              <p className="text-brand-primary-light/80 text-xl mb-12 max-w-xl mx-auto">
                Join thousands of users who are already saving more and spending smarter with ExpenseTracker.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link 
                  to="/register" 
                  className="w-full sm:w-auto bg-white text-brand-primary px-10 py-5 rounded-2xl font-bold text-lg hover:bg-zinc-50 transition-all shadow-xl"
                >
                  Create Free Account
                </Link>
                <Link 
                  to="/login" 
                  className="w-full sm:w-auto bg-brand-primary-dark text-white border border-white/20 px-10 py-5 rounded-2xl font-bold text-lg hover:bg-white/10 transition-all"
                >
                  Sign In Now
                </Link>
              </div>
            </div>
            
            {/* Background Pattern */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2" />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 bg-zinc-50 border-t border-zinc-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-12 mb-20">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center text-white font-bold">
                  E
                </div>
                <span className="text-lg font-bold tracking-tight text-zinc-900">ExpenseTracker</span>
              </div>
              <p className="text-zinc-500 max-w-sm leading-relaxed">
                The most advanced financial management platform for modern professionals. Built with security and simplicity at its core.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-zinc-900 mb-6 uppercase text-xs tracking-widest">Product</h4>
              <ul className="space-y-4 text-sm text-zinc-500">
                <li><a href="#" className="hover:text-brand-primary transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-brand-primary transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-brand-primary transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-brand-primary transition-colors">Mobile App</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-zinc-900 mb-6 uppercase text-xs tracking-widest">Company</h4>
              <ul className="space-y-4 text-sm text-zinc-500">
                <li><a href="#" className="hover:text-brand-primary transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-brand-primary transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-brand-primary transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-brand-primary transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-zinc-200 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-zinc-500">&copy; 2026 ExpenseTracker. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-zinc-400 hover:text-zinc-900 transition-colors"><Twitter className="w-5 h-5" /></a>
              <a href="#" className="text-zinc-400 hover:text-zinc-900 transition-colors"><Github className="w-5 h-5" /></a>
              <a href="#" className="text-zinc-400 hover:text-zinc-900 transition-colors"><Linkedin className="w-5 h-5" /></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Missing icons for the template
function TrendingUp(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

function Twitter(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
    </svg>
  );
}

function Github(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

function Linkedin(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}
