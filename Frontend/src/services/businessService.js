import api from './api';

// Helper function to map backend models to frontend format
const mapBusinessData = (b) => {
  const cats = b.categorias_nombres
    ? b.categorias_nombres.split(', ').filter(Boolean)
    : (b.categoria_nombre ? [b.categoria_nombre] : [])
  const catIds = b.categorias_ids
    ? b.categorias_ids.split(',').map(Number).filter(Boolean)
    : (b.id_categoria ? [Number(b.id_categoria)] : [])
  return {
    id: b.id_emprendimiento,
    name: b.nombre,
    category: cats[0] || 'General',
    categorias: cats,
    categorias_ids: catIds,
    rating: b.rating_promedio ? Number(b.rating_promedio).toFixed(1) : null,
    reviewCount: b.vistas || 0,
    description: b.descripcion,
    dept: b.departamento || '',
    muni: b.municipio || '',
    localidad: b.localidad || '',
    location: (b.municipio && b.departamento) ? `${b.municipio}, ${b.departamento}` : (b.direccion || ''),
    departamento: b.departamento || '',
    municipio: b.municipio || '',
    lat: b.latitud ? Number(b.latitud) : null,
    lng: b.longitud ? Number(b.longitud) : null,
    image: b.logo_url || 'https://pymesadmin.blob.core.windows.net/logos/f13d047b-6eb2-49c8-beab-b73cbed4b13b.webp',
    logo: b.logo_url || 'https://pymesadmin.blob.core.windows.net/logos/f13d047b-6eb2-49c8-beab-b73cbed4b13b.webp',
    estado: b.estado ? b.estado.toLowerCase() : 'activo',
    status: b.estado ? b.estado.toLowerCase() : 'activo',
    destacado: b.destacado === 1 || b.destacado === true,
    id_usuario: b.id_usuario,
    horario: b.horario || '',
    hours: [{ day: 'Lunes - Domingo', time: b.horario || '8:00 AM - 5:00 PM' }],
    socials: {
      whatsapp: b.whatsapp ? `https://wa.me/${b.whatsapp}` : '',
      instagram: b.instagram || '',
      facebook: b.facebook || '',
      website: b.website || ''
    },
    products: [],
    services: [],
    reviews: []
  };
};

export const getAllBusinesses = async (params = {}) => {
  try {
    const response = await api.get('/emprendimientos', { params: { limit: 200, ...params } });
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
    const response = await api.get('/emprendimientos', { params: { estado: 'pendiente' } });
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

export const getRawCategories = async () => {
  try {
    const response = await api.get('/categories');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching raw categories:', error);
    return [];
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

export const getBusinessProducts = async (businessId) => {
  try {
    const response = await api.get(`/productos/emprendimiento/${businessId}`)
    if (response.data.success && response.data.data) {
      return response.data.data
    }
    return []
  } catch (error) {
    console.error(`Error fetching products for business ${businessId}:`, error)
    return []
  }
}

export const getBusinessReviews = async (businessId) => {
  try {
    const response = await api.get(`/calificaciones/emprendimiento/${businessId}`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    console.error(`Error fetching reviews for business ${businessId}:`, error);
    return [];
  }
};

export const getNearbyBusinesses = async (lat, lng, radio = 10) => {
  try {
    const response = await api.get('/emprendimientos/nearby/list', { params: { lat, lng, radio, limit: 12 } })
    if (response.data.success && response.data.data) {
      return response.data.data.map(b => ({ ...mapBusinessData(b), distancia_km: b.distancia_km }))
    }
    return []
  } catch (error) {
    console.error('Error fetching nearby businesses:', error)
    return []
  }
}

export const getProductImages = async (productId) => {
  try {
    const response = await api.get(`/imagenes/producto/${productId}`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    console.error(`Error fetching images for product ${productId}:`, error);
    return [];
  }
};

// Comprime una imagen en el cliente antes de subirla.
// Convierte a JPEG para garantizar compresión. maxWidth en px, quality 0-1.
const compressImage = (file, maxWidth, quality) => new Promise((resolve) => {
  const img = new Image();
  const url = URL.createObjectURL(file);
  img.onload = () => {
    URL.revokeObjectURL(url);
    let { width, height } = img;
    if (width > maxWidth) {
      height = Math.round(height * maxWidth / width);
      width = maxWidth;
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(img, 0, 0, width, height);
    canvas.toBlob(
      blob => resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })),
      'image/jpeg',
      quality
    );
  };
  img.src = url;
});

// Sube imagen con compresión automática según el tipo.
// tipo: 'logos' | 'imagenes' | 'perfiles'
export const uploadImage = async (file, tipo = 'imagenes') => {
  const limits = { logos: [600, 0.85], perfiles: [400, 0.85], imagenes: [1200, 0.80] };
  const [maxW, quality] = limits[tipo] ?? [1200, 0.80];
  const compressed = await compressImage(file, maxW, quality);

  const fd = new FormData();
  fd.append('imagen', compressed);
  fd.append('tipo', tipo);
  const response = await api.post('/imagenes/upload', fd, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  if (!response.data?.url) throw new Error('No se recibió URL de la imagen');
  return response.data.url;
};

export const uploadProductImage = async (file, productId) => {
  const compressed = await compressImage(file, 800, 0.80);
  const fd = new FormData();
  fd.append('imagen', compressed);
  const response = await api.post(`/imagenes/producto/${productId}`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  if (!response.data?.url) throw new Error('No se recibió URL de la imagen del producto');
  return response.data.url;
};

export const deleteBusinessById = async (id) => {
  await api.delete(`/emprendimientos/${id}`);
};

export const deleteReview = async (id_calificacion) => {
  const response = await api.delete(`/calificaciones/${id_calificacion}`);
  return response.data;
};

export const createReview = async ({ id_emprendimiento, comentario, calificacion }) => {
  try {
    const response = await api.post('/calificaciones', {
      id_emprendimiento,
      comentario,
      puntuacion: calificacion
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
  getBusinessProducts,
  getBusinessReviews,
  createReview
};