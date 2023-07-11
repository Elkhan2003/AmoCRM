import { generateSchema } from '@anatine/zod-openapi';
import { FastifySchema } from 'fastify';
import { z } from 'zod';
import { notification } from '../../utils/schemas';

const getNotifications = {
  response: z.object({
    success: z.literal(true),
    count: z.number(),
    data: z.object({
      notifications: z.array(notification),
    }),
  }),
};

const getNotificationsSchema: FastifySchema = {
  response: {
    200: generateSchema(getNotifications.response),
  },
};

const createNotification = {
  body: z.object({
    content: z.string(),
  }),
  response: z.object({
    success: z.literal(true),
  }),
};

const createNotificationSchema: FastifySchema = {
  body: generateSchema(createNotification.body),
  response: {
    201: generateSchema(createNotification.response),
  },
};

export default {
  getNotifications,
  getNotificationsSchema,
  createNotification,
  createNotificationSchema,
};
