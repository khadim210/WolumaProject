import { supabase } from '../services/supabaseService';

export interface UploadedFile {
  name: string;
  path: string;
  size: number;
  type: string;
  url: string;
}

export const uploadFile = async (
  projectId: string,
  file: File
): Promise<UploadedFile> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `${projectId}/${fileName}`;

  const { data, error } = await supabase.storage
    .from('submission-files')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    throw new Error(`File upload failed: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from('submission-files')
    .getPublicUrl(filePath);

  return {
    name: file.name,
    path: data.path,
    size: file.size,
    type: file.type,
    url: urlData.publicUrl
  };
};

export const deleteFile = async (filePath: string): Promise<void> => {
  const { error } = await supabase.storage
    .from('submission-files')
    .remove([filePath]);

  if (error) {
    throw new Error(`File deletion failed: ${error.message}`);
  }
};

export const getFileUrl = (filePath: string): string => {
  const { data } = supabase.storage
    .from('submission-files')
    .getPublicUrl(filePath);

  return data.publicUrl;
};

export const downloadFile = async (filePath: string): Promise<Blob> => {
  const { data, error } = await supabase.storage
    .from('submission-files')
    .download(filePath);

  if (error) {
    throw new Error(`File download failed: ${error.message}`);
  }

  return data;
};

export const listProjectFiles = async (projectId: string): Promise<UploadedFile[]> => {
  const { data, error } = await supabase.storage
    .from('submission-files')
    .list(projectId);

  if (error) {
    throw new Error(`Failed to list files: ${error.message}`);
  }

  return data.map(file => ({
    name: file.name,
    path: `${projectId}/${file.name}`,
    size: file.metadata?.size || 0,
    type: file.metadata?.mimetype || '',
    url: getFileUrl(`${projectId}/${file.name}`)
  }));
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};
