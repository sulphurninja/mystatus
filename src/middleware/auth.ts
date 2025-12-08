import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

export interface JWTPayload {
  id: string;
  type: 'user' | 'vendor' | 'admin';
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

export function authenticateRequest(request: NextRequest, allowedTypes: ('user' | 'vendor' | 'admin')[] = ['user', 'vendor', 'admin']) {
  const token = getTokenFromRequest(request);

  if (!token) {
    return {
      error: { message: 'No token provided', status: 401 },
      user: null
    };
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    return {
      error: { message: 'Invalid token', status: 401 },
      user: null
    };
  }

  if (!allowedTypes.includes(decoded.type)) {
    return {
      error: { message: 'Insufficient permissions', status: 403 },
      user: null
    };
  }

  return {
    error: null,
    user: decoded
  };
}

export function generateToken(id: string, type: 'user' | 'vendor' | 'admin'): string {
  return jwt.sign(
    { id, type },
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
}
