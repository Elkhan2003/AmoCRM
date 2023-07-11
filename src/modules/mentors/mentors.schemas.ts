import { z } from 'zod';
import { batch, mentor } from '../../utils/schemas';
import { generateSchema } from '@anatine/zod-openapi';
import { FastifySchema } from 'fastify';

const createMentor = {
  body: z.object({
    firstName: z.string(),
    lastName: z.string(),
  }),
  response: z.object({
    success: z.literal(true),
    data: z.object({
      mentor: mentor,
    }),
  }),
};

const createMentorSchema: FastifySchema = {
  body: generateSchema(createMentor.body),
  response: {
    201: generateSchema(createMentor.response),
  },
};

const getMentors = {
  queryString: z.object({
    page: z.number().optional(),
    limit: z.number().optional(),
  }),
  response: z.object({
    success: z.literal(true),
    count: z.number(),
    data: z.object({
      mentors: z.array(
        mentor.extend({
          batches: z.array(batch),
        }),
      ),
    }),
  }),
};

const getMentorsSchema: FastifySchema = {
  querystring: generateSchema(getMentors.queryString),
  response: {
    200: generateSchema(getMentors.response),
  },
};

export default {
  getMentors,
  getMentorsSchema,
  createMentor,
  createMentorSchema,
};
