import React, { ErrorInfo, ReactNode } from 'react';
import { AlertCircle, Home, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-brand-bg flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center space-y-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-brand-accent/20 blur-3xl rounded-full" />
              <div className="relative bg-white p-12 rounded-[40px] shadow-2xl border border-black/5">
                <div className="w-24 h-24 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-8">
                  <AlertCircle className="w-12 h-12 text-red-500" />
                </div>
                
                <h1 className="text-4xl font-black text-zinc-900 tracking-tighter mb-2">Oops!</h1>
                <h2 className="text-xl font-bold text-zinc-900 mb-4">Something went wrong</h2>
                <p className="text-zinc-500 mb-8 leading-relaxed">
                  We encountered an unexpected error. Don't worry, your data is safe.
                </p>

                <div className="grid grid-cols-1 gap-4">
                  <button
                    onClick={() => window.location.reload()}
                    className="flex items-center justify-center gap-2 bg-brand-accent text-white py-4 rounded-2xl font-bold hover:bg-brand-accent-hover transition-all shadow-xl shadow-brand-accent/20"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Reload Page
                  </button>
                  
                  <a
                    href="/dashboard"
                    className="flex items-center justify-center gap-2 bg-zinc-100 text-zinc-600 py-4 rounded-2xl font-bold hover:bg-zinc-200 transition-all"
                  >
                    <Home className="w-5 h-5" />
                    Back to Dashboard
                  </a>
                </div>
              </div>
            </motion.div>

            <p className="text-zinc-400 text-sm font-medium">
              ExpenseTracker &copy; {new Date().getFullYear()}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
