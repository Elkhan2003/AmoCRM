import { FastifyInstance } from 'fastify';
import otherControllers from './other.controllers';
import otherSchemas from './other.schemas';

export default async function (app: FastifyInstance) {
  app.post<any>(
    '/checkout-sessions',
    {
      preHandler: app.auth([app.protect]),
      schema: otherSchemas.createCheckoutSessionSchema,
    },
    otherControllers.createCheckoutSession,
  );

  app.post<any>(
    '/checkout-sessions/pro-monthly',
    {
      preHandler: app.auth([app.protect]),
      schema: otherSchemas.createCheckoutSessionSchema,
    },
    otherControllers.createCheckoutSessionProMonthly,
  );

  app.post<any>(
    '/checkout-sessions/pro-one-time',
    {
      preHandler: app.auth([app.protect]),
      schema: otherSchemas.createCheckoutSessionSchema,
    },
    otherControllers.createCheckoutSessionProOneTime,
  );

  app.post<any>(
    '/checkout-sessions/premium-monthly',
    {
      preHandler: app.auth([app.protect]),
      schema: otherSchemas.createCheckoutSessionSchema,
    },
    otherControllers.createCheckoutSessionPremiumMonthly,
  );

  app.post<any>(
    '/checkout-sessions/premium-one-time',
    {
      preHandler: app.auth([app.protect]),
      schema: otherSchemas.createCheckoutSessionSchema,
    },
    otherControllers.createCheckoutSessionPremiumOneTime,
  );

  app.post<any>(
    '/portal-sessions',
    {
      preHandler: app.auth([app.protect]),
      schema: otherSchemas.createPortalSessionSchema,
    },
    otherControllers.createPortalSession,
  );

  app.post(
    '/webhooks/stripe',
    {
      config: {
        rawBody: true,
      },
    },
    otherControllers.hanldeStripeWebhook,
  );

  app.post<any>(
    '/send-sms',
    {
      preHandler: app.auth([app.protect]),
      schema: otherSchemas.sendSmsCodeVerificationSchema,
    },
    otherControllers.sendSmsCodeVerify,
  );

  app.post<any>(
    '/check-sms',
    {
      preHandler: app.auth([app.protect]),
      schema: otherSchemas.checkSmsCodeVerificationSchema,
    },
    otherControllers.checkSmsCodeVerify,
  );

  app.post<any>(
    '/handleNoExercise/:id',
    {
      preHandler: app.auth([app.protect]),
      schema: otherSchemas.addLectureProgressSchema,
    },
    otherControllers.addLectureProgress,
  );
}
