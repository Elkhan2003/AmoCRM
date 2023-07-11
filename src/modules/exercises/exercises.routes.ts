import { FastifyInstance } from 'fastify';
import exercisesControllers from './exercises.controllers';
import exercisesSchemas from './exercises.schemas';

export default async function (app: FastifyInstance) {
  app.addHook('preValidation', app.auth([app.protect]));

  app.patch(
    '/:id',
    {
      preHandler: app.auth([app.isAdmin]) as any,
      schema: exercisesSchemas.editExerciseSchema,
    },
    exercisesControllers.editExercise,
  );

  app.get(
    '/:param',
    {
      schema: exercisesSchemas.getExerciseSchema,
    },
    exercisesControllers.getExercise,
  );

  app.post(
    '/:id/submissions',
    {
      schema: exercisesSchemas.createSubmissionSchema,
    },
    exercisesControllers.createSubmission,
  );
  app.post(
    '/:id/reviews',
    {
      schema: exercisesSchemas.createReviewSchema,
    },
    exercisesControllers.createReview,
  );

  app.get(
    '/:id/review',
    {
      schema: exercisesSchemas.getReviewSchema,
    },
    exercisesControllers.getReview,
  );
}
