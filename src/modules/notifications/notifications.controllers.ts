import { RouteHandler } from 'fastify';
import { z } from 'zod';
import notificationsSchemas from './notifications.schemas';

const getNotifications: RouteHandler<{
  Reply: z.infer<typeof notificationsSchemas.getNotifications.response>;
}> = async (req, res) => {
  const notifications = await req.server.prisma.notification.findMany({
    where: {
      NOT: {
        sender: null,
      },
    },
    orderBy: {
      notification: {
        createdAt: 'desc',
      },
    },
    include: {
      notification: true,
    },
    distinct: ['notificationId'],
  });

  return res.code(200).send({
    success: true,
    count: notifications.length,
    data: {
      notifications,
    },
  });
};

const createNotification: RouteHandler<{
  Body: z.infer<typeof notificationsSchemas.createNotification.body>;
  Reply: z.infer<typeof notificationsSchemas.createNotification.response>;
}> = async (req, res) => {
  const user = req.user!;
  const { content } = req.body;

  await req.server.prisma.$transaction(async (prisma) => {
    const receivers = await prisma.user.findMany({
      where: {
        isActive: true,
        OR: [
          {
            role: 'USER',
          },
          {
            role: 'BETATESTER',
          },
          {
            role: 'MENTOR',
          },
        ],
      },
    });

    const notificationObject = await prisma.notificationObject.create({
      data: {
        content,
      },
    });

    await prisma.notification.createMany({
      data: receivers.map((receiver) => ({
        senderId: user.id,
        receiverId: receiver.id,
        notificationId: notificationObject.id,
      })),
    });
  });

  return res.code(201).send({
    success: true,
  });
};

export default {
  getNotifications,
  createNotification,
};
