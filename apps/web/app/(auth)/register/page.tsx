'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useRegister } from '@/lib/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const register = useRegister();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [show, setShow] = useState(false);

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
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(139,92,246,0.15)_0%,_transparent_60%)]" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="relative max-w-md">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <span className="text-white font-semibold text-xl">JobPilot</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Join thousands of professionals</h2>
          <p className="text-white/60 text-lg">Land your dream job with AI-powered tools.</p>
          <div className="flex flex-wrap gap-3 mt-8">
            {['Free forever', 'AI-powered tools', 'Smart analytics'].map((tag) => (
              <span key={tag} className="px-3 py-1.5 bg-white/5 text-white/70 text-sm rounded-lg border border-white/10">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <span className="font-bold text-xl text-gray-900">JobPilot</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Create account</h1>
            <p className="text-gray-500 text-sm">Start your AI-powered job search</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              <Input label="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </div>
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" required />
            <div className="relative">
              <Input label="Password" type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" required minLength={8} />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-3 bottom-[9px] text-gray-400 hover:text-gray-600">
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Input label="Confirm password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat your password" required minLength={8} />
            <Button type="submit" loading={register.isPending} className="w-full">
              Create account
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <a href="/login" className="text-blue-600 font-semibold hover:text-blue-700">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  );
}
