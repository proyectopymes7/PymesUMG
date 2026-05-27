const { BlobServiceClient } = require('@azure/storage-blob');
const { randomUUID } = require('crypto');
const path = require('path');

const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.AZURE_STORAGE_CONNECTION_STRING
);

const CONTENT_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp'
};

const subirImagen = async (buffer, originalName, contenedor) => {
  const extension = path.extname(originalName).toLowerCase();
  const nombreBlob = `${randomUUID()}${extension}`;
  const containerClient = blobServiceClient.getContainerClient(contenedor);
  const blockBlobClient = containerClient.getBlockBlobClient(nombreBlob);

  await blockBlobClient.uploadData(buffer, {
    blobHTTPHeaders: {
      blobContentType: CONTENT_TYPES[extension] || 'image/jpeg'
    }
  });

  return blockBlobClient.url;
};

const eliminarImagen = async (url, contenedor) => {
  const nombreBlob = url.split('/').pop();
  const containerClient = blobServiceClient.getContainerClient(contenedor);
  const blockBlobClient = containerClient.getBlockBlobClient(nombreBlob);
  await blockBlobClient.deleteIfExists();
};

module.exports = { subirImagen, eliminarImagen };
