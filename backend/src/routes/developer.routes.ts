import { Router, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import crypto from 'crypto';
import { z } from 'zod';

const router = Router();
router.use(authenticate);

// ─── API Keys ────────────────────────────────────────────────────────

/**
 * GET /api/v1/developer/apikeys
 */
router.get('/apikeys', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const keys = await prisma.apiKey.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: keys });
  } catch (error) {
    next(error);
  }
});

const createKeySchema = z.object({
  name: z.string().min(1),
});

/**
 * POST /api/v1/developer/apikeys
 * Generate a new API key
 */
router.post('/apikeys', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const validation = createKeySchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ success: false, error: 'Invalid name' });
    }

    const { name } = validation.data;
    
    // Generate secure random key
    const rawKey = `sk_test_${crypto.randomBytes(24).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const prefix = rawKey.substring(0, 12) + '...' + rawKey.substring(rawKey.length - 4);

    const newKey = await prisma.apiKey.create({
      data: {
        userId,
        name,
        keyHash,
        prefix
      }
    });

    res.json({ 
      success: true, 
      data: {
        ...newKey,
        rawKey // Only returned once!
      } 
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/developer/apikeys/:id
 */
router.delete('/apikeys/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const key = await prisma.apiKey.findUnique({ where: { id } });
    if (!key || key.userId !== userId) {
      return res.status(404).json({ success: false, error: 'API key not found' });
    }

    await prisma.apiKey.delete({ where: { id } });
    res.json({ success: true, data: { message: 'API key deleted' } });
  } catch (error) {
    next(error);
  }
});

// ─── Webhooks ────────────────────────────────────────────────────────

/**
 * GET /api/v1/developer/webhooks
 */
router.get('/webhooks', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const webhooks = await prisma.webhook.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: webhooks });
  } catch (error) {
    next(error);
  }
});

const createWebhookSchema = z.object({
  endpoint: z.string().url(),
  events: z.array(z.string()).min(1),
});

/**
 * POST /api/v1/developer/webhooks
 */
router.post('/webhooks', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const validation = createWebhookSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ success: false, error: 'Invalid webhook data' });
    }

    const { endpoint, events } = validation.data;

    const webhook = await prisma.webhook.create({
      data: {
        userId,
        endpoint,
        events,
        isActive: true
      }
    });

    res.json({ success: true, data: webhook });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/developer/webhooks/:id
 */
router.delete('/webhooks/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const webhook = await prisma.webhook.findUnique({ where: { id } });
    if (!webhook || webhook.userId !== userId) {
      return res.status(404).json({ success: false, error: 'Webhook not found' });
    }

    await prisma.webhook.delete({ where: { id } });
    res.json({ success: true, data: { message: 'Webhook deleted' } });
  } catch (error) {
    next(error);
  }
});

export default router;
