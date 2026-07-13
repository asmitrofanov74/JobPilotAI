'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useRegister } from '@/lib/hooks/use-auth';
import { AuthLayout } from '@/components/ui/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';

export default function RegisterPage() {
  const router = useRouter();
  const register = useRegister();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      await register.mutateAsync({ email, password, firstName, lastName });
      toast.success('Account created!');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err?.response?.errors?.[0]?.message || 'Registration failed');
    }
  }

  return (
    <AuthLayout
      leftContent={
        <>
          <h2 className="text-3xl font-bold text-white mb-3">Join thousands of professionals</h2>
          <p className="text-white/60 text-lg">Land your dream job with AI-powered tools.</p>
          <div className="flex flex-wrap gap-3 mt-8">
            {['Free forever', 'AI-powered tools', 'Smart analytics'].map((tag) => (
              <span key={tag} className="px-3 py-1.5 bg-white/5 text-white/70 text-sm rounded-lg border border-white/10">
                {tag}
              </span>
            ))}
          </div>
        </>
      }
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Create account</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Start your AI-powered job search</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          <Input label="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        </div>
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" required />
        <PasswordInput
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          required
          minLength={8}
        />
        <Input label="Confirm password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat your password" required minLength={8} />
        <Button type="submit" loading={register.isPending} className="w-full">
          Create account
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
        Already have an account?{' '}
        <a href="/login" className="text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-700 dark:hover:text-blue-300">
          Sign in
        </a>
      </p>
    </AuthLayout>
  );
}
