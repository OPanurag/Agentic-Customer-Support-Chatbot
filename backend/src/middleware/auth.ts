import { Request, Response, NextFunction } from 'express';

/**
 * Simple API key authentication middleware
 * For demo purposes - in production, use proper JWT or OAuth
 */
export function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey as string;
  const validApiKey = process.env.API_KEY;

  // If no API key is set, allow access (for development)
  if (!validApiKey) {
    console.warn('⚠️  API_KEY not set - data endpoints are publicly accessible');
    return next();
  }

  // If API key is provided and matches, allow access
  if (apiKey && apiKey === validApiKey) {
    return next();
  }

  // Otherwise, deny access
  res.status(401).json({
    error: 'Unauthorized',
    message: 'Valid API key required. Provide it via X-API-Key header or ?apiKey query parameter.',
  });
}

