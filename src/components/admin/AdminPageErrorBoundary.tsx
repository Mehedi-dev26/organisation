import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RotateCcw, AlertTriangle, LayoutDashboard, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class AdminPageErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[AdminPageErrorBoundary] Unhandled error inside admin page:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleGoToDashboard = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/admin';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-emerald-950/10 p-6 sm:p-8 text-center space-y-5 animate-in fade-in-50 zoom-in-95">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/70 text-amber-800 text-xs font-bold mb-2">
                <span>ত্রুটি ব্যবস্থাপনা</span>
              </div>
              <h2 className="text-xl font-heading font-extrabold text-slate-800">
                {this.props.fallbackTitle || 'এই পৃষ্ঠার ডেটা লোড হতে সমস্যা হয়েছে'}
              </h2>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                সাময়িক ডেটা বা নেটওয়ার্ক ত্রুটির কারণে এই পেজটি লোড করা সম্ভব হয়নি। অ্যাডমিন প্যানেলের অন্যান্য সেকশন সক্রিয় রয়েছে। পুনরায় চেষ্টা করুন।
              </p>
              {this.state.error?.message && (
                <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 font-mono text-left overflow-x-auto max-h-24">
                  {this.state.error.message}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                type="button"
                onClick={this.handleReset}
                className="flex-1 bg-[#0B6B3A] hover:bg-emerald-800 text-white font-bold text-xs h-11 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>পুনরায় চেষ্টা করুন</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={this.handleGoToDashboard}
                className="h-11 rounded-xl border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <LayoutDashboard className="w-4 h-4 text-emerald-700" />
                <span>ড্যাশবোর্ড</span>
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AdminPageErrorBoundary;
