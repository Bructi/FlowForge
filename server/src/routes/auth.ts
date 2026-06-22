import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database';
import { generateAccessToken, generateRefreshToken, getTokenExpiry } from '../utils/jwt';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';

const router = Router();

// ─── POST /api/auth/signup ────────────────────────────────
router.post('/signup', asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) throw createError('Name, email and password are required', 400);
  if (password.length < 6) throw createError('Password must be at least 6 characters', 400);

  const db = getDb();
  const existing = await db('users').where('email', email.toLowerCase()).first();
  if (existing) throw createError('Email already in use', 409, 'EMAIL_EXISTS');

  const id = uuidv4();
  const password_hash = await bcrypt.hash(password, 12);

  await db('users').insert({ id, email: email.toLowerCase(), password_hash, name, verified: 1 });

  const projectId = uuidv4();
  await db('projects').insert({ id: projectId, user_id: id, name: 'My Workspace', description: 'Default workspace' });

  const accessToken = generateAccessToken({ userId: id, email, role: 'user' });
  const refreshToken = generateRefreshToken();

  await db('refresh_tokens').insert({
    id: uuidv4(), user_id: id, token: refreshToken, expires_at: getTokenExpiry(60 * 24 * 7),
  });

  await db('notifications').insert({
    id: uuidv4(), user_id: id, type: 'success',
    title: '🎉 Welcome to FlowForge AI!',
    message: 'Start building your first workflow from the Templates page.',
  });

  res.status(201).json({
    success: true,
    data: { user: { id, name, email, role: 'user', verified: true }, accessToken, refreshToken },
  });
}));

// ─── POST /api/auth/login ─────────────────────────────────
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) throw createError('Email and password are required', 400);

  const db = getDb();
  const user = await db('users').where('email', email.toLowerCase()).first();
  if (!user) throw createError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  if (!user.password_hash) throw createError('Use OAuth to sign in', 400, 'OAUTH_ACCOUNT');

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw createError('Invalid credentials', 401, 'INVALID_CREDENTIALS');

  const accessToken = generateAccessToken({ userId: user.id, email: user.email, role: user.role });
  const refreshToken = generateRefreshToken();

  await db('refresh_tokens').where('user_id', user.id).whereRaw("expires_at < datetime('now')").delete();
  await db('refresh_tokens').insert({
    id: uuidv4(), user_id: user.id, token: refreshToken, expires_at: getTokenExpiry(60 * 24 * 7),
  });

  res.json({
    success: true,
    data: {
      user: { id: user.id, name: user.name, email: user.email, role: user.role, verified: user.verified, avatar: user.avatar },
      accessToken,
      refreshToken,
    },
  });
}));

// ─── POST /api/auth/refresh ───────────────────────────────
router.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw createError('Refresh token required', 400);

  const db = getDb();
  const tokenRecord = await db('refresh_tokens as rt')
    .join('users as u', 'u.id', 'rt.user_id')
    .where('rt.token', refreshToken)
    .whereRaw("rt.expires_at > datetime('now')")
    .select('rt.*', 'u.email', 'u.role')
    .first();

  if (!tokenRecord) throw createError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN');

  const accessToken = generateAccessToken({ userId: tokenRecord.user_id, email: tokenRecord.email, role: tokenRecord.role });
  res.json({ success: true, data: { accessToken } });
}));

// ─── POST /api/auth/logout ────────────────────────────────
router.post('/logout', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { refreshToken } = req.body;
  if (refreshToken) await getDb()('refresh_tokens').where('token', refreshToken).delete();
  res.json({ success: true, message: 'Logged out successfully' });
}));

// ─── GET /api/auth/me ─────────────────────────────────────
router.get('/me', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await getDb()('users')
    .select('id', 'name', 'email', 'role', 'avatar', 'verified', 'created_at')
    .where('id', req.user!.userId)
    .first();

  if (!user) throw createError('User not found', 404);
  res.json({ success: true, data: { user } });
}));

// ─── PUT /api/auth/profile ────────────────────────────────
router.put('/profile', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, avatar } = req.body;
  await getDb()('users').where('id', req.user!.userId).update({ name, avatar });
  const user = await getDb()('users').select('id', 'name', 'email', 'role', 'avatar', 'verified').where('id', req.user!.userId).first();
  res.json({ success: true, data: { user } });
}));

// ─── PUT /api/auth/change-password ───────────────────────
router.put('/change-password', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) throw createError('Both passwords required', 400);
  if (newPassword.length < 6) throw createError('New password must be at least 6 chars', 400);

  const user = await getDb()('users').where('id', req.user!.userId).first();
  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) throw createError('Current password is incorrect', 401);

  const hash = await bcrypt.hash(newPassword, 12);
  await getDb()('users').where('id', req.user!.userId).update({ password_hash: hash });
  res.json({ success: true, message: 'Password updated successfully' });
}));

export default router;
