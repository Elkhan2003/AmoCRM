import { z } from 'zod';
import { batch, user, usersOnBatches, course } from '../../utils/schemas';
import { generateSchema } from '@anatine/zod-openapi';
import { FastifySchema } from 'fastify';
import { UserPlan } from '@prisma/client';

const createBatch = {
  body: z.object({
    title: z.string(),
    capacity: z.number(),
    plan: z.enum([UserPlan.PRO, UserPlan.PREMIUM]),
    slack: z.string().optional(),
    startDate: z.string(),
    endDate: z.string().optional(),
    courseId: z.number(),
    mentorId: z.number().optional(),
  }),
  response: z.object({
    success: z.literal(true),
    data: z.object({
      batch: batch,
    }),
  }),
};

const createBatchSchema: FastifySchema = {
  body: generateSchema(createBatch.body),
  response: {
    201: generateSchema(createBatch.response),
  },
};

const getBatches = {
  queryString: z.object({
    page: z.number().optional(),
    limit: z.number().optional(),
    isActive: z.boolean().optional(),
  }),
  response: z.object({
    success: z.literal(true),
    count: z.number(),
    data: z.object({
      batches: z.array(
        batch.extend({
          // mentor: mentor.optional(),
          course: course,
          users: z.array(
            usersOnBatches.extend({
              user: user,
            }),
          ),
        }),
      ),
    }),
  }),
};

const getBatchesSchema: FastifySchema = {
  querystring: generateSchema(getBatches.queryString),
  response: {
    200: generateSchema(getBatches.response),
  },
};

const editBatch = {
  params: z.object({
    id: z.number(),
  }),
  body: z.object({
    userId: z.number().optional(),
    title: z.string().optional(),
    capacity: z.number().optional(),
    plan: z.enum([UserPlan.PRO, UserPlan.PREMIUM]).optional(),
    slack: z.string().optional(),
    isActive: z.boolean().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    courseId: z.number().optional(),
    mentorId: z.number().optional(),
  }),
  response: z.object({
    success: z.literal(true),
    data: z.object({
      batch: batch,
    }),
  }),
};

const editBatchSchema: FastifySchema = {
  params: generateSchema(editBatch.params),
  body: generateSchema(editBatch.body),
  response: { 200: generateSchema(editBatch.response) },
};

const moveUser = {
  body: z.object({
    fromBatchId: z.number(),
    toBatchId: z.number(),
    userId: z.number(),
  }),

  response: z.object({
    success: z.literal(true),
    data: z.object({
      batch: usersOnBatches,
    }),
  }),
};

const moveUserSchema: FastifySchema = {
  body: generateSchema(moveUser.body),
  response: { 200: generateSchema(moveUser.response) },
};

const deleteUserFromBatch = {
  params: z.object({
    id: z.number(),
  }),
  body: z.object({
    userId: z.number(),
  }),
  response: z.object({
    success: z.literal(true),
    data: z.object({
      batch: usersOnBatches,
    }),
  }),
};

const deleteUserFromBatchSchema: FastifySchema = {
  params: generateSchema(deleteUserFromBatch.params),
  body: generateSchema(deleteUserFromBatch.body),
  response: { 200: generateSchema(deleteUserFromBatch.response) },
};

const deleteBatch = {
  params: z.object({
    id: z.number(),
  }),
  response: z.object({
    success: z.literal(true),
    data: z.object({
      batch: batch,
    }),
  }),
};

const deleteBatchSchema: FastifySchema = {
  params: generateSchema(deleteBatch.params),
  response: { 200: generateSchema(deleteBatch.response) },
};

export default {
  createBatch,
  createBatchSchema,
  getBatches,
  getBatchesSchema,
  editBatch,
  editBatchSchema,
  moveUser,
  moveUserSchema,
  deleteBatch,
  deleteBatchSchema,
  deleteUserFromBatch,
  deleteUserFromBatchSchema,
};
