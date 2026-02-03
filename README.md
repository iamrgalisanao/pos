# POS System

A modern, multi-tenant Point of Sale system built with Node.js, PostgreSQL, and Next.js.

## 🚀 Quick Start

### For New Developers

**First time setting up?** Follow our comprehensive setup guide:

👉 **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Complete step-by-step instructions

### Quick Setup (Existing Developers)

```bash
# Clone and setup
git clone https://github.com/iamrgalisanao/pos.git
cd pos
git submodule update --init --recursive

# Configure environment
copy .env.example .env

# Start with Docker (recommended)
docker-compose up -d

# Access the application
# Dashboard: http://localhost:3000
# Backend: http://localhost:4000
```

## 📚 Documentation

- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Complete development environment setup
- **[DOCKER_SETUP.md](./DOCKER_SETUP.md)** - Docker configuration and usage
- **[infrastructure/README.md](./infrastructure/README.md)** - Infrastructure details

## 🏗️ Architecture

### Technology Stack

**Backend:**
- Node.js + Express + TypeScript
- PostgreSQL (primary database)
- MongoDB (document store)
- Redis (cache)
- Socket.io (real-time updates)

**Frontend:**
- Next.js 16 + React 19
- TypeScript
- Tailwind CSS
- Zustand (state management)

**Infrastructure:**
- Docker + Docker Compose
- Kafka (message bus)
- RabbitMQ (hardware messaging)
- Elasticsearch (search)
- ClickHouse (analytics)

### Project Structure

```
pos/
├── backend/              # Backend API service
│   ├── src/             # Source code
│   ├── database/        # Database schemas
│   └── Dockerfile       # Backend container
├── dashboard/           # Frontend dashboard (submodule)
│   ├── src/            # Next.js source
│   └── Dockerfile      # Dashboard container
├── infrastructure/      # Infrastructure configs
├── Docs/               # Documentation
├── docker-compose.yml  # Docker orchestration
└── .env.example        # Environment template
```

## 🔧 Development

### Prerequisites

- Docker Desktop (recommended)
- OR Node.js 20+ and PostgreSQL 15+

### Running Locally

**With Docker (Recommended):**
```bash
docker-compose up -d
```

**Without Docker:**
```bash
# Terminal 1 - Backend
cd backend
npm install
npm run dev

# Terminal 2 - Dashboard
cd dashboard
npm install
npm run dev
```

### Common Commands

```bash
# View logs
docker-compose logs -f

# Rebuild services
docker-compose up -d --build

# Stop services
docker-compose down

# Reset everything
docker-compose down -v
docker-compose up -d --build
```

## 🌟 Features

- **Multi-tenant Architecture** - Support multiple businesses
- **Real-time Updates** - WebSocket-based live data
- **Inventory Management** - Track stock levels and batches
- **Customer Loyalty** - Points and voucher system
- **BIR Compliance** - Philippine tax reporting (Z-reports)
- **Analytics Dashboard** - Revenue and performance metrics
- **Offline Support** - Local database sync
- **Template System** - Industry-specific catalog templates

## 🔐 Security

- JWT-based authentication
- Row-level security (RLS) for multi-tenancy
- Audit logging for compliance
- Environment-based configuration

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Dashboard tests
cd dashboard
npm test
```

## 📦 Deployment

See deployment documentation in `/Docs` folder.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

[Add your license here]

## 🆘 Support

- **Setup Issues:** See [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- **Docker Issues:** See [DOCKER_SETUP.md](./DOCKER_SETUP.md)
- **Bug Reports:** Create an issue on GitHub

## 👥 Team

[Add team information here]

---

**Ready to get started?** → [SETUP_GUIDE.md](./SETUP_GUIDE.md)
