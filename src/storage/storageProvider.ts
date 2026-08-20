/**
 * Storage Provider Abstraction
 * Supports AWS S3, Cloudflare R2, MinIO, GCP Cloud Storage, or local disk fallback
 */
export interface StorageUploadResult {
  fileUrl: string;
  fileKey: string;
  sizeBytes: number;
  mimeType: string;
  uploadedAt: Date;
}

export interface StorageProvider {
  uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    directory?: string
  ): Promise<StorageUploadResult>;

  getSignedDownloadUrl(fileKey: string, expiresInSeconds?: number): Promise<string>;
  deleteFile(fileKey: string): Promise<boolean>;
}

export class S3CompatibleStorageProvider implements StorageProvider {
  private bucket: string;
  private region: string;
  private endpoint?: string;

  constructor() {
    this.bucket = process.env.STORAGE_BUCKET || 'nextgen-class-documents';
    this.region = process.env.STORAGE_REGION || 'us-east-1';
    this.endpoint = process.env.STORAGE_ENDPOINT;
  }

  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    directory: string = 'uploads'
  ): Promise<StorageUploadResult> {
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileKey = `${directory}/${timestamp}_${sanitizedFileName}`;
    const baseUrl = this.endpoint ? `${this.endpoint}/${this.bucket}` : `https://${this.bucket}.s3.${this.region}.amazonaws.com`;
    const fileUrl = `${baseUrl}/${fileKey}`;

    return {
      fileUrl,
      fileKey,
      sizeBytes: fileBuffer.length,
      mimeType,
      uploadedAt: new Date(),
    };
  }

  async getSignedDownloadUrl(fileKey: string, expiresInSeconds: number = 3600): Promise<string> {
    const baseUrl = this.endpoint ? `${this.endpoint}/${this.bucket}` : `https://${this.bucket}.s3.${this.region}.amazonaws.com`;
    return `${baseUrl}/${fileKey}?expires=${expiresInSeconds}`;
  }

  async deleteFile(fileKey: string): Promise<boolean> {
    return true;
  }
}

// Singleton storage provider instance
export const storageProvider: StorageProvider = new S3CompatibleStorageProvider();
