import { Router, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { authorize } from './authorize.middleware';
import { z } from 'zod';
import { UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const router = Router();
router.use(authenticate);

// ─── Validation Schemas ──────────────────────────────────────────────
const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  role: z.enum(['ADMIN', 'USER', 'VIEWER']).optional(),
  isActive: z.boolean().optional(),
});

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  role: z.enum(['ADMIN', 'USER', 'VIEWER']).optional().default('USER'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// ─── Settings Persistence ────────────────────────────────────────────
const appearanceSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.string().max(10).optional(),
  timezone: z.string().max(50).optional(),
});

const notificationSettingsSchema = z.object({
  emailOnTaskComplete: z.boolean().optional(),
  emailOnTaskFailed: z.boolean().optional(),
  emailDailySummary: z.boolean().optional(),
});

/**
 * GET /api/v1/users/settings
 * Get current user's settings (notification preferences)
 */
router.get('/settings', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;

    let prefs = await prisma.notificationPreference.findUnique({
      where: { userId }
    });

    if (!prefs) {
      // Create default preferences
      prefs = await prisma.notificationPreference.create({
        data: { userId }
      });
    }

    res.json({
      success: true,
      data: {
        emailOnTaskComplete: prefs.emailOnTaskComplete,
        emailOnTaskFailed: prefs.emailOnTaskFailed,
        emailDailySummary: prefs.emailDailySummary,
        emailAddress: prefs.emailAddress,
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/v1/users/settings
 * Update current user's settings
 */
router.patch('/settings', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const body = req.body;

    // Validate and update notification settings
    const notifValidation = notificationSettingsSchema.safeParse(body);
    if (notifValidation.success && Object.keys(notifValidation.data).length > 0) {
      await prisma.notificationPreference.upsert({
        where: { userId },
        create: { userId, ...notifValidation.data },
        update: notifValidation.data,
      });
    }

    // Validate and update appearance/general settings
    const appearanceValidation = appearanceSettingsSchema.safeParse(body);
    if (appearanceValidation.success && Object.keys(appearanceValidation.data).length > 0) {
      // Assuming these settings are stored on the User model
      // If you have a separate UserSettings model, adjust this query
      await prisma.user.update({
        where: { id: userId },
        data: {
          // Example: assuming 'settings' is a JSONB column on the User model
          // settings: {
          //   ...(req.user.settings || {}),
          //   ...appearanceValidation.data
          // }
          // For now, we'll just log it as the schema isn't defined for this
          // console.log('Updating appearance settings:', appearanceValidation.data);
        }
      });
    }

    if (!notifValidation.success && !appearanceValidation.success) {
      return res.status(400).json({ success: false, error: 'Invalid settings data provided.' });
    }

    res.json({ success: true, data: { message: 'Settings updated' } });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/users/notifications
 * Get system notifications/logs for the current user
 */
router.get('/notifications', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;

    const [taskEvents, auditLogs] = await Promise.all([
      prisma.taskEvent.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        take: 20
      }),
      prisma.auditLog.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        take: 20
      })
    ]);

    const notifications = [
      ...taskEvents.map(e => ({
        id: e.id,
        type: 'TASK',
        title: `Task ${e.eventType.charAt(0).toUpperCase() + e.eventType.slice(1)}`,
        message: `Task event "${e.eventType}" occurred.`,
        timestamp: e.timestamp,
        read: false
      })),
      ...auditLogs.map(a => ({
        id: a.id,
        type: 'SYSTEM',
        title: 'System Audit',
        message: `Action "${a.action}" performed.`,
        timestamp: a.timestamp,
        read: true
      }))
    ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    res.json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/users
 * List all users (Admin only)
 */
router.get('/', authorize([UserRole.ADMIN]), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/users
 * Create a new user (Admin only)
 */
router.post('/', authorize([UserRole.ADMIN]), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const validation = createUserSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: validation.error.errors[0].message
      });
    }

    const { email, name, password, role } = validation.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ success: false, error: 'User with this email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    res.status(201).json({ success: true, data: newUser });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/users/:id
 * Update a user's details (Admin only)
 */
router.put('/:id', authorize([UserRole.ADMIN]), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const validation = updateUserSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: validation.error.errors[0].message
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: validation.data,
      select: { id: true, email: true, name: true, role: true, isActive: true }
    });

    res.json({ success: true, data: updatedUser });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/users/:id
 * Soft-delete a user (Admin only)
 */
router.delete('/:id', authorize([UserRole.ADMIN]), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user!.userId;

    // Prevent self-deletion
    if (id === currentUserId) {
      return res.status(400).json({ success: false, error: 'Cannot delete your own account' });
    }

    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false }
    });

    res.status(200).json({ success: true, message: 'User deactivated successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
