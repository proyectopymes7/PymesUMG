import api from './api';

// Helper function to map backend models to frontend format
const mapBusinessData = (b) => {
  return {
    id: b.id_emprendimiento,
    name: b.nombre,
    category: b.categoria_nombre || 'General',
    rating: b.rating_promedio ? Number(b.rating_promedio).toFixed(1) : 4.5,
    reviewCount: b.vistas || 0,
    description: b.descripcion,
    dept: 'Guatemala',
    muni: 'Guatemala',
    barrio: 'Zona 1',
    location: b.direccion || 'Guatemala',
    image: b.logo_url || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80',
    logo: b.logo_url || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=400&auto=format&fit=crop',
    estado: b.estado ? b.estado.toLowerCase() : 'activo',
    destacado: b.destacado === 1 || b.destacado === true,
    id_usuario: b.id_usuario,
    hours: [{ day: 'Lunes - Domingo', time: b.horario || '8:00 AM - 5:00 PM' }],
    socials: {
      whatsapp: b.whatsapp ? `https://wa.me/${b.whatsapp}` : '',
      instagram: '',
      facebook: '',
      website: ''
    },
    products: [],
    services: [],
    reviews: []
  };
};

export const getAllBusinesses = async (params = {}) => {
  try {
    const response = await api.get('/emprendimientos', { params });
    if (response.data.success && response.data.data) {
      return response.data.data.map(mapBusinessData);
    }
    return [];
  } catch (error) {
    console.error('Error fetching businesses:', error);
    return [];
  }
};

export const getFeaturedBusinesses = async (limit = 5) => {
  try {
    const response = await api.get('/emprendimientos', { params: { destacado: true, limit } });
    if (response.data.success && response.data.data) {
      return response.data.data.map(mapBusinessData);
    }
    return [];
  } catch (error) {
    console.error('Error fetching featured businesses:', error);
    return [];
  }
};

export const getBusinessById = async (id) => {
  try {
    const response = await api.get(`/emprendimientos/${id}`);
    if (response.data.success && response.data.data) {
      return mapBusinessData(response.data.data);
    }
    return null;
  } catch (error) {
    console.error(`Error fetching business ${id}:`, error);
    return null;
  }
};

export const getPendingBusinesses = async () => {
  try {
    const response = await api.get('/emprendimientos', { params: { estado: 'PENDIENTE' } });
    if (response.data.success && response.data.data) {
      return response.data.data.map(mapBusinessData);
    }
    return [];
  } catch (error) {
    console.error('Error fetching pending businesses:', error);
    return [];
  }
};

export const getCategories = async () => {
  try {
    const response = await api.get('/categories');
    if (response.data.success && response.data.data) {
      return ['Todas', ...response.data.data.map(c => c.nombre)];
    }
    return ['Todas', 'Restaurantes', 'Salud', 'Servicios', 'Tecnología', 'Belleza', 'Comercio'];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return ['Todas', 'Restaurantes', 'Salud', 'Servicios', 'Tecnología', 'Belleza', 'Comercio'];
  }
};

export const updateBusinessStatus = async (id, estado) => {
  try {
    const response = await api.put(`/emprendimientos/${id}`, { estado });
    return response.data;
  } catch (error) {
    console.error(`Error updating business ${id} status to ${estado}:`, error);
    throw error;
  }
};

export const updateBusinessData = async (businessId, data) => {
  try {
    const response = await api.put(`/emprendimientos/${businessId}`, data);
    return response.data;
  } catch (error) {
    console.error(`Error updating business ${businessId}:`, error);
    throw error;
  }
};

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

export const getAllUsers = async () => {
  try {
    const response = await api.get('/users');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

export const getMyBusinesses = async () => {
  try {
    const response = await api.get('/emprendimientos/my/emprendimientos');
    if (response.data.success && response.data.data) {
      return response.data.data.map(mapBusinessData);
    }
    return [];
  } catch (error) {
    console.error('Error fetching my businesses:', error);
    return [];
  }
};

export const updateUserRole = async (userId, newRoleId) => {
  try {
    const response = await api.put(`/users/${userId}/role`, { id_rol: newRoleId });
    return response.data;
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

export const getBusinessReviews = async (businessId) => {
  try {
    const response = await api.get(`/valoraciones/emprendimiento/${businessId}`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    console.error(`Error fetching reviews for business ${businessId}:`, error);
    return [];
  }
};

export const createReview = async ({ id_emprendimiento, comentario, calificacion }) => {
  try {
    const response = await api.post('/valoraciones', {
      id_emprendimiento,
      comentario,
      calificacion
    });
    return response.data;
  } catch (error) {
    console.error('Error creating review:', error);
    throw error;
  }
};

export default {
  getAllBusinesses,
  getFeaturedBusinesses,
  getBusinessById,
  getPendingBusinesses,
  getCategories,
  updateBusinessStatus,
  updateBusinessData,
  getBusinessImages,
  uploadBusinessImage,
  deleteBusinessImage,
  getAllUsers,
  updateUserRole,
  getBusinessReviews,
  createReview
};