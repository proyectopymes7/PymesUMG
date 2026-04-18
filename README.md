# PYMES Chiquimula Backend API

Backend API for the PYMES Chiquimula directory system, built with Node.js and Express, connecting to Azure SQL Database.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **User Management**: Complete user registration, login, and profile management
- **Emprendimiento Directory**: CRUD operations for business listings
- **Product & Service Catalog**: Manage products and services for each emprendimiento
- **Category Management**: Hierarchical category system with parent-child relationships
- **Image Management**: Support for emprendimiento and product images
- **Reviews & Ratings**: User reviews and rating system with approval workflow
- **Analytics Dashboard**: Daily statistics and analytics tracking
- **AI Suggestions**: AI-powered improvement suggestions for listings
- **Rate Limiting**: Advanced rate limiting for API protection
- **Logging**: Comprehensive logging system with Winston
- **Validation**: Input validation and sanitization

## Database Schema

The API is built on a comprehensive Azure SQL database with 15 tables organized into modules:

- **User Module**: ROLES, USUARIOS
- **Directory Module**: CATEGORIAS, EMPRENDIMIENTOS, REDES_SOCIALES, IMAGENES_EMPRENDIMIENTO
- **Catalog Module**: PRODUCTOS_SERVICIOS, IMAGENES_PRODUCTO
- **Admin Module**: PUBLICACIONES, HISTORIAL_CAMBIOS, CALIFICACIONES, VALORACIONES
- **Analytics & AI Module**: ESTADISTICAS_DIARIAS, LOG_BUSQUEDAS, SUGERENCIAS_IA

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd pymes-chiquimula-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```env
# Database Configuration
DB_SERVER=pymes-chiquimula-server.database.windows.net
DB_DATABASE=BD_PYMES_Chiquimula
DB_USER=your_username
DB_PASSWORD=your_password
DB_ENCRYPT=true

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=3000
NODE_ENV=development

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

5. Start the server:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (protected)
- `PUT /api/auth/profile` - Update user profile (protected)
- `PUT /api/auth/change-password` - Change password (protected)

### Users (Admin only)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id/status` - Update user status

### Roles
- `GET /api/roles` - Get all roles
- `GET /api/roles/:id` - Get role by ID
- `POST /api/roles` - Create role (admin)
- `PUT /api/roles/:id` - Update role (admin)
- `DELETE /api/roles/:id` - Delete role (admin)

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/tree` - Get category tree structure
- `GET /api/categories/:id` - Get category by ID
- `GET /api/categories/:id/subcategories` - Get subcategories
- `POST /api/categories` - Create category (admin)
- `PUT /api/categories/:id` - Update category (admin)
- `DELETE /api/categories/:id` - Delete category (admin)

### Emprendimientos
- `GET /api/emprendimientos` - Get emprendimientos (public)
- `GET /api/emprendimientos/search` - Search emprendimientos (public)
- `GET /api/emprendimientos/:id` - Get emprendimiento by ID (public)
- `POST /api/emprendimientos` - Create emprendimiento (protected)
- `GET /api/emprendimientos/my/emprendimientos` - Get user's emprendimientos (protected)
- `PUT /api/emprendimientos/:id` - Update emprendimiento (protected)
- `DELETE /api/emprendimientos/:id` - Delete emprendimiento (protected)

### Products & Services
- `GET /api/productos` - Get all products (public)
- `GET /api/productos/search` - Search products (public)
- `GET /api/productos/emprendimiento/:id_emprendimiento` - Get products by emprendimiento (public)
- `GET /api/productos/:id` - Get product by ID (public)
- `POST /api/productos` - Create product (protected)
- `PUT /api/productos/:id` - Update product (protected)
- `DELETE /api/productos/:id` - Delete product (protected)

### Images
- `GET /api/imagenes/emprendimiento/:id_emprendimiento` - Get emprendimiento images (public)
- `GET /api/imagenes/producto/:id_producto` - Get product images (public)
- `POST /api/imagenes/emprendimiento` - Upload emprendimiento image (protected)
- `POST /api/imagenes/producto` - Upload product image (protected)
- `DELETE /api/imagenes/emprendimiento/:id` - Delete emprendimiento image (protected)
- `DELETE /api/imagenes/producto/:id` - Delete product image (protected)

### Reviews & Ratings
- `GET /api/valoraciones` - Get all reviews (public)
- `GET /api/valoraciones/emprendimiento/:id_emprendimiento` - Get reviews by emprendimiento (public)
- `GET /api/valoraciones/:id` - Get review by ID (public)
- `POST /api/valoraciones` - Create review (protected)
- `PUT /api/valoraciones/:id` - Update review (protected)
- `DELETE /api/valoraciones/:id` - Delete review (protected)
- `PUT /api/valoraciones/:id/approve` - Approve review (admin)

### Publications (Admin workflow)
- `GET /api/publicaciones` - Get all publications (protected)
- `GET /api/publicaciones/:id` - Get publication by ID (protected)
- `POST /api/publicaciones` - Create publication (protected)
- `PUT /api/publicaciones/:id/resolve` - Resolve publication (admin)

### Statistics
- `GET /api/estadisticas/emprendimiento/:id_emprendimiento` - Get emprendimiento statistics (public)
- `GET /api/estadisticas/emprendimiento/:id_emprendimiento/summary` - Get statistics summary (public)
- `POST /api/estadisticas/daily` - Update daily statistics (protected)
- `GET /api/estadisticas/dashboard` - Get dashboard data (admin)

### AI Suggestions
- `GET /api/sugerencias` - Get all suggestions (protected)
- `GET /api/sugerencias/emprendimiento/:id_emprendimiento` - Get suggestions by emprendimiento (protected)
- `POST /api/sugerencias` - Create suggestion (protected)
- `PUT /api/sugerencias/:id/accept` - Accept suggestion (protected)
- `PUT /api/sugerencias/:id/reject` - Reject suggestion (protected)
- `DELETE /api/sugerencias/:id` - Delete suggestion (protected)

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Rate Limiting

The API implements rate limiting to prevent abuse:
- General endpoints: 100 requests per 15 minutes per IP
- Authentication endpoints: 5 requests per 15 minutes per IP
- Search endpoints: 30 requests per minute per IP

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message",
  "details": [] // Validation errors (if applicable)
}
```

