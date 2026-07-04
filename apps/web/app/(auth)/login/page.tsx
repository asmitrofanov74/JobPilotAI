'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useLogin } from '@/lib/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Eye, EyeOff } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function LoginPage() {
  const router = useRouter();
  const login = useLogin();
  const [email, setEmail] = useState('demo@jobpilot.ai');
  const [password, setPassword] = useState('demo1234');
  const [show, setShow] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await login.mutateAsync({ email, password });
      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err?.response?.errors?.[0]?.message || 'Login failed');
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(59,130,246,0.15)_0%,_transparent_60%)]" />
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="relative max-w-md">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <span className="text-white font-semibold text-xl">JobPilot</span>
          </div>
          <blockquote className="text-white/80 text-lg leading-relaxed italic">
            &ldquo;This platform completely transformed how I manage my job search. The AI cover letter generator alone saved me hours.&rdquo;
          </blockquote>
          <div className="flex items-center gap-3 mt-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white text-sm font-bold shrink-0">
              AK
            </div>
            <div>
              <p className="text-white font-medium text-sm">Alex Kim</p>
              <p className="text-white/50 text-xs">Software Engineer at Google</p>
            </div>
          </div>
          <div className="flex items-center gap-6 mt-12 text-white/20 text-xs">
            <span>AI Cover Letters</span>
            <span>Skill Analysis</span>
            <span>Application Tracking</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-gray-950">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <span className="font-bold text-xl text-gray-900 dark:text-gray-100">JobPilot</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Welcome back</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
              />
            </div>

            <div className="relative">
              <Input
                label="Password"
                type={show ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-3 bottom-[9px] text-gray-400 hover:text-gray-600"
              >
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <Button type="submit" loading={login.isPending} className="w-full">
              Sign in
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            Don&apos;t have an account?{' '}
            <a href="/register" className="text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-700 dark:hover:text-blue-300">
              Sign up
            </a>
          </p>

          <Card padding="sm" className="mt-8">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Demo Credentials</p>
            <div className="space-y-1 text-sm">
              <p className="text-gray-700 dark:text-gray-300"><span className="text-gray-400 dark:text-gray-500">Email:</span> demo@jobpilot.ai</p>
              <p className="text-gray-700 dark:text-gray-300"><span className="text-gray-400 dark:text-gray-500">Password:</span> demo1234</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
