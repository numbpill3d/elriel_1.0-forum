// S3 Configuration for Scrapyard Asset Storage
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const crypto = require('crypto');
const path = require('path');

// Configuration
const s3Config = {
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  },
  endpoint: process.env.AWS_ENDPOINT, // For custom endpoints like MinIO or DigitalOcean Spaces
  forcePathStyle: !!process.env.AWS_FORCE_PATH_STYLE // For S3-compatible services
};

// Initialize S3 client
const s3Client = new S3Client(s3Config);

// Bucket configuration
const BUCKET_NAME = process.env.AWS_BUCKET_NAME || 'elriel-scrapyard';
const PUBLIC_URL_PREFIX = process.env.AWS_PUBLIC_URL_PREFIX || `https://${BUCKET_NAME}.s3.amazonaws.com`;

// Get unique filename
const getUniqueFilename = (originalName) => {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const extension = path.extname(originalName);
  const sanitizedName = path.basename(originalName, extension)
    .replace(/[^a-z0-9]/gi, '-')
    .toLowerCase();
  
  return `${sanitizedName}-${timestamp}-${randomString}${extension}`;
};

// Generate presigned URL for direct upload
const getPresignedUploadUrl = async (filename, contentType, folder = 'assets') => {
  const key = `${folder}/${getUniqueFilename(filename)}`;
  
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType
  });
  
  const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour
  
  return {
    signedUrl,
    key,
    url: `${PUBLIC_URL_PREFIX}/${key}`
  };
};

// Generate presigned URL for viewing/downloading
const getPresignedViewUrl = async (key) => {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key
  });
  
  const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour
  
  return signedUrl;
};

// Get public URL for an object
const getPublicUrl = (key) => {
  return `${PUBLIC_URL_PREFIX}/${key}`;
};

// Check if S3 is properly configured
const isConfigured = () => {
  return !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
};

// Fallback to local storage if S3 is not configured
const getLocalUploadPath = () => {
  return path.join(__dirname, '../public/uploads/assets');
};

module.exports = {
  s3Client,
  BUCKET_NAME,
  getUniqueFilename,
  getPresignedUploadUrl,
  getPresignedViewUrl,
  getPublicUrl,
  isConfigured,
  getLocalUploadPath
};