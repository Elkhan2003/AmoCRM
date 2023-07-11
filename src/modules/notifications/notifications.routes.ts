import { FastifyInstance } from 'fastify';
import notificationsControllers from './notifications.controllers';
import notificationsSchemas from './notifications.schemas';

export default async function (app: FastifyInstance) {
  app.addHook('preValidation', app.auth([app.protect]));

  app.get(
    '/',
    {
      schema: notificationsSchemas.getNotificationsSchema,
    },
    notificationsControllers.getNotifications,
  );

  app.post(
    '/',
    {
      preHandler: app.auth([app.isAdmin]) as any,
      schema: notificationsSchemas.createNotificationSchema,
    },
    notificationsControllers.createNotification,
  );
}
