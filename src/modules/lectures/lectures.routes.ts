import { FastifyInstance } from 'fastify';
import lecturesControllers from './lectures.controllers';
import lecturesSchemas from './lectures.schemas';

export default async function (app: FastifyInstance) {
  app.get(
    '/:param',
    {
      schema: lecturesSchemas.getLectureSchema,
    },
    lecturesControllers.getLecture,
  );

  app.patch(
    '/:id',
    {
      preHandler: app.auth([app.isAdmin]) as any,
      schema: lecturesSchemas.editLectureSchema,
    },
    lecturesControllers.editLecture,
  );

  app.patch(
    '/:id/archive',
    {
      preHandler: app.auth([app.isAdmin]) as any,
      schema: lecturesSchemas.archiveLectureSchema,
    },
    lecturesControllers.archiveLecture,
  );

  app.post(
    '/:id/exercises',
    {
      preHandler: app.auth([app.isAdmin]) as any,
      schema: lecturesSchemas.createExerciseSchema,
    },
    lecturesControllers.createExercise,
  );

  app.post(
    '/:id/reviews',
    {
      preValidation: app.auth([app.protect]) as any,
      schema: lecturesSchemas.createReviewSchema,
    },
    lecturesControllers.createReview,
  );

  app.get(
    '/:id/review',
    {
      preValidation: app.auth([app.protect]) as any,
      schema: lecturesSchemas.getReviewSchema,
    },
    lecturesControllers.getReview,
  );
}
