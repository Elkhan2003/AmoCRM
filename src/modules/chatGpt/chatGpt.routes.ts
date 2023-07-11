import { FastifyInstance } from 'fastify';
import chatGptSchemas from './chatGpt.schemas';
import chatGptControllers from './chatGpt.controllers';

export default async function (app: FastifyInstance) {
  app.post<any>(
    '/ask',
    {
      preHandler: app.auth([app.protect, app.isAdmin]) as any,
      schema: chatGptSchemas.chatGptSchema,
    },
    chatGptControllers.askChatGpt,
  );
  app.get<any>(
    '/history',
    {
      preHandler: app.auth([app.protect, app.isAdmin]) as any,
      schema: chatGptSchemas.getChatGptHistorySchema,
    },
    chatGptControllers.getChatGPtHistory,
  );
  app.get<any>(
    '/requests',
    {
      preHandler: app.auth([app.protect, app.isAdmin]) as any,
      schema: chatGptSchemas.getAvailableRequestsSchema,
    },
    chatGptControllers.getAvailableRequests,
  );
  app.get<any>(
    '/parameters',
    {
      preHandler: app.auth([app.protect, app.isAdmin]) as any,
      schema: chatGptSchemas.getAiParametersSchema,
    },
    chatGptControllers.getAiParameters,
  );
  app.patch<any>(
    '/parameters',
    {
      preHandler: app.auth([app.protect, app.isAdmin]) as any,
      schema: chatGptSchemas.editAiParametersSchema,
    },
    chatGptControllers.editAiParameters,
  );
}
