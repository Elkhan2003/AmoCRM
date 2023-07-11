import { FastifyInstance } from 'fastify';
import weeksControllers from './weeks.controllers';
import weeksSchemas from './weeks.schemas';

export default async function (app: FastifyInstance) {
  app.addHook('preValidation', app.auth([app.protect]));

  app.patch(
    '/:id/',
    {
      preHandler: app.auth([app.isAdmin]) as any,
      schema: weeksSchemas.editWeekSchema,
    },
    weeksControllers.editWeek,
  );

  app.patch(
    '/:id/archive',
    {
      preHandler: app.auth([app.isAdmin]) as any,
      schema: weeksSchemas.archiveWeekSchema,
    },
    weeksControllers.archiveWeek,
  );

  app.get(
    '/:param',
    {
      schema: weeksSchemas.getWeekSchema,
    },
    weeksControllers.getWeek,
  );

  app.post(
    '/:id/lectures',
    {
      preHandler: app.auth([app.isAdmin]) as any,
      schema: weeksSchemas.createLectureSchema,
    },
    weeksControllers.createLecture,
  );
}
