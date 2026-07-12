'use client';

import { useMutation } from '@tanstack/react-query';
import { client } from '@/lib/graphql/client';
import { UPDATE_PROFILE_MUTATION } from '@/lib/graphql';
import { useMe } from '@/lib/hooks/use-me';
import { useAuthStore } from '@/lib/auth-store';
import { Settings, Crown, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingState } from '@/components/ui/loading-state';
import { EXPERIENCE_LEVELS } from '@/lib/constants';

export default function SettingsPage() {
  const { data: me, isLoading } = useMe();
  const setUser = useAuthStore((s) => s.setUser);
  const [form, setForm] = useState({
    firstName: '', lastName: '', title: '', targetRole: '', experienceLevel: '', targetLocations: '',
  });

  useEffect(() => {
    if (me) {
      setForm({
        firstName: me.firstName || '',
        lastName: me.lastName || '',
        title: me.title || '',
        targetRole: me.targetRole || '',
        experienceLevel: me.experienceLevel || '',
        targetLocations: me.targetLocations || '',
      });
    }
  }, [me]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { updateProfile } = await client.request(UPDATE_PROFILE_MUTATION, {
        input: { ...form, targetLocations: form.targetLocations || null },
      });
      return updateProfile;
    },
    onSuccess: (data) => setUser(data),
  });

  if (isLoading || !me) {
    return <LoadingState padding="lg" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your profile and preferences" />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card padding="lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                <Settings className="w-5 h-5 text-gray-500" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <Input label="First Name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              <Input label="Last Name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Senior Software Engineer" />
              <Input label="Target Role" value={form.targetRole} onChange={(e) => setForm({ ...form, targetRole: e.target.value })} placeholder="e.g. Staff Engineer" />
              <Select label="Experience Level" value={form.experienceLevel} onChange={(e) => setForm({ ...form, experienceLevel: e.target.value })}>
                {EXPERIENCE_LEVELS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
              <Input label="Target Locations" value={form.targetLocations} onChange={(e) => setForm({ ...form, targetLocations: e.target.value })} placeholder="e.g. SF, NY, Remote" />
            </div>
            <div className="mt-6">
              <Button onClick={() => updateMutation.mutate()} loading={updateMutation.isPending}>
                Save Changes
              </Button>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card padding="lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                <Crown className="w-5 h-5 text-amber-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Subscription</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Plan</span>
                <span className="text-sm font-semibold text-gray-900 capitalize">{me.subscription?.tier || 'Free'}</span>
              </div>
              {me.subscription?.currentPeriodEnd && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Renewal Date</span>
                  <span className="text-sm font-semibold text-gray-900">{new Date(me.subscription.currentPeriodEnd).toLocaleDateString()}</span>
                </div>
              )}
              <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                <Calendar className="w-4 h-4 text-gray-300" />
                <span className="text-xs text-gray-400">Member since {new Date(me.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </Card>

          <Card padding="lg">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Account</h2>
            <div className="space-y-2 text-sm text-gray-600">
              <p><span className="text-gray-400">Email:</span> {me.email}</p>
              <p><span className="text-gray-400">User ID:</span> <span className="text-xs">{me.id}</span></p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
