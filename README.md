# MetroUni - Social Network for Metropolitan University

A full-stack social networking platform built specifically for Metropolitan University students and faculty. Features real-time messaging, post sharing, notifications, and Telegram bot integration.

## 🚀 Features

### Core Functionality
- **User Authentication**: JWT-based authentication with MU student ID or .edu email verification
- **Social Feed**: Create, share, and interact with posts
- **Real-time Updates**: Live notifications and updates using Socket.IO
- **Comments System**: Threaded comments with likes and replies
- **User Profiles**: Customizable profiles with bio, location, and activity history
- **Admin Dashboard**: Comprehensive admin panel for user and content management

### Telegram Integration
- **Bot Integration**: Automated posting from Telegram groups
- **Content Forwarding**: Seamless content sharing between Telegram and the platform

### Technical Features
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Real-time Notifications**: Instant notifications for likes, comments, and follows
- **File Upload**: Support for images and media in posts
- **Search & Discovery**: Find users, posts, and content easily
- **Role-based Access**: User and admin role management

## 🛠 Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Socket.IO Client** for real-time features
- **Axios** for API calls
- **React Hot Toast** for notifications
- **Lucide React** for icons
- **Date-fns** for date formatting

### Backend
- **Node.js** with Express.js
- **PostgreSQL** database
- **Socket.IO** for real-time communication
- **JWT** for authentication
- **Joi** for validation
- **Bcrypt** for password hashing
- **Multer** for file uploads
- **CORS** for cross-origin requests

### Bot & Integration
- **Node Telegram Bot API** for Telegram integration
- **Webhook support** for real-time message forwarding

## 📋 Prerequisites

Before running this project, make sure you have the following installed:

- **Node.js** (v18 or higher)
- **PostgreSQL** (v13 or higher)
- **npm** or **yarn**

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd MetroUni
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file from the example:
```bash
cp .env.example .env
```

Update the `.env` file with your database credentials:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=metrouni
DB_USER=your_postgres_user
DB_PASSWORD=your_postgres_password
JWT_SECRET=your-super-secret-jwt-key
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

Set up the PostgreSQL database:
```bash
# Create database
createdb metrouni

# Run migrations (create tables)
npm run migrate

# Seed initial data (optional)
npm run seed
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Create a `.env` file:
```bash
cp .env.example .env
```

Update the frontend `.env` file:
```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
VITE_APP_NAME=MetroUni
```

### 4. Telegram Bot Setup (Optional)

```bash
cd ../telegram-bot
npm install
```

Create a `.env` file:
```bash
cp .env.example .env
```

Configure the Telegram bot:
```env
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
BOT_SECRET_TOKEN=your-secret-token
API_URL=http://localhost:5000
```

To get a Telegram bot token:
1. Message @BotFather on Telegram
2. Send `/newbot` and follow the instructions
3. Copy the token to your `.env` file

## 🏃‍♂️ Running the Application

### Development Mode

1. **Start the Backend** (Terminal 1):
```bash
cd backend
npm run dev
```

2. **Start the Frontend** (Terminal 2):
```bash
cd frontend
npm run dev
```

3. **Start the Telegram Bot** (Terminal 3, Optional):
```bash
cd telegram-bot
npm start
```

### Production Mode

1. **Build the Frontend**:
```bash
cd frontend
npm run build
```

2. **Start the Backend**:
```bash
cd backend
npm start
```

The application will be available at:
- **Frontend**: http://localhost:5173 (development) or served by backend (production)
- **Backend API**: http://localhost:5000
- **Admin Dashboard**: http://localhost:5173/admin (admin users only)

## 📁 Project Structure

```
MetroUni/
├── backend/                    # Node.js/Express backend
│   ├── config/                # Database configuration
│   ├── middleware/            # Auth, validation middleware
│   ├── models/               # Database models
│   ├── routes/               # API routes
│   ├── scripts/              # Database scripts
│   ├── server.js             # Main server file
│   └── package.json
├── frontend/                  # React frontend
│   ├── public/               # Static assets
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── contexts/         # React contexts
│   │   ├── pages/           # Page components
│   │   ├── services/        # API and socket services
│   │   ├── types/           # TypeScript types
│   │   ├── utils/           # Utility functions
│   │   └── App.tsx          # Main app component
│   └── package.json
└── telegram-bot/             # Telegram bot service
    ├── bot.js               # Bot logic
    └── package.json
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify JWT token

### Users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user profile
- `DELETE /api/users/:id` - Delete user account

### Posts
- `GET /api/posts` - Get feed posts
- `POST /api/posts` - Create new post
- `GET /api/posts/:id` - Get specific post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/like` - Like/unlike post

### Comments
- `GET /api/comments/post/:id` - Get post comments
- `POST /api/comments` - Create comment
- `PUT /api/comments/:id` - Update comment
- `DELETE /api/comments/:id` - Delete comment
- `POST /api/comments/:id/like` - Like/unlike comment

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read
- `PUT /api/notifications/read-all` - Mark all notifications as read

### Admin (Admin users only)
- `GET /api/admin/users` - Get all users
- `GET /api/admin/posts` - Get all posts
- `DELETE /api/admin/users/:id` - Delete user
- `DELETE /api/admin/posts/:id` - Delete post
- `POST /api/admin/notifications/broadcast` - Send broadcast notification

## 🔐 Environment Variables

### Backend (.env)
- `DB_HOST` - PostgreSQL host
- `DB_PORT` - PostgreSQL port
- `DB_NAME` - Database name
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `JWT_SECRET` - JWT signing secret
- `PORT` - Server port
- `NODE_ENV` - Environment (development/production)
- `FRONTEND_URL` - Frontend URL for CORS

### Frontend (.env)
- `VITE_API_URL` - Backend API URL
- `VITE_SOCKET_URL` - Socket.IO server URL
- `VITE_APP_NAME` - Application name

### Telegram Bot (.env)
- `TELEGRAM_BOT_TOKEN` - Telegram bot token
- `BOT_SECRET_TOKEN` - Bot webhook secret
- `API_URL` - MetroUni API URL

## 🧪 Testing

### Frontend
```bash
cd frontend
npm run lint        # Run ESLint
npm run build       # Test build process
```

### Backend
```bash
cd backend
npm test           # Run tests (if implemented)
```

## 🚀 Deployment

### Frontend Deployment
1. Build the frontend:
```bash
cd frontend
npm run build
```

2. Serve the `dist` folder using a static file server or CDN.

### Backend Deployment
1. Set up a PostgreSQL database on your server
2. Configure environment variables for production
3. Install dependencies: `npm install --production`
4. Start the server: `npm start`

### Telegram Bot Deployment
1. Configure webhook URL in production
2. Set environment variables
3. Deploy alongside backend or as separate service

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Commit your changes: `git commit -am 'Add some feature'`
5. Push to the branch: `git push origin feature-name`
6. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Open an issue in the repository
- Contact the development team
- Check the documentation

## 🔮 Future Enhancements

- [ ] Direct messaging system
- [ ] Group creation and management
- [ ] File sharing and document collaboration
- [ ] Event management and calendar integration
- [ ] Mobile app (React Native)
- [ ] Advanced search and filtering
- [ ] Analytics dashboard for admins
- [ ] Multi-language support
- [ ] Video/audio calling integration
- [ ] Course integration with university systems

---

Built with ❤️ for Metropolitan University
