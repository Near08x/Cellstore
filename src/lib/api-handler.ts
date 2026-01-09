import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

/**
 * Custom API Error class with status code
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Wraps API route handlers with consistent error handling
 * 
 * @param handler - Async function that handles the request
 * @returns NextResponse with proper error handling
 * 
 * @example
 * ```typescript
 * export const GET = apiHandler(async (req) => {
 *   const data = await fetchData();
 *   return { data };
 * });
 * ```
 */
export function apiHandler<T = any>(
  handler: (req: Request) => Promise<T>
) {
  return async (req: Request) => {
    try {
      const result = await handler(req);
      
      // If handler returns a NextResponse, return it directly
      if (result instanceof NextResponse) {
        return result;
      }
      
      // Otherwise wrap in NextResponse
      return NextResponse.json(result);
    } catch (error) {
      // Handle Zod validation errors
      if (error instanceof ZodError) {
        return NextResponse.json(
          {
            error: 'Validation error',
            details: error.errors.map(err => ({
              path: err.path.join('.'),
              message: err.message,
            })),
            timestamp: new Date().toISOString(),
          },
          { status: 400 }
        );
      }

      // Handle custom API errors
      if (error instanceof ApiError) {
        return NextResponse.json(
          {
            error: error.message,
            code: error.code,
            timestamp: new Date().toISOString(),
          },
          { status: error.statusCode }
        );
      }

      // Handle unknown errors
      const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
      
      console.error('API Error:', {
        url: req.url,
        method: req.method,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      });

      return NextResponse.json(
        {
          error: errorMessage,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }
  };
}
