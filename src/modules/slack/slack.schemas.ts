import { z } from 'zod';
import { generateSchema } from '@anatine/zod-openapi';
import { FastifySchema } from 'fastify';
import { batch } from '../../utils/schemas';
const createSlackChannel = {
  body: z.object({
    batchId: z.number(),
  }),
  response: z.object({
    success: z.literal(true),
    data: z.object({
      batch,
    }),
  }),
};

const createSlackChannelSchema: FastifySchema = {
  body: generateSchema(createSlackChannel.body),
  response: {
    201: generateSchema(createSlackChannel.response),
  },
};

const addUserToChannel = {
  body: z.object({
    batchId: z.number(),
    email: z.string(),
  }),
  response: z.object({
    success: z.literal(true),
    message: z.string(),
  }),
};

const addUserToChannelSchema: FastifySchema = {
  body: generateSchema(addUserToChannel.body),
  response: {
    200: generateSchema(addUserToChannel.response),
  },
};

const getUser = {
  queryString: z.object({
    email: z.string(),
    channelId: z.string(),
  }),
  response: z.object({
    success: z.literal(true),
    data: z.any(),
  }),
};

const getUserSchema: FastifySchema = {
  querystring: generateSchema(getUser.queryString),
  response: {
    200: generateSchema(getUser.response),
  },
};

const deleteUser = {
  queryString: z.object({
    email: z.string(),
    channelId: z.string(),
  }),
  response: z.object({
    success: z.literal(true),
    data: z.any(),
  }),
};

const deleteUserSchema: FastifySchema = {
  querystring: generateSchema(deleteUser.queryString),
  response: {
    200: generateSchema(deleteUser.response),
  },
};

export default {
  createSlackChannel,
  createSlackChannelSchema,
  addUserToChannel,
  addUserToChannelSchema,
  getUser,
  getUserSchema,
  deleteUser,
  deleteUserSchema,
};
