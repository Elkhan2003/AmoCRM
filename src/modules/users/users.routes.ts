import { FastifyInstance } from 'fastify';
import usersControllers from './users.controllers';
import usersSchemas from './users.schemas';

export default async function (app: FastifyInstance) {
  // app.addHook(
  //   'preValidation',
  //   app.auth([app.protect, app.isAdmin], {
  //     relation: 'and',
  //   }),
  // );

  app.get<any>(
    '/:id',
    {
      preHandler: app.auth([app.protect, app.isAdmin], {
        relation: 'and',
      }),
      schema: usersSchemas.getUserSchema,
    },
    usersControllers.getUser,
  );

  app.get<any>(
    '/',
    {
      preHandler: app.auth([app.protect, app.isAdmin], {
        relation: 'and',
      }),
      schema: usersSchemas.getUsersSchema,
    },
    usersControllers.getUsers,
  );

  app.patch<any>(
    '/:id/plan',
    {
      preHandler: app.auth([app.protect, app.isAdmin], {
        relation: 'and',
      }),
      schema: usersSchemas.changeUserPlanSchema,
    },
    usersControllers.changeUserPlan,
  );

  app.patch<any>(
    '/:id/activate',
    {
      preHandler: app.auth([app.protect, app.isAdmin], {
        relation: 'and',
      }),
      schema: usersSchemas.activateUserSchema,
    },
    usersControllers.activateUser,
  );

  app.patch<any>(
    '/:id/deactivate',
    {
      preHandler: app.auth([app.protect, app.isAdmin], {
        relation: 'and',
      }),
      schema: usersSchemas.deactivateUserSchema,
    },
    usersControllers.deactivateUser,
  );

  app.patch<any>(
    '/:id/role',
    {
      preHandler: app.auth([app.protect, app.isAdmin], {
        relation: 'and',
      }),
      schema: usersSchemas.changeUserRoleSchema,
    },
    usersControllers.changeUserRole,
  );

  app.get<any>(
    '/:id/progress',
    {
      preHandler: app.auth([app.protect, app.isAdmin], {
        relation: 'and',
      }),
      schema: usersSchemas.getUserProgressSchema,
    },
    usersControllers.getUserProgress,
  );

  app.delete<any>(
    '/:id',
    {
      preHandler: app.auth([app.protect]),
      schema: usersSchemas.deleteUserSchema,
    },
    usersControllers.deleteUser,
  );
}
