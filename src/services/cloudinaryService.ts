import imageCompression from 'browser-image-compression';
import { logSystemError } from './loggingService';

export interface CloudinaryResponse {
  secure_url: string;
  public_id: string;
}

export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
}

/**
 * Resolves Cloudinary configuration from SiteSettings, localStorage, or environment variables.
 */
export const getCloudinaryConfig = (overrideConfig?: Partial<CloudinaryConfig>): CloudinaryConfig => {
  const localCloudName = typeof window !== 'undefined' ? localStorage.getItem('solemate_cloudinary_cloud_name') : null;
  const localPreset = typeof window !== 'undefined' ? localStorage.getItem('solemate_cloudinary_upload_preset') : null;

  const cloudName = (
    overrideConfig?.cloudName ||
    localCloudName ||
    import.meta.env.VITE_CLOUDINARY_CLOUD_NAME ||
    (typeof process !== 'undefined' ? (process.env as any)?.VITE_CLOUDINARY_CLOUD_NAME : '') ||
    ''
  ).trim();

  const uploadPreset = (
    overrideConfig?.uploadPreset ||
    localPreset ||
    import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET ||
    (typeof process !== 'undefined' ? (process.env as any)?.VITE_CLOUDINARY_UPLOAD_PRESET : '') ||
    ''
  ).trim();

  return { cloudName, uploadPreset };
};

export const saveCloudinaryConfig = (cloudName: string, uploadPreset: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('solemate_cloudinary_cloud_name', cloudName.trim());
    localStorage.setItem('solemate_cloudinary_upload_preset', uploadPreset.trim());
  }
};

/**
 * Tests connection to Cloudinary with given credentials
 */
export const testCloudinaryConnection = async (cloudName: string, uploadPreset: string): Promise<{ success: boolean; message: string }> => {
  if (!cloudName || !uploadPreset) {
    return { success: false, message: 'Cloud Name and Upload Preset are both required.' };
  }

  try {
    // Create a 1x1 transparent PNG blob for testing unsigned upload
    const pixelBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAAElFTkSuQmCC';
    const res = await fetch(pixelBase64);
    const blob = await res.blob();

    const formData = new FormData();
    formData.append('file', blob);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', 'solemate_diagnostics');

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData
    });

    const responseData = await response.json();

    if (!response.ok) {
      const errMsg = responseData.error?.message || `HTTP ${response.status}: Failed to authenticate with Cloudinary`;
      await logSystemError('cloudinary', `Diagnostic connection check failed: ${errMsg}`, {
        cloudName,
        uploadPreset,
        status: response.status,
        responseData
      }, 'warn');
      return { success: false, message: errMsg };
    }

    return { success: true, message: 'Connection successful! Cloudinary credentials are valid and active.' };
  } catch (err: any) {
    await logSystemError('cloudinary', `Connection error: ${err.message}`, { cloudName, uploadPreset }, 'error');
    return { success: false, message: err.message || 'Network error connecting to Cloudinary.' };
  }
};

export const uploadToCloudinary = async (file: File, customConfig?: Partial<CloudinaryConfig>): Promise<CloudinaryResponse> => {
  try {
    // 1. Compress image before upload for speed and low bandwidth
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true
    };
    const compressedFile = await imageCompression(file, options);

    const { cloudName, uploadPreset } = getCloudinaryConfig(customConfig);

    if (!cloudName || !uploadPreset) {
      const msg = 'Cloudinary credentials are not configured. Please go to Admin Dashboard > Site Settings > Cloudinary Credentials, or enter an image URL directly.';
      await logSystemError('cloudinary', msg, { fileName: file.name, fileSize: file.size }, 'error');
      throw new Error(msg);
    }

    // 2. Prepare upload data for unsigned upload
    const formData = new FormData();
    formData.append('file', compressedFile);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', 'solemate_products');

    // 3. Upload to Cloudinary API
    const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json().catch(() => ({}));
      const errorMsg = errorData.error?.message || `Upload failed with HTTP status ${uploadResponse.status}`;
      
      console.error('Cloudinary API Error:', errorData);
      await logSystemError('cloudinary', `Upload rejected: ${errorMsg}`, {
        fileName: file.name,
        fileSize: file.size,
        status: uploadResponse.status,
        errorData
      }, 'error');

      if (errorMsg.toLowerCase().includes('preset') || uploadResponse.status === 400 || uploadResponse.status === 401) {
        throw new Error(`${errorMsg}. Please verify your Cloudinary Upload Preset is set to "Unsigned" in your Cloudinary Dashboard Settings > Upload.`);
      }
      throw new Error(errorMsg);
    }

    const data = await uploadResponse.json();
    return data;
  } catch (error: any) {
    console.error('Cloudinary Upload Error:', error);
    if (!error.message.includes('Upload rejected')) {
      await logSystemError('cloudinary', `Upload exception: ${error.message}`, {
        fileName: file.name,
        stack: error.stack
      }, 'error');
    }
    throw error;
  }
};
