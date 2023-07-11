import { z } from 'zod';
import { generateSchema } from '@anatine/zod-openapi';
import { FastifySchema } from 'fastify';

const chatGpt = {
  body: z.object({
    message: z.array(
      z.object({
        role: z.string().min(1),
        content: z.string().min(1),
      }),
    ),
    exerciseId: z.number(),
    userId: z.number(),
  }),
  response: z.object({
    success: z.literal(true),
    data: z.object({
      id: z.number().optional(),
      input: z.string().optional(),
      output: z.string().optional(),
      exerciseId: z.number().optional(),
      userId: z.number().optional(),
    }),
  }),
};

const chatGptSchema: FastifySchema = {
  body: generateSchema(chatGpt.body),
  response: {
    200: generateSchema(chatGpt.response),
  },
};

const getChatGptHistory = {
  queryString: z.object({
    userId: z.number(),
    exerciseId: z.number(),
  }),
  response: z.object({
    success: z.literal(true),
    data: z.object({
      id: z.number().optional(),
      input: z.string().optional(),
      output: z.string().optional(),
      exerciseId: z.number().optional(),
      userId: z.number().optional(),
      availableRequest: z.number().optional(),
    }),
  }),
};

const getChatGptHistorySchema: FastifySchema = {
  querystring: generateSchema(getChatGptHistory.queryString),
  response: {
    200: generateSchema(getChatGptHistory.response),
  },
};

const getAvailableRequests = {
  queryString: z.object({
    userId: z.number(),
    exerciseId: z.number(),
  }),
  response: z.object({
    success: z.literal(true),
    data: z.object({
      availableRequest: z.number(),
    }),
  }),
};

const getAvailableRequestsSchema: FastifySchema = {
  querystring: generateSchema(getAvailableRequests.queryString),
  response: {
    200: generateSchema(getAvailableRequests.response),
  },
};

const editAiParameters = {
  body: z.object({
    temperature: z.number().optional(),
    maxTokens: z.number().optional(),
    availableRequest: z.number().optional(),
    model: z.string().optional(),
  }),
  response: z.object({
    success: z.literal(true),
    data: z.object({
      temperature: z.any().optional(),
      maxTokens: z.number().optional(),
      availableRequest: z.number().optional(),
      model: z.string().optional(),
    }),
  }),
};

const editAiParametersSchema: FastifySchema = {
  body: generateSchema(editAiParameters.body),
  response: {
    200: generateSchema(editAiParameters.response),
  },
};

const getAiParameters = {
  response: z.object({
    success: z.literal(true),
    data: z.object({
      temperature: z.any(),
      maxTokens: z.number().optional(),
      availableRequest: z.number().optional(),
      model: z.string().optional(),
    }),
  }),
};

const getAiParametersSchema: FastifySchema = {
  response: {
    200: generateSchema(getAiParameters.response),
  },
};

export default {
  chatGpt,
  chatGptSchema,
  getChatGptHistory,
  getChatGptHistorySchema,
  getAvailableRequests,
  getAvailableRequestsSchema,
  editAiParameters,
  editAiParametersSchema,
  getAiParameters,
  getAiParametersSchema,
};
