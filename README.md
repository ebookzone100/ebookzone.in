# ebookzone.in

An online ebook store platform with admin dashboard and backend server.

## Project Structure

The project consists of three main components:

1. **E-book Store Frontend** (`/mcp_all_files/home/ubuntu/mcp_all_files/ebook-store/`)
   - Built with React + Vite
   - Customer-facing web application
   - Features: Book browsing, purchasing, user authentication

2. **Admin Dashboard** (`/mcp_all_files/home/ubuntu/mcp_all_files/ebook-admin-dashboard/`)
   - Built with React + Vite
   - Admin interface for managing the platform
   - Features: Book management, order tracking, analytics

3. **Backend Server** (`/mcp_all_files/home/ubuntu/mcp_all_files/ebook-mcp-server/`)
   - Built with Python
   - RESTful API server
   - Features: Authentication, database management, business logic

## Setup Instructions

### Prerequisites
- Node.js (for frontend projects)
- Python 3.11+ (for backend server)
- pnpm (package manager)

### E-book Store Frontend
```bash
cd mcp_all_files/home/ubuntu/mcp_all_files/ebook-store
pnpm install
pnpm run dev
```

### Admin Dashboard
```bash
cd mcp_all_files/home/ubuntu/mcp_all_files/ebook-admin-dashboard
pnpm install
pnpm run dev
```

### Backend Server
```bash
cd mcp_all_files/home/ubuntu/mcp_all_files/ebook-mcp-server
pip install -r requirements.txt
python src/main.py
```

## Features

### E-book Store
- Browse and search books
- User authentication
- Shopping cart functionality
- Secure payment processing
- Multiple currency support
- Responsive design

### Admin Dashboard
- Book inventory management
- Order tracking
- User management
- Analytics and reporting
- Settings configuration

### Backend Server
- RESTful API endpoints
- Database management
- Authentication and authorization
- Order processing
- Analytics data processing

## Tech Stack

- **Frontend**: React, Vite, TailwindCSS
- **Backend**: Python
- **Database**: SQLite
- **Authentication**: JWT
- **Payment Processing**: Integration ready

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Deployment

### Frontend Deployment
The frontend is automatically deployed to GitHub Pages when changes are pushed to the main branch. You can access it at:
- Store: https://ebookzone100.github.io/ebookzone.in/
- Admin: https://ebookzone100.github.io/ebookzone.in/admin/

### Backend Deployment
1. Set up environment variables:
   ```bash
   cp .env.production .env
   # Edit .env with your production settings
   ```

2. Install production dependencies:
   ```bash
   pip install gunicorn
   pip install -r requirements.txt
   ```

3. Run with gunicorn:
   ```bash
   gunicorn -w 4 'src.main:app'
   ```

## License

This project is licensed under the MIT License.