## Logging

The application uses Winston for logging with multiple transports:
- Console output (development)
- Error log file
- Combined log file

Log files are stored in the `logs/` directory with a 5MB rotation limit.

## Security Features

- **Helmet**: Security headers middleware
- **CORS**: Cross-origin resource sharing configuration
- **Input Validation**: Express-validator for request validation
- **Password Hashing**: bcryptjs with salt rounds
- **SQL Injection Prevention**: Parameterized queries
- **Rate Limiting**: Protection against brute force attacks

## Development

### Running Tests
```bash
npm test
```

### Code Structure
```
src/
|-- config/
|   |-- database.js          # Database configuration
|-- controllers/
|   |-- authController.js    # Authentication logic
|   |-- emprendimientoController.js
|   |-- ...other controllers
|-- middleware/
|   |-- auth.js              # Authentication middleware
|   |-- errorHandler.js     # Error handling
|   |-- rateLimiter.js       # Rate limiting
|-- models/
|   |-- User.js              # User model
|   |-- Emprendimiento.js    # Emprendimiento model
|   |-- ...other models
|-- routes/
|   |-- auth.js              # Authentication routes
|   |-- emprendimientos.js   # Emprendimiento routes
|   |-- ...other routes
|-- utils/
|   |-- logger.js            # Logging configuration
|-- server.js                # Main server file
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_SERVER` | Azure SQL server | - |
| `DB_DATABASE` | Database name | - |
| `DB_USER` | Database username | - |
| `DB_PASSWORD` | Database password | - |
| `DB_ENCRYPT` | Database encryption | true |
| `JWT_SECRET` | JWT secret key | - |
| `JWT_EXPIRES_IN` | JWT expiration time | 24h |
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment | development |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | 900000 |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | 100 |
| `LOG_LEVEL` | Logging level | info |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team.

## Deployment

### Production Deployment

1. Set environment variables for production
2. Build the application (if applicable)
3. Ensure database is configured and accessible
4. Start the server with `npm start`
5. Configure reverse proxy (nginx/Apache) if needed
6. Set up SSL certificates
7. Configure monitoring and logging

### Docker Deployment

A Dockerfile can be created for containerized deployment:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## API Documentation

For detailed API documentation with examples, refer to the individual endpoint documentation above or use API documentation tools like Swagger/Postman collections.
