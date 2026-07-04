'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/graphql/client';
import { RESUMES_QUERY, CREATE_RESUME_MUTATION, DELETE_RESUME_MUTATION, SET_PRIMARY_RESUME_MUTATION } from '@/lib/graphql';
import { FileText, Upload, Trash2, Star, Loader2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

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
        input: {
          title: file.name,
          fileData: base64,
          mimeType: file.type,
        },
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Resumes</h1>
        <p className="text-gray-500 mt-1">Manage your uploaded resumes</p>
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
        } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          {uploading ? (
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          ) : (
            <Upload className="w-8 h-8 text-gray-400" />
          )}
          <p className="text-sm font-medium text-gray-700">
            {uploading ? 'Uploading...' : isDragActive ? 'Drop your resume here' : 'Drag & drop or click to upload'}
          </p>
          <p className="text-xs text-gray-500">PDF, DOC, or DOCX</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : resumes?.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No resumes uploaded</h3>
          <p className="text-gray-500">Upload your first resume to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resumes?.map((resume: any) => (
            <div key={resume.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex gap-1">
                  {!resume.isPrimary && (
                    <button
                      onClick={() => setPrimaryMutation.mutate(resume.id)}
                      className="p-1.5 text-gray-400 hover:text-amber-500 transition-colors"
                      title="Set as primary"
                    >
                      <Star className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteMutation.mutate(resume.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="font-medium text-gray-900 truncate">{resume.title}</h3>
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                <span>{resume.mimeType?.split('/').pop()?.toUpperCase() || '-'}</span>
                <span>{resume.fileSize ? formatFileSize(resume.fileSize) : '-'}</span>
              </div>
              {resume.isPrimary && (
                <span className="inline-flex items-center gap-1 mt-3 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                  <Star className="w-3 h-3" />
                  Primary
                </span>
              )}
              <p className="mt-3 text-xs text-gray-400">
                Uploaded {new Date(resume.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
