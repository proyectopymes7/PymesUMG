import api from './api';

export const getBusinessImages = async (businessId) => {
  try {
    const response = await api.get(`/imagenes/emprendimiento/${businessId}`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    console.error(`Error fetching images for business ${businessId}:`, error);
    return [];
  }
};

export const uploadBusinessImage = async (businessId, file) => {
  try {
    let url = file;
    if (file instanceof File) {
      // Mock upload for now until backend supports multer
      url = URL.createObjectURL(file);
    }
    const response = await api.post('/imagenes/emprendimiento', {
      id_emprendimiento: businessId,
      url: url,
      orden: 0
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading business image:', error);
    throw error;
  }
};

export const deleteBusinessImage = async (imageId) => {
  try {
    const response = await api.delete(`/imagenes/emprendimiento/${imageId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting image ${imageId}:`, error);
    throw error;
  }
};

// Also add this method for fully updating a business
export const updateBusinessData = async (businessId, data) => {
  try {
    const response = await api.put(`/emprendimientos/${businessId}`, data);
    return response.data;
  } catch (error) {
    console.error(`Error updating business ${businessId}:`, error);
    throw error;
  }
};
