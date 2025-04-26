# Web Form Application Deployment Guide

This guide will help you deploy the web form application with TinyDB database integration.

## Prerequisites

- Node.js (v16 or higher)
- Python 3.11 or higher
- npm or yarn package manager

## Installation Steps

1. **Extract the zip file**

   Extract the contents of `web-form-app.zip` to your desired deployment location.

2. **Install dependencies**

   ```bash
   # Install Node.js dependencies
   npm install

   # Install Python dependencies
   pip install tinydb
   ```

3. **Start the application**

   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm run build
   npm start
   ```

   By default, the application will be available at http://localhost:5000

## Application Structure

- `client/`: Frontend React application with Vue-inspired components
- `server/`: Backend Express server with TinyDB integration
- `shared/`: Shared schemas and types
- `data/`: TinyDB database files (will be created automatically)
- `uploads/`: Uploaded files storage

## Features

1. **Web Form**
   - Feature selection checkboxes (BPM, Key, Approachability, Engagement)
   - Classification model selection (Discogs-Effnet, Musicnn, Magnatagatune)
   - File upload functionality with drag-and-drop support
   - Form validation

2. **Database**
   - TinyDB for data persistence
   - JSON file-based storage
   - Python-TypeScript bridge for database operations

3. **External Integration**
   - Submits form data to external Express server on port 8090
   - CORS-enabled for cross-origin requests

## Configuration

The application uses the following configuration files:

- `package.json`: Node.js dependencies and scripts
- `tsconfig.json`: TypeScript configuration
- `vite.config.ts`: Vite bundler configuration
- `tailwind.config.ts`: Tailwind CSS configuration
- `theme.json`: UI theme configuration

## Troubleshooting

- **Database Issues**: Check that the `data/` directory is writable and that Python with TinyDB is properly installed.
- **File Upload Issues**: Ensure the `uploads/` directory is writable.
- **Server Start Issues**: Check for port conflicts on 5000.
- **External Server Issues**: Ensure the external Express server is running on port 8090. If using a different port or address, update the submission URL in `client/src/pages/VueInspiredForm.tsx`.

## Development Notes

- The application uses a Vue-inspired architecture within React for the form
- TinyDB is accessed through a Python bridge from TypeScript
- Form submissions are saved in TinyDB and can be retrieved via the API

## API Endpoints

- Local server:
  - `POST /api/form`: Submit form data (handled by local server for fallback)
  - `GET /api/form`: Get all form submissions

- External server:
  - `POST http://localhost:8090/api/form`: Primary form submission endpoint

## License

This project is licensed under the MIT License.