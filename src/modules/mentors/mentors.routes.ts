import { FastifyInstance } from 'fastify';
import mentorsControllers from './mentors.controllers';
import mentorsSchemas from './mentors.schemas';

export default async function (app: FastifyInstance) {
  app.post<any>(
    '/',
    {
      preHandler: app.auth([app.protect, app.isAdmin]) as any,
      schema: mentorsSchemas.createMentorSchema,
    },
    mentorsControllers.createMentor,
  );

  app.get<any>(
    '/',
    {
      preHandler: app.auth([app.protect, app.isAdmin]) as any,
      schema: mentorsSchemas.getMentorsSchema,
    },
    mentorsControllers.getMentors,
  );
}
