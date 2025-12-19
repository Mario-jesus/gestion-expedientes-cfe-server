import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const app: Application = express();

// Middlewares básicos
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta de health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Ruta raíz
app.get('/', (_req: Request, res: Response) => {
  res.json({ 
    message: 'API Gestión de Expedientes CFE',
    version: '1.0.0'
  });
});

// Manejo de rutas no encontradas
app.use((req: Request, res: Response) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.path
  });
});

// Manejo global de errores
app.use((err: Error, _req: Request, res: Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

export default app;
