'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useLogin } from '@/lib/hooks/use-auth';
import { AuthLayout } from '@/components/ui/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { PasswordInput } from '@/components/ui/password-input';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LanguageSwitcher } from '@/components/ui/language-switcher';

export default function LoginPage() {
  const router = useRouter();
  const login = useLogin();
  const t = useTranslations('auth.login');
  const [email, setEmail] = useState('demo@jobpilot.ai');
  const [password, setPassword] = useState('demo1234');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await login.mutateAsync({ email, password });
      toast.success(t('welcomeBack'));
      router.push('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error
        ? (err as unknown as { response?: { errors?: Array<{ message: string }> } }).response?.errors?.[0]?.message || err.message
        : t('loginFailed');
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
          <blockquote className="text-white/80 text-lg leading-relaxed italic">
            &ldquo;{t('testimonial')}&rdquo;
          </blockquote>
          <div className="flex items-center gap-3 mt-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white text-sm font-bold shrink-0">
              AK
            </div>
            <div>
              <p className="text-white font-medium text-sm">{t('testimonialName')}</p>
              <p className="text-white/50 text-xs">{t('testimonialRole')}</p>
            </div>
          </div>
          <div className="flex items-center gap-6 mt-12 text-white/20 text-xs">
            <span>{t('features.coverLetters')}</span>
            <span>{t('features.skillAnalysis')}</span>
            <span>{t('features.applicationTracking')}</span>
          </div>
        </>
      }
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">{t('title')}</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">{t('subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label={t('email')}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@company.com"
          required
        />

        <PasswordInput
          label={t('password')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('passwordPlaceholder')}
          required
        />

        <Button type="submit" loading={login.isPending} className="w-full">
          {t('submit')}
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
        {t('noAccount')}{' '}
        <a href="/register" className="text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-700 dark:hover:text-blue-300">
          {t('signUp')}
        </a>
      </p>

      <Card padding="sm" className="mt-8">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">{t('demoCredentials')}</p>
        <div className="space-y-1 text-sm">
          <p className="text-gray-700 dark:text-gray-300"><span className="text-gray-400 dark:text-gray-500">Email:</span> demo@jobpilot.ai</p>
          <p className="text-gray-700 dark:text-gray-300"><span className="text-gray-400 dark:text-gray-500">Password:</span> demo1234</p>
        </div>
      </Card>
    </AuthLayout>
  );
}
