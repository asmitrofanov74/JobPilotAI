'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/graphql/client';
import { RESUMES_QUERY, CREATE_RESUME_MUTATION, DELETE_RESUME_MUTATION, SET_PRIMARY_RESUME_MUTATION } from '@/lib/graphql';
import { FileText, Upload, Trash2, Star } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { formatFileSize, formatDate } from '@/lib/utils/format';

export default function ResumesPage() {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const { data: resumes, isLoading } = useQuery({
    queryKey: ['resumes'],
    queryFn: async () => {
      const { resumes } = await client.request(RESUMES_QUERY);
      return resumes;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await client.request(DELETE_RESUME_MUTATION, { id });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['resumes'] }),
  });

  const setPrimaryMutation = useMutation({
    mutationFn: async (id: string) => {
      await client.request(SET_PRIMARY_RESUME_MUTATION, { id });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['resumes'] }),
  });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setUploading(true);
    try {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      await client.request(CREATE_RESUME_MUTATION, {
        input: { title: file.name, fileData: base64, mimeType: file.type },
      });
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
    } finally {
      setUploading(false);
    }
  }, [queryClient]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'application/msword': ['.doc'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
    maxFiles: 1,
    disabled: uploading,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Resumes" description="Manage your uploaded resumes" />

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50/50'
        } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          {uploading ? <Spinner /> : <Upload className="w-8 h-8 text-gray-300" />}
          <p className="text-sm font-medium text-gray-700">
            {uploading ? 'Uploading...' : isDragActive ? 'Drop your resume here' : 'Drag & drop or click to upload'}
          </p>
          <p className="text-xs text-gray-400">PDF, DOC, or DOCX</p>
        </div>
      </div>

      {isLoading ? (
        <LoadingState padding="md" />
      ) : resumes?.length === 0 ? (
        <EmptyState icon={FileText} title="No resumes uploaded" description="Upload your first resume to get started" />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {resumes?.map((resume: any) => (
            <Card key={resume.id} hover>
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex gap-1">
                  {!resume.isPrimary && (
                    <button onClick={() => setPrimaryMutation.mutate(resume.id)} className="p-1.5 text-gray-300 hover:text-amber-500 transition-colors" title="Set as primary">
                      <Star className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => deleteMutation.mutate(resume.id)} className="p-1.5 text-gray-300 hover:text-red-500 transition-colors" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="font-medium text-gray-900 truncate">{resume.title}</h3>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                <span>{resume.mimeType?.split('/').pop()?.toUpperCase() || '-'}</span>
                <span>{resume.fileSize ? formatFileSize(resume.fileSize) : '-'}</span>
              </div>
              {resume.isPrimary && <Badge variant="amber" dot>Primary</Badge>}
              <p className="mt-3 text-xs text-gray-400">Uploaded {formatDate(resume.createdAt)}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
