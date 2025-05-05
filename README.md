# CSV Processor

A robust NestJS application for processing CSV files with multiple processing methods, including direct API processing and asynchronous processing via RabbitMQ.

## Overview

CSV Processor is a full-featured backend service that allows users to upload, process, and manage CSV data. The application provides both synchronous and asynchronous processing options, with a focus on reliability, scalability, and security.

## Features

- **CSV File Processing**: Upload and process CSV files with validation
- **Multiple Processing Methods**:
  - Direct API processing
  - Asynchronous processing via RabbitMQ queues
- **User Authentication**: Secure JWT-based authentication
- **Data Management**: Retrieve, search, and delete processed CSV data
- **API Documentation**: Comprehensive Swagger documentation
- **Containerization**: Docker and Docker Compose support for easy deployment
- **Database Integration**: PostgreSQL for reliable data storage

## Technologies Used

- **Backend Framework**: NestJS
- **Database**: PostgreSQL with TypeORM
- **Message Queue**: RabbitMQ
- **Authentication**: JWT, Passport
- **API Documentation**: Swagger/OpenAPI
- **Containerization**: Docker, Docker Compose
- **Language**: TypeScript
- **CSV Parsing**: csv-parse

## System Architecture

The application follows a modular architecture with the following components:

- **CSV Module**: Handles CSV file processing, validation, and storage
- **Auth Module**: Manages user authentication and authorization
- **RabbitMQ Module**: Provides asynchronous processing capabilities
- **Users Module**: Manages user data and relationships
- **Config Module**: Centralizes application configuration

### Processing Flow

1. **Direct Processing**:
   - User uploads CSV file via API
   - File is validated and processed
   - Data is stored in the database
   - Response is sent back to the user

2. **Asynchronous Processing via RabbitMQ**:
   - **Queue1 (csv.upload)**:
     - User uploads CSV file via API
     - File is encoded (base64) and sent to RabbitMQ queue1
     - Consumer processes the file and stores data in the database

   - **Queue2 (csv.process)**:
     - Receives the CSV file in the same format as queue1
     - Processes the CSV file to extract records
     - For each record, publishes an individual message to queue3

   - **Queue3 (csv.save)**:
     - Receives individual records from queue2
     - Saves each record to the database

## Installation & Setup

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL
- RabbitMQ
- Docker and Docker Compose (optional)

### Local Development Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd csv-processor
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=postgres
   DB_DATABASE=csv_app
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRATION=1d
   RABBITMQ_URL=amqp://guest:guest@localhost:5672
   APP_PORT=3001
   ```

4. Start the PostgreSQL and RabbitMQ services:
   ```bash
   docker-compose up -d postgres rabbitmq
   ```

5. Run database migrations(not needed):
   ```bash
   npm run migration:run
   ```

6. Start the application:
   ```bash
   npm run start:dev
   ```

### Docker Deployment

To deploy the entire application stack using Docker:

```bash
docker-compose --profile dev up -d
```

This will start the PostgreSQL database, RabbitMQ, and the application.

## Usage Instructions

### API Endpoints

The application exposes the following main endpoints:

- **Authentication**:
  - `POST /api/v1/auth/register`: Register a new user
  - `POST /api/v1/auth/login`: Login and get JWT token

- **CSV Operations**:
  - `POST /api/v1/csv/upload`: Upload and process a CSV file directly
  - `POST /api/v1/csv/queue1`: Upload and process a CSV file via RabbitMQ queue1
  - `POST /api/v1/csv/queue2`: Upload and process a CSV file via RabbitMQ queue2 and queue3
  - `GET /api/v1/csv`: Get all CSV data for the authenticated user
  - `GET /api/v1/csv/:code`: Get CSV data by code
  - `DELETE /api/v1/csv`: Delete all CSV data for the authenticated user

### CSV File Format

The application expects CSV files with the following columns:
- `Code` (required): A unique identifier for each record
- `Id`: Numeric identifier
- `Name`: Name or description
- `Value`: Numeric value

Example:
```
Code,Id,Name,Value
ABC123,1,Product A,100
DEF456,2,Product B,200
```

## API Documentation

The API documentation is available via Swagger UI at:
```
http://localhost:3001/api
```

This provides a comprehensive interface to explore and test all available endpoints.
