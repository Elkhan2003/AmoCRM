import { FastifyInstance } from 'fastify';
import authControllers from './auth.controllers';
import authSchemas from './auth.schemas';
import FastifyPassport from '@fastify/passport';

export default async function (app: FastifyInstance) {
  app.post(
    '/register',
    {
      schema: authSchemas.registerUserSchema,
    },
    authControllers.registerUser,
  );

  app.post<any>(
    '/login',
    {
      preValidation: FastifyPassport.authenticate('local'),
      schema: authSchemas.loginSchema,
    },
    authControllers.login,
  );

  app.post('/logOut', authControllers.logout);

  app.get<any>(
    '/me',
    {
      preHandler: app.auth([app.protect]),
      schema: authSchemas.getMeSchema,
    },
    authControllers.getMe,
  );

  app.patch<any>(
    '/me',
    {
      preHandler: app.auth([app.protect]),
      schema: authSchemas.editMeSchema,
    },
    authControllers.editMe,
  );

  app.get<any>(
    '/me/notifications',
    {
      preHandler: app.auth([app.protect]),
      schema: authSchemas.getMyNotificationsSchema,
    },
    authControllers.getMyNotifications,
  );

  app.patch(
    '/me/notifications/read',
    {
      schema: authSchemas.readNotificationsSchema,
    },
    authControllers.readNotifications,
  );
}
