import api from './api';

export const getProductsByBusiness = async (businessId) => {
  try {
    const response = await api.get(`/productos/emprendimiento/${businessId}`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    console.error(`Error fetching products for business ${businessId}:`, error);
    return [];
  }
};

export const createProduct = async (productData) => {
  try {
    const response = await api.post('/productos', productData);
    return response.data;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

export const updateProduct = async (productId, productData) => {
  try {
    const response = await api.put(`/productos/${productId}`, productData);
    return response.data;
  } catch (error) {
    console.error(`Error updating product ${productId}:`, error);
    throw error;
  }
};

export const deleteProduct = async (productId) => {
  try {
    const response = await api.delete(`/productos/${productId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting product ${productId}:`, error);
    throw error;
  }
};

// Assuming frontend needs to mock formData upload if backend uses JSON for now, or use real multipart if supported.
export const uploadProductImage = async (productId, fileOrUrl) => {
  try {
    // If it's a file, we'd normally use FormData. 
    // The current backend routes/imagenes.js expects { id_producto, url, orden }
    // We will simulate the upload by converting the file to base64 or just passing URL if string.
    let url = fileOrUrl;
    if (fileOrUrl instanceof File) {
      // Mock upload for now until backend supports multer
      url = URL.createObjectURL(fileOrUrl);
    }
    const response = await api.post('/imagenes/producto', {
      id_producto: productId,
      url: url,
      orden: 0
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading product image:', error);
    throw error;
  }
};

export default {
  getProductsByBusiness,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage
};
