const fs = require('fs');
const os = require('os');
const path = require('path');
const { Readable } = require('stream');
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3');

const provider = process.env.STORAGE_PROVIDER || 'local';
const localRoot = process.env.LOCAL_STORAGE_DIR || path.join(os.tmpdir(), 'tucn-research-uploads');

function getS3Client() {
  if (!process.env.S3_BUCKET) throw new Error('S3_BUCKET is required when STORAGE_PROVIDER=s3');
  return new S3Client({
    endpoint: process.env.S3_ENDPOINT || undefined,
    region: process.env.S3_REGION || 'us-east-1',
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
    credentials: process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.S3_ACCESS_KEY_ID,
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
        }
      : undefined,
  });
}

function safeLocalPath(key) {
  const resolved = path.resolve(localRoot, key);
  const root = path.resolve(localRoot);
  if (!resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error('Invalid storage key');
  }
  return resolved;
}

async function putObject({ key, body, contentType }) {
  if (provider === 's3') {
    await getS3Client().send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }));
    return;
  }

  const filePath = safeLocalPath(key);
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  await fs.promises.writeFile(filePath, body);
}

async function getObjectStream(key) {
  if (provider === 's3') {
    const result = await getS3Client().send(new GetObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
    }));
    return result.Body;
  }

  return fs.createReadStream(safeLocalPath(key));
}

async function deleteObject(key) {
  if (!key) return;
  if (provider === 's3') {
    await getS3Client().send(new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
    }));
    return;
  }

  await fs.promises.rm(safeLocalPath(key), { force: true });
}

function streamFromBuffer(buffer) {
  return Readable.from(buffer);
}

module.exports = {
  provider,
  putObject,
  getObjectStream,
  deleteObject,
  streamFromBuffer,
};
