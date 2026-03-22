import imageCompression from 'browser-image-compression';

export interface CloudinaryResponse {
  secure_url: string;
  public_id: string;
}

export const uploadToCloudinary = async (file: File): Promise<CloudinaryResponse> => {
  try {
    // 1. Compress image before upload for speed and cost
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true
    };
    const compressedFile = await imageCompression(file, options);

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || (process.env as any).VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || (process.env as any).VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      throw new Error('Cloudinary configuration is missing. Please set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in your AI Studio Secrets.');
    }

    // 2. Prepare upload data for unsigned upload
    const formData = new FormData();
    formData.append('file', compressedFile);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', 'solemate_products');

    // 3. Upload to Cloudinary
    const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json();
      console.error('Cloudinary API Error:', errorData);
      throw new Error(errorData.error?.message || `Upload failed with status ${uploadResponse.status}`);
    }

    return await uploadResponse.json();
  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    throw error;
  }
};
