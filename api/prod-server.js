import express from 'express';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

// for esm mode
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.use('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ok',
  });
});

// Load routes asynchronously
async function loadRoutes() {
  try {
    // Use CommonJS require to load compiled backend (compiled with CommonJS)
    const require = (await import('node:module')).createRequire(import.meta.url);
    const authModule = require('../compiled/routes/auth.js');
    const emailModule = require('../compiled/routes/email.js');

    app.use('/api/auth', authModule.default || authModule);
    app.use('/api/email', emailModule.default || emailModule);

    console.log('Routes loaded successfully');
  } catch (error) {
    console.error('Failed to load routes:', error);
  }
}

// Serve static files from frontend build
app.use(express.static(path.join(__dirname, '../dist')));

// Serve index.html for all other routes (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Error handler
app.use((error, req, res, next) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  });
});

const PORT = process.env.PORT || 3000;

// Start server after loading routes
loadRoutes().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`Server ready on port ${PORT}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT signal received');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
}).catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

export default app;
