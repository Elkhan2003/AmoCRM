import { FastifyInstance } from 'fastify';
import batchesControllers from './batches.controllers';
import batchesSchemas from './batches.schemas';

export default async function (app: FastifyInstance) {
  app.get<any>(
    '/',
    {
      preHandler: app.auth([app.protect, app.isAdmin]) as any,
      schema: batchesSchemas.getBatchesSchema,
    },
    batchesControllers.getBatches,
  );

  app.post<any>(
    '/',
    {
      preHandler: app.auth([app.protect, app.isAdmin]) as any,
      schema: batchesSchemas.createBatchSchema,
    },
    batchesControllers.createBatch,
  );

  app.patch<any>(
    '/:id',
    {
      preHandler: app.auth([app.protect, app.isAdmin]) as any,
      schema: batchesSchemas.editBatchSchema,
    },
    batchesControllers.editBatch,
  );

  app.post<any>(
    '/moveUser',
    {
      preHandler: app.auth([app.protect, app.isAdmin]) as any,
      schema: batchesSchemas.moveUserSchema,
    },
    batchesControllers.moveUser,
  );

  app.delete<any>(
    '/user/:id',
    {
      preHandler: app.auth([app.protect, app.isAdmin]) as any,
      schema: batchesSchemas.deleteUserFromBatchSchema,
    },
    batchesControllers.deleteUser,
  );

  app.delete<any>(
    '/:id',
    {
      preHandler: app.auth([app.protect, app.isAdmin]) as any,
      schema: batchesSchemas.deleteBatchSchema,
    },
    batchesControllers.deleteBatch,
  );
}
