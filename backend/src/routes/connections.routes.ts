import { Router, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { z } from 'zod';

const router = Router();
router.use(authenticate);

/**
 * GET /api/v1/connections
 * Get user's active connections
 */
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const connections = await prisma.connection.findMany({
      where: { userId },
      orderBy: { connectedAt: 'desc' }
    });

    res.json({ success: true, data: connections });
  } catch (error) {
    next(error);
  }
});

const connectSchema = z.object({
  provider: z.string().min(1),
  accountName: z.string().min(1),
});

/**
 * POST /api/v1/connections
 * Add a new connection (Simulated OAuth callback)
 */
router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const validation = connectSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ success: false, error: 'Invalid connection data' });
    }

    const { provider, accountName } = validation.data;

    // Simulated: upsert connection to avoid duplicates per provider
    const connection = await prisma.connection.upsert({
      where: {
        userId_provider: {
          userId,
          provider
        }
      },
      update: { accountName, connectedAt: new Date() },
      create: { userId, provider, accountName }
    });

    res.json({ success: true, data: connection });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/connections/:id
 * Remove a connection
 */
router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const connection = await prisma.connection.findUnique({ where: { id } });
    if (!connection || connection.userId !== userId) {
      return res.status(404).json({ success: false, error: 'Connection not found' });
    }

    await prisma.connection.delete({ where: { id } });

    res.json({ success: true, data: { message: 'Connection removed' } });
  } catch (error) {
    next(error);
  }
});

export default router;
