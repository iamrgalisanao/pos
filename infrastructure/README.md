# POS Infrastructure

This directory contains the Docker configuration for the local development environment.

## Services Included

| Service | Technology | Port | Purpose |
| :--- | :--- | :--- | :--- |
| **Relational DB** | PostgreSQL | 5432 | Orders, Transactions, Users |
| **Document Store**| MongoDB | 27017 | Product Catalog, Metadata |
| **Cache** | Redis | 6379 | Real-time session & metrics |
| **Event Bus** | Kafka | 9092 | Inter-service communication |
| **Hardware Queue**| RabbitMQ | 5672 | Reliable printer/scanner tasks |
| **Search** | Elasticsearch| 9200 | Product & Customer search |
| **Analytics** | ClickHouse | 8123 | OLAP reporting |

## Getting Started

1. **Verify Docker**: Ensure Docker Desktop is running.
2. **Start Services**:
   ```bash
   npm run infra:up
   ```
   *Note: This command is run from the root directory.*

3. **Check Status**:
   ```bash
   docker-compose ps
   ```

4. **Stop Services**:
   ```bash
   npm run infra:down
   ```

## Configuration

Configuration is managed via environment variables. See `.env.example` for available options. To override defaults, create a `.env` file in this directory.
