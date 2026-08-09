import { Router, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { z } from 'zod';

const router = Router();
router.use(authenticate);

/**
 * GET /api/v1/billing
 * Get current user's subscription and usage
 */
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    let subscription = await prisma.subscription.findUnique({ where: { userId } });

    if (!subscription) {
      subscription = await prisma.subscription.create({
        data: {
          userId,
          planType: 'Standard',
          storageUsage: 12.4, // Simulated usage
          storageLimit: 100,
        }
      });
    }

    res.json({ success: true, data: subscription });
  } catch (error) {
    next(error);
  }
});

const upgradeSchema = z.object({
  planType: z.enum(['Standard', 'Enterprise']),
});

/**
 * POST /api/v1/billing/upgrade
 * Upgrade user's plan (simulated payment)
 */
router.post('/upgrade', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const validation = upgradeSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ success: false, error: 'Invalid plan type' });
    }

    const { planType } = validation.data;
    const limit = planType === 'Enterprise' ? 500 : 100;

    const subscription = await prisma.subscription.upsert({
      where: { userId },
      create: { userId, planType, storageLimit: limit },
      update: { planType, storageLimit: limit },
    });

    res.json({ success: true, data: subscription });
  } catch (error) {
    next(error);
  }
});

export default router;
