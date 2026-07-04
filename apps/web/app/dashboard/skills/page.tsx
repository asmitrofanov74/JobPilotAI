'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/graphql/client';
import { SKILL_GAP_REPORTS_QUERY, ANALYZE_SKILL_GAP_MUTATION } from '@/lib/graphql';
import { TrendingUp, Zap, Target, Loader2 } from 'lucide-react';
import { useState } from 'react';

export default function SkillsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [userSkills, setUserSkills] = useState('');
  const [result, setResult] = useState<any>(null);

  const { data: reports, isLoading } = useQuery({
    queryKey: ['skillGapReports'],
    queryFn: async () => {
      const { skillGapReports } = await client.request(SKILL_GAP_REPORTS_QUERY);
      return skillGapReports;
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const { analyzeSkillGap } = await client.request(ANALYZE_SKILL_GAP_MUTATION, {
        input: {
          jobTitle,
          companyName,
          jobDescription,
          userSkills: userSkills.split(',').map((s) => s.trim()).filter(Boolean),
        },
      });
      return analyzeSkillGap;
    },
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ['skillGapReports'] });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Skill Gap Analysis</h1>
        <p className="text-gray-500 mt-1">Compare your skills against job requirements</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Analyze a New Job</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Zap className="w-4 h-4" />
            {showForm ? 'Hide Form' : 'New Analysis'}
          </button>
        </div>

        {showForm && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Description</label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Skills (comma separated)</label>
              <textarea
                value={userSkills}
                onChange={(e) => setUserSkills(e.target.value)}
                rows={2}
                placeholder="e.g. JavaScript, React, Node.js, Python"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                required
              />
            </div>
            <button
              onClick={() => analyzeMutation.mutate()}
              disabled={analyzeMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {analyzeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
              Analyze Skills
            </button>
          </div>
        )}
      </div>

      {result && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Analysis Results</h2>
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="text-4xl font-bold text-blue-600">{result.matchScore}%</div>
              <div className="text-sm text-gray-500">Match Score</div>
            </div>
            <div className="flex-1 max-w-md">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all"
                  style={{ width: `${result.matchScore}%` }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {result.requiredSkills?.map((skill: string, i: number) => (
                  <span
                    key={i}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      result.missingSkills?.includes(skill)
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-green-50 text-green-700 border border-green-200'
                    }`}
                  >
                    {skill}
                    {result.missingSkills?.includes(skill) && ' (missing)'}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Your Skills</h3>
              <div className="flex flex-wrap gap-2">
                {userSkills.split(',').map((skill, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    {skill.trim()}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Recommendations</h3>
            <ul className="space-y-2">
              {result.recommendations?.map((rec: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Previous Reports</h2>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : reports?.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No reports yet</h3>
            <p className="text-gray-500">Run your first skill gap analysis</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports?.map((report: any) => (
              <div key={report.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{report.jobTitle}</h3>
                    <p className="text-sm text-gray-500">{report.companyName}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-blue-600">{report.matchScore}%</div>
                    <p className="text-xs text-gray-400">{new Date(report.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${report.matchScore}%` }}
                  />
                </div>
                {report.missingSkills?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {report.missingSkills.map((s: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
