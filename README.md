A modern, full-stack personal finance management application that helps users track expenses, manage budgets, and visualize spending patterns with an intuitive, responsive interface featuring glassmorphism design.
🌟 Live Demo

Frontend: https://expense-tracker-frontend-o4bgx5b7y-rithvik-madupurus-projects.vercel.app/
API Health Check: https://expensetracker-a20g.onrender.com/api/health

📋 Table of Contents

Features
Tech Stack
Getting Started
Installation
API Endpoints
Project Structure
Screenshots
Contributing
Contact

✨ Features
Core Functionality

User Authentication: Secure JWT-based registration and login system
Transaction Management: Add, edit, delete, and categorize income/expense transactions
Category System: Custom categories with colors and icons for better organization
Dashboard Analytics: Real-time balance tracking and spending summaries
Data Visualization: Interactive charts showing monthly spending trends

Advanced Features

CSV Export: Download complete transaction history as CSV files
Responsive Design: Mobile-first design with glassmorphism UI effects and CSS3 animations
Real-time Updates: Live balance calculations and transaction filtering
Search & Filter: Advanced filtering by category, date, and transaction type
Quick Actions: One-click navigation to frequently used features

Technical Highlights

RESTful API: Clean, documented API endpoints with proper error handling
Secure Authentication: JWT tokens with validation and refresh mechanisms
Database Optimization: Efficient PostgreSQL queries with proper relationships
Production Ready: CORS configuration, environment variables, and deployment setup
Modern UI/UX: Glassmorphism effects, hover animations, and smooth transitions

🛠 Tech Stack
Frontend

React 18 - Modern hooks-based component architecture
CSS3 - Custom animations, glassmorphism effects, and responsive design
JavaScript ES6+ - Async/await, destructuring, and modern syntax

Backend

Node.js - JavaScript runtime for server-side development
Express.js - Web framework with middleware for routing and error handling
PostgreSQL - Relational database for data persistence
JWT - JSON Web Tokens for secure authentication

DevOps & Deployment

Vercel - Frontend hosting with automatic deployments
Render - Backend hosting with environment management
GitHub - Version control and CI/CD integration

🚀 Getting Started
Prerequisites

Node.js (v14.0.0 or later)
npm or yarn
PostgreSQL (v12.0 or later)
Git

Environment Variables
Create .env files in both frontend and backend directories:
Backend (.env)
env# Database
DATABASE_URL=postgresql://username:password@localhost:5432/wealthflow
DB_HOST=localhost
DB_PORT=5432
DB_NAME=wealthflow
DB_USER=your_username
DB_PASSWORD=your_password

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d

# Server
PORT=5000
NODE_ENV=development

# CORS
FRONTEND_URL=http://localhost:3000
Frontend (.env)
envREACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENV=development
⚡ Installation
1. Clone the Repository
bashgit clone https://github.com/rithvikmadupuru12/ExpenseTracker.git
cd ExpenseTracker
2. Install Backend Dependencies
bashcd server
npm install
3. Install Frontend Dependencies
bashcd ../client
npm install
4. Set up PostgreSQL Database
bash# Create database
createdb wealthflow

# Run any migration scripts if available
cd ../server
npm run migrate
5. Start Development Servers
Terminal 1 - Backend:
bashcd server
npm run dev
Terminal 2 - Frontend:
bashcd client
npm start
The application will be available at:

Frontend: http://localhost:3000
Backend API: http://localhost:5000

🔗 API Endpoints
Authentication
httpPOST /api/auth/register    # User registration
POST /api/auth/login       # User login
GET  /api/auth/me         # Get current user info
Transactions
httpGET    /api/transactions           # Get all user transactions
POST   /api/transactions           # Create new transaction
PUT    /api/transactions/:id       # Update specific transaction
DELETE /api/transactions/:id       # Delete specific transaction
GET    /api/transactions/stats/summary  # Get financial summary
Categories
httpGET    /api/categories        # Get all categories
POST   /api/categories        # Create new category
PUT    /api/categories/:id    # Update specific category
DELETE /api/categories/:id    # Delete specific category
Budgets
httpGET    /api/budgets          # Get all budgets
POST   /api/budgets          # Create new budget
PUT    /api/budgets/:id      # Update specific budget
DELETE /api/budgets/:id      # Delete specific budget
📁 Project Structure
ExpenseTracker/
├── client/                    # React frontend
│   ├── public/
│   │   ├── index.html
│   │   └── favicon.ico
│   ├── src/
│   │   ├── components/
│   │   ├── App.js
│   │   ├── App.css
│   │   └── index.js
│   └── package.json
├── server/                    # Express backend
│   ├── routes/
│   │   ├── auth.js
│   │   ├── transactions.js
│   │   ├── categories.js
│   │   └── budgets.js
│   ├── middleware/
│   ├── models/
│   ├── app.js
│   └── package.json
└── README.md
📸 Screenshots
Dashboard Overview
Show Image
Modern dashboard with glassmorphism design showing financial overview, spending trends, and recent transactions
Transaction Management
Show Image
Comprehensive transaction management with filtering, editing, and categorization features
Category System
Show Image
Custom category management with color coding and icon selection for better organization
Mobile Responsive Design
Show Image
Fully responsive design optimized for mobile devices with touch-friendly interface
🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.
Development Process

Fork the repository
Create your feature branch (git checkout -b feature/AmazingFeature)
Commit your changes (git commit -m 'Add some AmazingFeature')
Push to the branch (git push origin feature/AmazingFeature)
Open a Pull Request

Code Style

Use ESLint configuration provided in the repository
Follow React best practices and hooks patterns
Write clean, commented code with meaningful variable names
Include JSDoc comments for complex functions

📧 Contact
Rithvik Madupuru

Email: RIM183@pitt.edu
LinkedIn: https://www.linkedin.com/in/rithvik-madupuru-9aab7727b/
GitHub: @rithvikmadupuru12

🏗️ Architecture & Design Decisions

Component-based Architecture: Modular React components for maintainability
RESTful API Design: Standard HTTP methods and status codes
JWT Authentication: Stateless authentication for scalability
Responsive Design: Mobile-first approach with CSS Grid and Flexbox
Modern CSS: Glassmorphism effects and smooth animations for enhanced UX


⭐ Star this repository if you found it helpful!
