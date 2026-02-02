---
description: How to setup and run the POS system infrastructure and services
---

# POS Project Setup and Run Workflow

Follow these steps to get the system up and running.

## Prerequisites
- Docker and Docker Desktop installed and running.
- Node.js (v18+) and npm installed.

## 1. Initial Setup
Install root dependencies and link workspaces.
```bash
npm install
```

## 2. Infrastructure Setup
// turbo
1. Start the Docker containers:
```bash
npm run infra:up
```
2. Verify services are running:
```bash
docker-compose -f infrastructure/docker-compose.yml ps
```

## 3. Backend Setup
1. Create `.env` from `.env.example`:
```bash
cp backend/.env.example backend/.env
```
2. Start backend in development mode:
```bash
npm run dev:backend
```

## 4. Dashboard Setup
1. Create `.env` from `.env.example`:
```bash
cp dashboard/.env.example dashboard/.env
```
2. Start dashboard in development mode:
```bash
npm run dev:dashboard
```

## 5. Cleaning Up
Stop all infrastructure services:
```bash
npm run infra:down
```
