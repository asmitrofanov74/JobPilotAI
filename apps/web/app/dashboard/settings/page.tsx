'use client';

import { useMutation } from '@tanstack/react-query';
import { client } from '@/lib/graphql/client';
import { UPDATE_PROFILE_MUTATION } from '@/lib/graphql';
import { useMe } from '@/lib/hooks/use-me';
import { useAuthStore } from '@/lib/auth-store';
import { Settings, Save, Loader2, Crown, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const { data: me, isLoading } = useMe();
  const setUser = useAuthStore((s) => s.setUser);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    title: '',
    targetRole: '',
    experienceLevel: '',
    targetLocations: '',
  });

  useEffect(() => {
    if (me) {
      setForm({
        firstName: me.firstName || '',
        lastName: me.lastName || '',
        title: me.title || '',
        targetRole: me.targetRole || '',
        experienceLevel: me.experienceLevel || '',
        targetLocations: me.targetLocations?.join(', ') || '',
      });
    }
  }, [me]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { updateProfile } = await client.request(UPDATE_PROFILE_MUTATION, {
        input: {
          ...form,
          targetLocations: form.targetLocations.split(',').map((s) => s.trim()).filter(Boolean),
        },
      });
      return updateProfile;
    },
    onSuccess: (data) => {
      setUser(data);
    },
  });

  if (isLoading || !me) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your profile and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-gray-100">
                <Settings className="w-5 h-5 text-gray-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Senior Software Engineer"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Role</label>
                <input
                  type="text"
                  value={form.targetRole}
                  onChange={(e) => setForm({ ...form, targetRole: e.target.value })}
                  placeholder="e.g. Staff Engineer"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Experience Level</label>
                <select
                  value={form.experienceLevel}
                  onChange={(e) => setForm({ ...form, experienceLevel: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="">Select level</option>
                  <option value="ENTRY">Entry</option>
                  <option value="JUNIOR">Junior</option>
                  <option value="MID">Mid-Level</option>
                  <option value="SENIOR">Senior</option>
                  <option value="LEAD">Lead</option>
                  <option value="EXECUTIVE">Executive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Locations</label>
                <input
                  type="text"
                  value={form.targetLocations}
                  onChange={(e) => setForm({ ...form, targetLocations: e.target.value })}
                  placeholder="e.g. San Francisco, New York, Remote"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => updateMutation.mutate()}
                disabled={updateMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-amber-50">
                <Crown className="w-5 h-5 text-amber-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Subscription</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Plan</span>
                <span className="text-sm font-medium text-gray-900 capitalize">
                  {me.subscription?.tier || 'Free'}
                </span>
              </div>
              {me.subscription?.currentPeriodEnd && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Renewal Date</span>
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(me.subscription.currentPeriodEnd).toLocaleDateString()}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-400">Member since {new Date(me.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Account</h2>
            <div className="space-y-2 text-sm text-gray-600">
              <p><span className="text-gray-400">Email:</span> {me.email}</p>
              <p><span className="text-gray-400">User ID:</span> <span className="text-xs">{me.id}</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
