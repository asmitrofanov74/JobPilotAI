'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useLogin } from '@/lib/hooks/use-auth';
import { AuthLayout } from '@/components/ui/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { PasswordInput } from '@/components/ui/password-input';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function LoginPage() {
  const router = useRouter();
  const login = useLogin();
  const [email, setEmail] = useState('demo@jobpilot.ai');
  const [password, setPassword] = useState('demo1234');

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
    <AuthLayout
      showThemeToggle
      ThemeToggle={<ThemeToggle />}
      leftContent={
        <>
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
        </>
      }
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Welcome back</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Sign in to your account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@company.com"
          required
        />

        <PasswordInput
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
        />

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
    </AuthLayout>
  );
}
