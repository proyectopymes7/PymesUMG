import api from './api';

// Helper function to map backend models to frontend format
const mapBusinessData = (b) => {
  return {
    id: b.id_emprendimiento,
    name: b.nombre,
    category: b.categoria_nombre || 'General',
    rating: b.rating_promedio ? Number(b.rating_promedio).toFixed(1) : 4.5,
    reviewCount: b.vistas || 0, // Using vistas as review count placeholder
    description: b.descripcion,
    dept: 'Guatemala', // Fallbacks since DB lacks these
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
      // Map to array of names for current frontend logic, though returning objects might be better later
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

export const updateUserRole = async (userId, newRoleId) => {
  console.warn('updateUserRole is mocked, backend endpoint missing');
  return { id_usuario: userId, id_rol: newRoleId };
};

export default {
  getAllBusinesses,
  getFeaturedBusinesses,
  getBusinessById,
  getPendingBusinesses,
  getCategories,
  updateBusinessStatus,
  getAllUsers,
  updateUserRole
};
