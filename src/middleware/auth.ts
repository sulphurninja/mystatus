import jwt, { SignOptions } from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import SubAdmin from '@/models/SubAdmin';
import { AdminPermission, hasAdminPermission } from '@/lib/adminPermissions';

export interface JWTPayload {
  id: string;
  type: 'user' | 'vendor' | 'admin' | 'sub-admin' | 'verification';
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

export function authenticateRequest(
  request: NextRequest,
  allowedTypes: ('user' | 'vendor' | 'admin' | 'sub-admin' | 'verification')[] = ['user', 'vendor', 'admin']
) {
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

export function generateToken(id: string, type: 'user' | 'vendor' | 'admin' | 'sub-admin' | 'verification'): string {
  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRE || '7d') as SignOptions['expiresIn'],
  };

  return jwt.sign(
    { id, type },
    process.env.JWT_SECRET || 'fallback-secret',
    options
  );
}

export async function authorizeAdminRequest(
  request: NextRequest,
  requiredPermissions?: AdminPermission | AdminPermission[]
) {
  const auth = authenticateRequest(request, ['admin', 'sub-admin']);

  if (auth.error || !auth.user) {
    return {
      error: auth.error || { message: 'Authentication failed', status: 401 },
      user: null,
      subAdmin: null,
      isMainAdmin: false,
    };
  }

  if (auth.user.type === 'admin') {
    return {
      error: null,
      user: auth.user,
      subAdmin: null,
      isMainAdmin: true,
    };
  }

  await connectToDatabase();
  const subAdmin = await SubAdmin.findById(auth.user.id).select('-password');

  if (!subAdmin || !subAdmin.isActive) {
    return {
      error: { message: 'Sub-admin account is inactive or not found', status: 403 },
      user: auth.user,
      subAdmin: null,
      isMainAdmin: false,
    };
  }

  if (requiredPermissions && !hasAdminPermission(subAdmin.permissions, requiredPermissions)) {
    return {
      error: { message: 'Sub-admin does not have permission for this action', status: 403 },
      user: auth.user,
      subAdmin,
      isMainAdmin: false,
    };
  }

  return {
    error: null,
    user: auth.user,
    subAdmin,
    isMainAdmin: false,
  };
}
