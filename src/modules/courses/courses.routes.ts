import { FastifyInstance } from 'fastify';
import coursesControllers from './courses.controllers';
import coursesSchemas from './courses.schemas';

export default async function (app: FastifyInstance) {
  app.get(
    '/public',
    {
      schema: coursesSchemas.getCoursesPublicSchema,
    },
    coursesControllers.getCoursesPublic,
  );

  app.get(
    '/:param/public',
    {
      schema: coursesSchemas.getCoursePublicSchema,
    },
    coursesControllers.getCoursePublic,
  );

  // PROTECTED ROUTES
  app.register(async function (app: FastifyInstance) {
    app.addHook('preValidation', app.auth([app.protect]));

    app.get(
      '/',
      {
        schema: coursesSchemas.getCoursesSchema,
      },
      coursesControllers.getCourses,
    );

    app.get(
      '/:param',
      {
        schema: coursesSchemas.getCourseSchema,
      },
      coursesControllers.getCourse,
    );

    app.post(
      '/',
      {
        preHandler: app.auth([app.isAdmin]) as any,
        schema: coursesSchemas.createCourseSchema,
      },
      coursesControllers.createCourse,
    );

    app.patch(
      '/:id',
      {
        preHandler: app.auth([app.isAdmin]) as any,
        schema: coursesSchemas.editCourseSchema,
      },
      coursesControllers.editCourse,
    );

    app.post(
      '/:id/weeks',
      {
        preHandler: app.auth([app.isAdmin]) as any,
        schema: coursesSchemas.createWeekSchema,
      },
      coursesControllers.createWeek,
    );
  });
}
