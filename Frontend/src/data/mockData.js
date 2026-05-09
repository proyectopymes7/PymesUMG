// ============================================================
// MOCK DATA — Simula respuestas del backend
// Cuando el backend esté listo, solo se reemplaza este archivo
// por llamadas reales a la API con axios.
// ============================================================

const businesses = [
  {
    id: 1, name: 'Café El Despertar', category: 'Restaurantes', rating: 4.8, reviewCount: 124,
    description: 'El mejor café artesanal cultivado en Chiquimula. Granos selectos de fincas locales.',
    dept: 'Chiquimula', muni: 'Chiquimula', barrio: 'Barrio El Molino', location: 'Barrio El Molino, Chiquimula',
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80',
    logo: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=400&auto=format&fit=crop',
    estado: 'activo', destacado: true, id_usuario: 1,
    hours: [{ day: 'Lunes - Viernes', time: '7:00 AM - 8:00 PM' }, { day: 'Sábado', time: '8:00 AM - 6:00 PM' }, { day: 'Domingo', time: '9:00 AM - 4:00 PM' }],
    socials: { whatsapp: 'https://wa.me/50212345678', instagram: 'https://instagram.com', facebook: 'https://facebook.com', website: '' },
    products: [
      { id: 1, name: 'Cappuccino Artesanal', price: 'Q 25.00', image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?q=80&w=400&auto=format&fit=crop' },
      { id: 2, name: 'Pastel de Chocolate', price: 'Q 35.00', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=400&auto=format&fit=crop' },
      { id: 3, name: 'Desayuno Típico', price: 'Q 45.00', image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=400&auto=format&fit=crop' }
    ],
    services: [{ name: 'WiFi Gratuito', price: 'Gratis' }, { name: 'Reserva de Mesas', price: 'Gratis' }],
    reviews: [
      { id: 1, user: 'Ana García', rating: 5, comment: '¡Increíble lugar! El café es delicioso.', date: 'Hace 2 días' },
      { id: 2, user: 'Carlos Ruiz', rating: 4, comment: 'Muy buena atención y ambiente acogedor.', date: 'Hace 1 semana' }
    ]
  },
  {
    id: 2, name: 'Clínica Dental Sonrisas', category: 'Salud', rating: 4.9, reviewCount: 89,
    description: 'Atención dental profesional y amable. Limpieza, ortodoncia y cirugía dental.',
    dept: 'Zacapa', muni: 'Zacapa', barrio: 'Barrio Nuevo', location: 'Barrio Nuevo, Zacapa',
    image: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=800&q=80',
    logo: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?q=80&w=400&auto=format&fit=crop',
    estado: 'activo', destacado: true, id_usuario: 2,
    hours: [{ day: 'Lunes - Viernes', time: '8:00 AM - 5:00 PM' }, { day: 'Sábado', time: '8:00 AM - 12:00 PM' }],
    socials: { whatsapp: 'https://wa.me/50298765432', instagram: '', facebook: 'https://facebook.com', website: '' },
    products: [
      { id: 1, name: 'Limpieza Dental', price: 'Q 150.00', image: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?q=80&w=400&auto=format&fit=crop' },
      { id: 2, name: 'Blanqueamiento', price: 'Q 500.00', image: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?q=80&w=400&auto=format&fit=crop' }
    ],
    services: [{ name: 'Consulta General', price: 'Q 100.00' }, { name: 'Emergencias 24h', price: 'Consultar' }],
    reviews: [
      { id: 1, user: 'María López', rating: 5, comment: 'Excelente atención, muy profesionales.', date: 'Hace 3 días' },
      { id: 2, user: 'Pedro Morales', rating: 5, comment: 'La mejor clínica de Zacapa.', date: 'Hace 2 semanas' }
    ]
  },
  {
    id: 3, name: 'Ferretería El Tornillo', category: 'Comercio', rating: 4.5, reviewCount: 67,
    description: 'Todo para la construcción y el hogar. Materiales, herramientas y asesoría técnica.',
    dept: 'Chiquimula', muni: 'Esquipulas', barrio: 'Centro', location: 'Centro, Esquipulas',
    image: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=800&q=80',
    logo: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=400&auto=format&fit=crop',
    estado: 'activo', destacado: false, id_usuario: 3,
    hours: [{ day: 'Lunes - Sábado', time: '7:00 AM - 6:00 PM' }, { day: 'Domingo', time: 'Cerrado' }],
    socials: { whatsapp: 'https://wa.me/50211112222', instagram: '', facebook: '', website: '' },
    products: [
      { id: 1, name: 'Cemento Gris', price: 'Q 78.00', image: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=400&auto=format&fit=crop' },
      { id: 2, name: 'Hierro 3/8', price: 'Q 32.00', image: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=400&auto=format&fit=crop' }
    ],
    services: [{ name: 'Entrega a domicilio', price: 'Q 25.00' }, { name: 'Asesoría técnica', price: 'Gratis' }],
    reviews: [{ id: 1, user: 'José Hernández', rating: 4, comment: 'Buenos precios y variedad.', date: 'Hace 5 días' }]
  },
  {
    id: 4, name: 'Taller Mecánico Central', category: 'Servicios', rating: 4.7, reviewCount: 95,
    description: 'Reparación de motores, enderezado y pintura automotriz. Confianza y rapidez.',
    dept: 'Chiquimula', muni: 'Chiquimula', barrio: 'Zona 1', location: 'Zona 1, Chiquimula',
    image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=800&q=80',
    logo: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=400&auto=format&fit=crop',
    estado: 'activo', destacado: true, id_usuario: 4,
    hours: [{ day: 'Lunes - Viernes', time: '7:00 AM - 5:00 PM' }, { day: 'Sábado', time: '7:00 AM - 1:00 PM' }],
    socials: { whatsapp: 'https://wa.me/50233334444', instagram: '', facebook: '', website: '' },
    products: [
      { id: 1, name: 'Cambio de Aceite', price: 'Q 150.00', image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=400&auto=format&fit=crop' },
      { id: 2, name: 'Afinado Completo', price: 'Q 350.00', image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=400&auto=format&fit=crop' }
    ],
    services: [{ name: 'Diagnóstico Gratis', price: 'Gratis' }, { name: 'Grúa', price: 'Q 200.00' }],
    reviews: [
      { id: 1, user: 'Roberto Paz', rating: 5, comment: 'Trabajo impecable, muy recomendado.', date: 'Hace 1 día' },
      { id: 2, user: 'Luis Castillo', rating: 4, comment: 'Rápidos y honestos con los precios.', date: 'Hace 3 días' }
    ]
  },
  {
    id: 5, name: 'Panadería La Bendición', category: 'Restaurantes', rating: 4.6, reviewCount: 112,
    description: 'Pan dulce y francés calientito todo el día. Tradición familiar desde 1995.',
    dept: 'Jalapa', muni: 'Jalapa', barrio: 'Barrio La Democracia', location: 'Barrio La Democracia, Jalapa',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
    logo: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=400&auto=format&fit=crop',
    estado: 'activo', destacado: true, id_usuario: 5,
    hours: [{ day: 'Lunes - Domingo', time: '5:00 AM - 8:00 PM' }],
    socials: { whatsapp: 'https://wa.me/50255556666', instagram: 'https://instagram.com', facebook: '', website: '' },
    products: [
      { id: 1, name: 'Pan Francés (docena)', price: 'Q 12.00', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=400&auto=format&fit=crop' },
      { id: 2, name: 'Pastel Tres Leches', price: 'Q 85.00', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=400&auto=format&fit=crop' }
    ],
    services: [{ name: 'Pedidos especiales', price: 'Consultar' }, { name: 'Entrega a domicilio', price: 'Q 10.00' }],
    reviews: [
      { id: 1, user: 'Sandra Mejía', rating: 5, comment: 'El pan más rico de Jalapa, sin duda.', date: 'Hace 4 días' },
      { id: 2, user: 'Fernando Rivas', rating: 4, comment: 'Siempre fresco y a buen precio.', date: 'Hace 1 semana' }
    ]
  },
  {
    id: 6, name: 'Salón de Belleza Glamour', category: 'Belleza', rating: 4.3, reviewCount: 45,
    description: 'Cortes, tintes, tratamientos capilares y spa. Tu mejor versión empieza aquí.',
    dept: 'Chiquimula', muni: 'Ipala', barrio: 'Centro', location: 'Centro, Ipala',
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
    logo: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=400&auto=format&fit=crop',
    estado: 'activo', destacado: false, id_usuario: 6,
    hours: [{ day: 'Martes - Sábado', time: '9:00 AM - 6:00 PM' }, { day: 'Domingo - Lunes', time: 'Cerrado' }],
    socials: { whatsapp: 'https://wa.me/50277778888', instagram: 'https://instagram.com', facebook: '', website: '' },
    products: [
      { id: 1, name: 'Corte de Cabello', price: 'Q 50.00', image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=400&auto=format&fit=crop' },
      { id: 2, name: 'Tinte Completo', price: 'Q 200.00', image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=400&auto=format&fit=crop' }
    ],
    services: [{ name: 'Manicure', price: 'Q 40.00' }, { name: 'Pedicure', price: 'Q 50.00' }],
    reviews: [{ id: 1, user: 'Lucía Torres', rating: 4, comment: 'Buen servicio y buenas instalaciones.', date: 'Hace 1 semana' }]
  },
  {
    id: 7, name: 'Librería El Saber', category: 'Comercio', rating: 4.2, reviewCount: 34,
    description: 'Útiles escolares, material de oficina y libros de texto. Precios accesibles.',
    dept: 'Zacapa', muni: 'Gualán', barrio: 'Barrio San Miguel', location: 'Barrio San Miguel, Gualán',
    image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=800&q=80',
    logo: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=400&auto=format&fit=crop',
    estado: 'activo', destacado: false, id_usuario: 7,
    hours: [{ day: 'Lunes - Sábado', time: '8:00 AM - 5:00 PM' }],
    socials: { whatsapp: 'https://wa.me/50299990000', instagram: '', facebook: '', website: '' },
    products: [
      { id: 1, name: 'Cuaderno Universitario', price: 'Q 15.00', image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=400&auto=format&fit=crop' }
    ],
    services: [{ name: 'Impresiones', price: 'Q 1.00/hoja' }, { name: 'Fotocopias', price: 'Q 0.50/hoja' }],
    reviews: [{ id: 1, user: 'Andrea Soto', rating: 4, comment: 'Tienen de todo para el colegio.', date: 'Hace 2 semanas' }]
  },
  {
    id: 8, name: 'Restaurante Sabor Chapín', category: 'Restaurantes', rating: 4.8, reviewCount: 156,
    description: 'Pepián, jocón, kak-ik y más platillos tradicionales guatemaltecos. Sabor de casa.',
    dept: 'Chiquimula', muni: 'Quezaltepeque', barrio: 'Zona 2', location: 'Zona 2, Quezaltepeque',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
    logo: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=400&auto=format&fit=crop',
    estado: 'activo', destacado: true, id_usuario: 8,
    hours: [{ day: 'Lunes - Domingo', time: '7:00 AM - 9:00 PM' }],
    socials: { whatsapp: 'https://wa.me/50211223344', instagram: 'https://instagram.com', facebook: 'https://facebook.com', website: '' },
    products: [
      { id: 1, name: 'Pepián de Pollo', price: 'Q 45.00', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=400&auto=format&fit=crop' },
      { id: 2, name: 'Plato Típico', price: 'Q 35.00', image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=400&auto=format&fit=crop' }
    ],
    services: [{ name: 'Servicio a domicilio', price: 'Q 15.00' }, { name: 'Eventos privados', price: 'Consultar' }],
    reviews: [
      { id: 1, user: 'Mario González', rating: 5, comment: 'El mejor pepián que he probado.', date: 'Hace 1 día' },
      { id: 2, user: 'Carmen Flores', rating: 5, comment: 'Sabor auténtico, como comida de abuela.', date: 'Hace 3 días' },
      { id: 3, user: 'Diego Ramírez', rating: 4, comment: 'Porciones generosas y buen precio.', date: 'Hace 1 semana' }
    ]
  },
  {
    id: 9, name: 'Electrónica El Rayo', category: 'Tecnología', rating: 4.9, reviewCount: 78,
    description: 'Reparación de celulares, laptops y venta de accesorios. Garantía en cada trabajo.',
    dept: 'Jalapa', muni: 'Monjas', barrio: 'Centro', location: 'Centro, Monjas',
    image: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=800&q=80',
    logo: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?q=80&w=400&auto=format&fit=crop',
    estado: 'activo', destacado: false, id_usuario: 9,
    hours: [{ day: 'Lunes - Sábado', time: '8:00 AM - 6:00 PM' }],
    socials: { whatsapp: 'https://wa.me/50255667788', instagram: '', facebook: 'https://facebook.com', website: '' },
    products: [
      { id: 1, name: 'Cambio de Pantalla', price: 'Q 250.00', image: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?q=80&w=400&auto=format&fit=crop' },
      { id: 2, name: 'Reparación de Laptop', price: 'Q 300.00', image: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?q=80&w=400&auto=format&fit=crop' }
    ],
    services: [{ name: 'Diagnóstico', price: 'Gratis' }, { name: 'Garantía 30 días', price: 'Incluida' }],
    reviews: [{ id: 1, user: 'Kevin Pérez', rating: 5, comment: 'Me salvaron el celular, excelente trabajo.', date: 'Hace 2 días' }]
  },
  {
    id: 10, name: 'Vivero Los Girasoles', category: 'Servicios', rating: 5.0, reviewCount: 42,
    description: 'Venta de plantas ornamentales, frutales y herramientas de jardinería.',
    dept: 'Chiquimula', muni: 'San Jacinto', barrio: 'Entrada Principal', location: 'Entrada Principal, San Jacinto',
    image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80',
    logo: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=400&auto=format&fit=crop',
    estado: 'activo', destacado: false, id_usuario: 10,
    hours: [{ day: 'Lunes - Sábado', time: '7:00 AM - 4:00 PM' }],
    socials: { whatsapp: 'https://wa.me/50244556677', instagram: '', facebook: '', website: '' },
    products: [
      { id: 1, name: 'Rosa en Maceta', price: 'Q 35.00', image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=400&auto=format&fit=crop' },
      { id: 2, name: 'Árbol Frutal', price: 'Q 75.00', image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=400&auto=format&fit=crop' }
    ],
    services: [{ name: 'Asesoría de jardín', price: 'Gratis' }, { name: 'Entrega a domicilio', price: 'Q 20.00' }],
    reviews: [{ id: 1, user: 'Isabel Reyes', rating: 5, comment: 'Plantas hermosas y bien cuidadas.', date: 'Hace 1 semana' }]
  },
  {
    id: 11, name: 'Farmacia San José', category: 'Salud', rating: 4.4, reviewCount: 28,
    description: 'Medicamentos, vitaminas y productos de cuidado personal. Atención 24 horas.',
    dept: 'Chiquimula', muni: 'Chiquimula', barrio: 'Zona 2', location: 'Zona 2, Chiquimula',
    image: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?auto=format&fit=crop&w=800&q=80',
    logo: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?q=80&w=400&auto=format&fit=crop',
    estado: 'pendiente', destacado: false, id_usuario: 11,
    hours: [{ day: 'Lunes - Domingo', time: '24 Horas' }],
    socials: { whatsapp: 'https://wa.me/50233445566', instagram: '', facebook: '', website: '' },
    products: [{ id: 1, name: 'Consulta farmacéutica', price: 'Gratis', image: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?q=80&w=400&auto=format&fit=crop' }],
    services: [{ name: 'Entrega a domicilio', price: 'Q 10.00' }],
    reviews: []
  },
  {
    id: 12, name: 'Gimnasio Power Fit', category: 'Servicios', rating: 4.1, reviewCount: 15,
    description: 'Equipos modernos, clases de spinning y entrenamiento personalizado.',
    dept: 'Zacapa', muni: 'Estanzuela', barrio: 'Centro', location: 'Centro, Estanzuela',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
    logo: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=400&auto=format&fit=crop',
    estado: 'pendiente', destacado: false, id_usuario: 12,
    hours: [{ day: 'Lunes - Viernes', time: '5:00 AM - 9:00 PM' }, { day: 'Sábado', time: '6:00 AM - 12:00 PM' }],
    socials: { whatsapp: 'https://wa.me/50211998877', instagram: 'https://instagram.com', facebook: '', website: '' },
    products: [{ id: 1, name: 'Mensualidad', price: 'Q 150.00', image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=400&auto=format&fit=crop' }],
    services: [{ name: 'Entrenador personal', price: 'Q 200.00/mes' }],
    reviews: []
  }
]

const users = [
  { id_usuario: 1, nombre: 'Rudy', apellido: 'Admin', correo: 'rudy@conectapyme.gt', id_rol: 1 },
  { id_usuario: 2, nombre: 'María', apellido: 'López', correo: 'maria@gmail.com', id_rol: 2 },
  { id_usuario: 3, nombre: 'Carlos', apellido: 'Hernández', correo: 'carlos@gmail.com', id_rol: 2 },
  { id_usuario: 4, nombre: 'Ana', apellido: 'García', correo: 'ana@gmail.com', id_rol: 2 },
  { id_usuario: 5, nombre: 'Pedro', apellido: 'Morales', correo: 'pedro@gmail.com', id_rol: 2 }
]

const categories = ['Todas', 'Restaurantes', 'Salud', 'Servicios', 'Tecnología', 'Belleza', 'Comercio']

// ============================================================
// API SIMULADA — Estas funciones se reemplazan por axios calls
// ============================================================

export function getAllBusinesses() {
  return businesses.filter(b => b.estado === 'activo')
}

export function getBusinessById(id) {
  return businesses.find(b => b.id === Number(id)) || null
}

export function getFeaturedBusinesses(limit = 5) {
  return [...businesses]
    .filter(b => b.estado === 'activo')
    .sort((a, b) => b.reviewCount - a.reviewCount)
    .slice(0, limit)
}

export function getPendingBusinesses() {
  return businesses.filter(b => b.estado === 'pendiente')
}

export function updateBusinessStatus(id, estado) {
  const b = businesses.find(b => b.id === Number(id))
  if (b) b.estado = estado
  return b
}

export function getAllUsers() {
  return [...users]
}

export function updateUserRole(userId, newRoleId) {
  const u = users.find(u => u.id_usuario === Number(userId))
  if (u) u.id_rol = newRoleId
  return u
}

export function getCategories() {
  return categories
}

export default { getAllBusinesses, getBusinessById, getFeaturedBusinesses, getPendingBusinesses, updateBusinessStatus, getAllUsers, updateUserRole, getCategories }
