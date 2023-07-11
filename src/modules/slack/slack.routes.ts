import { FastifyInstance } from 'fastify';
import slackControllers from './slack.controller';
import slackSchemas from './slack.schemas';

export default async function (app: FastifyInstance) {
  app.post<any>(
    '/channel',
    {
      preHandler: app.auth([app.isAdmin, app.protect]) as any,
      schema: slackSchemas.createSlackChannelSchema,
    },
    slackControllers.createSlackChannel,
  );

  app.post<any>(
    '/user',
    {
      preHandler: app.auth([app.isAdmin, app.protect]) as any,
      schema: slackSchemas.addUserToChannelSchema,
    },
    slackControllers.addUserToChannel,
  );
  app.get<any>(
    '/user',
    {
      preHandler: app.auth([app.isAdmin, app.protect]) as any,
      schema: slackSchemas.getUserSchema,
    },
    slackControllers.getUserSlackStatus,
  );
  app.delete<any>(
    '/user',
    {
      preHandler: app.auth([app.isAdmin, app.protect]) as any,
      schema: slackSchemas.deleteUserSchema,
    },
    slackControllers.removeUserFromChannel,
  );
}
