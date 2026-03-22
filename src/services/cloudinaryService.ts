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

    // 2. Get signature from server
    const signResponse = await fetch('/api/cloudinary/sign');
    if (!signResponse.ok) {
      const errorText = await signResponse.text();
      throw new Error(`Failed to get Cloudinary signature: ${errorText}`);
    }
    const { signature, timestamp, cloudName, apiKey } = await signResponse.json();

    if (!signature || !cloudName || !apiKey) {
      throw new Error('Cloudinary configuration is missing on the server. Please check your AI Studio Secrets.');
    }

    // 3. Prepare upload data
    const formData = new FormData();
    formData.append('file', compressedFile);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);
    formData.append('folder', 'solemate_products');

    // 4. Upload to Cloudinary
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
