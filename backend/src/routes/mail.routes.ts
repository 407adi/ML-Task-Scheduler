import { Router, Request, Response, NextFunction } from 'express';
import { mailService } from '../services/mail.service';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate';
import { sendMailSchema, markReadSchema } from '../validators/mail.validator';
import { successResponse } from '../lib/http/response';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/v1/mail/inbox:
 *   get:
 *     summary: Get user inbox
 *     tags: [Mail]
 */
router.get('/inbox', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const mails = await mailService.getInbox(userId);
    successResponse(res, mails);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/mail/sent:
 *   get:
 *     summary: Get sent mails
 *     tags: [Mail]
 */
router.get('/sent', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const mails = await mailService.getSent(userId);
    successResponse(res, mails);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/mail/drafts:
 *   get:
 *     summary: Get user drafts
 *     tags: [Mail]
 */
router.get('/drafts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Drafts are stored client-side for now; return empty array as placeholder
    successResponse(res, []);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/mail/starred:
 *   get:
 *     summary: Get starred mails
 *     tags: [Mail]
 */
router.get('/starred', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const mails = await mailService.getStarred(userId);
    successResponse(res, mails);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/mail/trash:
 *   get:
 *     summary: Get trash mails
 *     tags: [Mail]
 */
router.get('/trash', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const mails = await mailService.getTrash(userId);
    successResponse(res, mails);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/mail/send:
 *   post:
 *     summary: Send a new mail
 *     tags: [Mail]
 */
router.post('/send', validateRequest({ body: sendMailSchema }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { recipients, subject, content } = req.body;
    const userId = (req as any).user.userId;
    const mail = await mailService.sendMail(userId, recipients, subject, content);
    successResponse(res, mail, 201);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/mail/{id}/read:
 *   patch:
 *     summary: Mark mail as read/unread
 *     tags: [Mail]
 */
router.patch('/:id/read', validateRequest({ body: markReadSchema }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { isRead } = req.body;
    const userId = (req as any).user.userId;
    await mailService.markRead(userId, req.params.id, isRead);
    successResponse(res, { message: 'Mail status updated' });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/mail/{id}/star:
 *   patch:
 *     summary: Toggle star status
 *     tags: [Mail]
 */
router.patch('/:id/star', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { isStarred } = req.body;
    const userId = (req as any).user.userId;
    await mailService.toggleStar(userId, req.params.id, !!isStarred);
    successResponse(res, { message: 'Mail star updated' });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/mail/{id}/label:
 *   patch:
 *     summary: Update mail label (e.g. TRASH, INBOX)
 *     tags: [Mail]
 */
router.patch('/:id/label', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { label } = req.body;
    const userId = (req as any).user.userId;
    await mailService.updateLabel(userId, req.params.id, label || 'INBOX');
    successResponse(res, { message: 'Mail label updated' });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/mail/{id}:
 *   delete:
 *     summary: Permanently delete mail
 *     tags: [Mail]
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    await mailService.deleteMail(userId, req.params.id);
    successResponse(res, { message: 'Mail deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
