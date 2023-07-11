import { generateSchema } from '@anatine/zod-openapi';
import { FastifySchema } from 'fastify';
import { z } from 'zod';
import { notification, user } from '../../utils/schemas';

export const registerUser = {
  body: z.object({
    email: z.string().email(),
    firstName: z.string(),
    lastName: z.string(),
    password: z.string().min(5),
  }),
  response: z.object({
    success: z.boolean(),
    data: z.object({
      user,
    }),
  }),
};

const registerUserSchema: FastifySchema = {
  body: generateSchema(registerUser.body),
  response: {
    201: generateSchema(registerUser.response),
  },
};

export const login = {
  body: z.object({
    email: z.string().email(),
    password: z.string(),
  }),
  response: z.object({
    success: z.boolean(),
    data: z.object({
      user,
    }),
  }),
};

const loginSchema: FastifySchema = {
  body: generateSchema(login.body),
  response: {
    200: generateSchema(login.response),
  },
};

export const getMe = {
  response: z.object({
    success: z.boolean(),
    data: z.object({
      user,
    }),
  }),
};

const getMeSchema: FastifySchema = {
  response: {
    200: generateSchema(getMe.response),
  },
};

export const editMe = {
  body: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    photo: z.string().optional(),
    phone: z.string().optional(),
    preferences: z.object({}).optional(),
  }),
  response: z.object({
    success: z.boolean(),
    data: z.object({
      user,
    }),
  }),
};

const editMeSchema: FastifySchema = {
  body: generateSchema(editMe.body),
  response: {
    200: generateSchema(editMe.response),
  },
};

const getMyNotifications = {
  response: z.object({
    success: z.literal(true),
    count: z.number(),
    data: z.object({
      notifications: z.array(notification),
    }),
  }),
};

const getMyNotificationsSchema: FastifySchema = {
  response: {
    200: generateSchema(getMyNotifications.response),
  },
};

const readNotifications = {
  response: z.object({
    success: z.literal(true),
  }),
};

const readNotificationsSchema: FastifySchema = {
  response: {
    200: generateSchema(readNotifications.response),
  },
};

export default {
  registerUser,
  registerUserSchema,
  login,
  loginSchema,
  getMe,
  getMeSchema,
  editMe,
  editMeSchema,
  getMyNotifications,
  getMyNotificationsSchema,
  readNotifications,
  readNotificationsSchema,
};
