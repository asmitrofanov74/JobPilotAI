'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useRegister } from '@/lib/hooks/use-auth';
import { AuthLayout } from '@/components/ui/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LanguageSwitcher } from '@/components/ui/language-switcher';

export default function RegisterPage() {
  const router = useRouter();
  const register = useRegister();
  const t = useTranslations('auth.register');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error(t('passwordMismatch'));
      return;
    }
    try {
      await register.mutateAsync({ email, password, firstName, lastName });
      toast.success(t('accountCreated'));
      router.push('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error
        ? (err as unknown as { response?: { errors?: Array<{ message: string }> } }).response?.errors?.[0]?.message || err.message
        : t('registrationFailed');
      toast.error(message);
    }
  }

  return (
    <AuthLayout
      showThemeToggle
      ThemeToggle={<ThemeToggle />}
      LanguageSwitcher={<LanguageSwitcher />}
      leftContent={
        <>
          <h2 className="text-3xl font-bold text-white mb-3">{t('title')}</h2>
          <p className="text-white/60 text-lg">{t('subtitle')}</p>
          <div className="flex flex-wrap gap-3 mt-8">
            {[t('features.free'), t('features.aiTools'), t('features.analytics')].map((tag) => (
              <span key={tag} className="px-3 py-1.5 bg-white/5 text-white/70 text-sm rounded-lg border border-white/10">
                {tag}
              </span>
            ))}
          </div>
        </>
      }
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">{t('submit')}</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">{t('subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label={t('firstName')} value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          <Input label={t('lastName')} value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        </div>
        <Input label={t('email')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" required />
        <PasswordInput
          label={t('password')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('passwordHint')}
          required
          minLength={8}
        />
        <Input label={t('confirmPassword')} type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder={t('passwordRepeat')} required minLength={8} />
        <Button type="submit" loading={register.isPending} className="w-full">
          {t('submit')}
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
        {t('hasAccount')}{' '}
        <a href="/login" className="text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-700 dark:hover:text-blue-300">
          {t('signIn')}
        </a>
      </p>
    </AuthLayout>
  );
}
