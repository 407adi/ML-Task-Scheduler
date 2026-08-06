import prisma from '../lib/prisma';
import logger from '../lib/logger';
import { emitToUser } from '../lib/socket';

export class MailService {
  /**
   * Ensure default starter emails exist for new users
   */
  private async ensureSeededEmails(userId: string) {
    try {
      const count = await prisma.mailMessage.count({
        where: {
          OR: [
            { senderId: userId },
            { thread: { participants: { some: { userId } } } }
          ]
        }
      });

      if (count === 0) {
        // Find or use system admin user
        let systemUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
        if (!systemUser) {
          systemUser = await prisma.user.findFirst();
        }
        const sysId = systemUser?.id || userId;

        const defaultMails = [
          {
            subject: '🚀 ML Scheduler Optimization Report (+54% Gain)',
            content: 'Hello Team,\n\nThe Deep Reinforcement Learning optimizer has achieved a 54% efficiency gain over baseline FCFS heuristics this month.\n\nKey Highlights:\n- Makespan reduced from 124ms to 57ms\n- Fog Node Alpha & Beta load variance stabilized at ±4.2%\n- Zero task deadlines missed across 10,000 synthetic batches.\n\nRecommended Action: Allocate additional compute quotas to GPU-accelerated cuOpt tasks.\n\nBest regards,\nNova Multi-Agent Core',
            label: 'INBOX',
            isStarred: true
          },
          {
            subject: '⚡ Fog Node Cluster Alpha: Auto-scaling Alert',
            content: 'Notice:\n\nFog Node Cluster Alpha has dynamically provisioned 2 additional virtual worker instances to absorb incoming CPU-intensive workloads.\n\nTelemetry: Load: 42% | Latency: 3.1ms | RTT: 1.8ms.\n\nNo manual intervention required.',
            label: 'INBOX',
            isStarred: false
          },
          {
            subject: '🔒 Security Advisory: Certificate Rotation Completed',
            content: 'All internal TLS/SSL certificates for microservice inter-communication (Backend, ML-Service, Redis) have been successfully rotated.\n\nStatus: Verified and Healthy.',
            label: 'INBOX',
            isStarred: false
          }
        ];

        for (const mail of defaultMails) {
          const thread = await prisma.mailThread.create({
            data: {
              subject: mail.subject,
              participants: {
                create: [
                  { userId: sysId },
                  ...(sysId !== userId ? [{ userId }] : [])
                ]
              }
            }
          });

          const msg = await prisma.mailMessage.create({
            data: {
              threadId: thread.id,
              senderId: sysId,
              subject: mail.subject,
              content: mail.content,
              label: mail.label,
              isStarred: mail.isStarred,
              isRead: false
            }
          });

          await prisma.mailRecipient.create({
            data: {
              mailId: msg.id,
              userId: userId,
              isRead: false
            }
          });
        }
      }
    } catch (err) {
      logger.warn('Could not auto-seed mail messages:', { error: String(err) });
    }
  }

  /**
   * Get inbox for a user
   */
  async getInbox(userId: string) {
    await this.ensureSeededEmails(userId);
    return prisma.mailMessage.findMany({
      where: {
        thread: {
          participants: { some: { userId } }
        },
        senderId: { not: userId },
        label: 'INBOX'
      },
      include: {
        sender: { select: { name: true, email: true } },
        attachments: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Get sent mails for a user
   */
  async getSent(userId: string) {
    return prisma.mailMessage.findMany({
      where: { 
        senderId: userId,
        label: { not: 'TRASH' }
      },
      include: {
        sender: { select: { name: true, email: true } },
        attachments: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Get drafts for a user
   */
  async getDrafts(userId: string) {
    return prisma.mailMessage.findMany({
      where: { 
        senderId: userId,
        label: 'DRAFTS'
      },
      include: {
        sender: { select: { name: true, email: true } },
        attachments: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Get starred mails for a user
   */
  async getStarred(userId: string) {
    return prisma.mailMessage.findMany({
      where: {
        OR: [
          { senderId: userId },
          { thread: { participants: { some: { userId } } } }
        ],
        isStarred: true,
        label: { not: 'TRASH' }
      },
      include: {
        sender: { select: { name: true, email: true } },
        attachments: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Get trash mails for a user
   */
  async getTrash(userId: string) {
    return prisma.mailMessage.findMany({
      where: {
        OR: [
          { senderId: userId },
          { thread: { participants: { some: { userId } } } }
        ],
        label: 'TRASH'
      },
      include: {
        sender: { select: { name: true, email: true } },
        attachments: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Send a new mail
   */
  async sendMail(senderId: string, recipients: string[], subject: string, content: string) {
    // Resolve recipient user IDs (by ID or by email)
    const validUserIds: string[] = [];
    
    for (const r of recipients) {
      const clean = r.trim();
      if (!clean) continue;
      // Check if it's already a valid user ID
      const userById = await prisma.user.findUnique({ where: { id: clean } });
      if (userById) {
        validUserIds.push(userById.id);
        continue;
      }
      // Check by email
      const userByEmail = await prisma.user.findFirst({ where: { email: clean } });
      if (userByEmail) {
        validUserIds.push(userByEmail.id);
        continue;
      }
      // Check by name
      const userByName = await prisma.user.findFirst({ where: { name: clean } });
      if (userByName) {
        validUserIds.push(userByName.id);
        continue;
      }
    }

    // If no specific existing users matched, add sender or admin so foreign keys are satisfied
    if (validUserIds.length === 0) {
      const anyUser = await prisma.user.findFirst({ where: { id: { not: senderId } } });
      if (anyUser) validUserIds.push(anyUser.id);
    }

    // 1. Create thread
    const thread = await prisma.mailThread.create({
      data: {
        subject,
        participants: {
          create: [
            { userId: senderId },
            ...validUserIds.filter(id => id !== senderId).map(id => ({ userId: id }))
          ]
        }
      }
    });

    // 2. Create message
    const message = await prisma.mailMessage.create({
      data: {
        threadId: thread.id,
        senderId,
        subject,
        content,
        label: 'SENT'
      },
      include: {
        sender: { select: { name: true, email: true } }
      }
    });

    // 3. Create recipients status
    if (validUserIds.length > 0) {
      await prisma.mailRecipient.createMany({
        data: validUserIds.map(id => ({
          mailId: message.id,
          userId: id
        }))
      });

      // Notify recipients
      validUserIds.forEach(id => {
        emitToUser(id, 'mail:received', message);
      });
    }

    return message;
  }

  /**
   * Mark as read
   */
  async markRead(userId: string, mailId: string, isRead: boolean) {
    await prisma.mailMessage.updateMany({
      where: { id: mailId },
      data: { isRead }
    });

    return prisma.mailRecipient.updateMany({
      where: { mailId, userId },
      data: {
        isRead,
        readAt: isRead ? new Date() : null
      }
    });
  }

  /**
   * Toggle star
   */
  async toggleStar(userId: string, mailId: string, isStarred: boolean) {
    return prisma.mailMessage.updateMany({
      where: { id: mailId },
      data: { isStarred }
    });
  }

  /**
   * Move to trash / archive
   */
  async updateLabel(userId: string, mailId: string, label: string) {
    return prisma.mailMessage.updateMany({
      where: { id: mailId },
      data: { label }
    });
  }

  /**
   * Delete mail
   */
  async deleteMail(userId: string, mailId: string) {
    return prisma.mailMessage.deleteMany({
      where: { id: mailId }
    });
  }
}

export const mailService = new MailService();
