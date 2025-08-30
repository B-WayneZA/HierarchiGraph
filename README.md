# HierarchiGraph - Employee Hierarchy Management System

A modern, cloud-hosted application for managing organizational employee hierarchies. Built with TypeScript, React, Node.js, and MongoDB.

## Features

- **Employee Management**: Create, read, update, and delete employee records
- **Hierarchy Visualization**: Interactive organizational chart with force-directed graph
- **Authentication System**: JWT-based authentication with role-based access control
- **Gravatar Integration**: Automatic avatar generation using email addresses
- **Responsive Design**: Modern UI built with Tailwind CSS
- **Real-time Updates**: Live data synchronization across the application
- **Admin Controls**: Role-based permissions for administrative functions

## Tech Stack

### Backend
- **Node.js** with TypeScript
- **Express.js** for API framework
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Express Validator** for input validation

### Frontend
- **React 18** with TypeScript
- **React Router** for navigation
- **React Hook Form** for form management
- **Axios** for API communication
- **React Force Graph** for hierarchy visualization
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **React Hot Toast** for notifications

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd HierarchiGraph
```

### 2. Backend Setup
```bash
cd backend
npm install
```

#### MongoDB Setup Options:

**Option A: Local MongoDB**
```env
MONGODB_URI=mongodb://localhost:27017/hierarchigraph
```

**Option B: MongoDB Atlas (Recommended)**
1. Follow the [MongoDB Atlas Setup Guide](backend/MONGODB_ATLAS_SETUP.md)
2. Create a `.env` file with your Atlas connection string:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/hierarchigraph?retryWrites=true&w=majority
```

#### Complete Environment Configuration:
Create a `.env` file in the backend directory:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration (Choose one)
MONGODB_URI=mongodb://localhost:27017/hierarchigraph
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/hierarchigraph?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Gravatar Configuration
GRAVATAR_DEFAULT=identicon
GRAVATAR_SIZE=200
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

### 4. Start the Application

#### Development Mode
```bash
# Terminal 1 - Start Backend
cd backend
npm run dev

# Terminal 2 - Start Frontend
cd frontend
npm start
```

#### Production Mode
```bash
# Build frontend
cd frontend
npm run build

# Start backend
cd backend
npm run build
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Employees
- `GET /api/employees` - Get all employees
- `GET /api/employees/:id` - Get employee by ID
- `POST /api/employees` - Create new employee (Admin only)
- `PUT /api/employees/:id` - Update employee (Admin only)
- `DELETE /api/employees/:id` - Delete employee (Admin only)
- `GET /api/employees/hierarchy/tree` - Get organizational hierarchy

## Database Schema

### User Model
```typescript
{
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'user';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Employee Model
```typescript
{
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  department: string;
  hireDate: Date;
  salary: number;
  managerId?: ObjectId;
  subordinates: ObjectId[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

## Gravatar Integration

The application automatically generates avatars using Gravatar based on email addresses. The integration includes:

- Automatic avatar generation for users and employees
- Real-time preview during form input
- Consistent avatar display across the application
- Fallback to default identicon when no Gravatar is found

## Features in Detail

### 1. Authentication System
- Secure JWT-based authentication
- Password hashing with bcryptjs
- Role-based access control (Admin/User)
- Protected routes and API endpoints
- Automatic token refresh

### 2. Employee Management
- Complete CRUD operations for employees
- Search and filtering capabilities
- Department and status filtering
- Manager assignment and hierarchy management
- Bulk operations support

### 3. Hierarchy Visualization
- Interactive force-directed graph
- Real-time hierarchy updates
- Employee node selection and details
- Zoom and pan controls
- Responsive design for mobile devices

### 4. User Interface
- Modern, responsive design with Tailwind CSS
- Intuitive navigation and user experience
- Real-time form validation
- Toast notifications for user feedback
- Loading states and error handling

## Security Features

- JWT token authentication
- Password hashing with salt
- Input validation and sanitization
- CORS configuration
- Helmet.js security headers
- Role-based access control
- Protected API endpoints

## Deployment

### AWS EC2 Deployment (Recommended)

The application is configured for deployment on AWS EC2 with production-ready setup.

#### Quick Deployment Steps:

1. **Launch EC2 Instance**
   - Ubuntu Server 22.04 LTS
   - t3.medium or larger
   - Configure security groups (SSH, HTTP, HTTPS)

2. **Run Setup Script**
   ```bash
   curl -O https://raw.githubusercontent.com/your-repo/hierarchigraph/main/deploy/ec2-setup.sh
   chmod +x ec2-setup.sh
   ./ec2-setup.sh
   ```

3. **Deploy Application**
   ```bash
   cd /var/www/hierarchigraph
   git clone <your-repo-url> .
   ./deploy/deploy.sh
   ```

4. **Set Up SSL**
   ```bash
   ./deploy/ssl-setup.sh your-domain.com your-email@domain.com
   ```

#### Detailed Deployment Guide:
See [AWS EC2 Deployment Guide](deploy/README.md) for complete instructions.

### Environment Variables

#### Development
```env
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/hierarchigraph
JWT_SECRET=your-development-secret
```

#### Production
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/hierarchigraph
JWT_SECRET=your-production-jwt-secret
CORS_ORIGINS=https://your-domain.com
```

### Build Process
```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

### Docker Support
The application can be containerized using Docker:

```dockerfile
# Backend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository or contact the development team.

## Roadmap

- [ ] Advanced reporting and analytics
- [ ] Export functionality (PDF, Excel)
- [ ] Email notifications
- [ ] Mobile application
- [ ] Advanced search and filtering
- [ ] Audit logging
- [ ] Multi-tenant support
- [ ] API rate limiting
- [ ] WebSocket real-time updates
