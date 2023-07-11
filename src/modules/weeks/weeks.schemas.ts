import { generateSchema } from '@anatine/zod-openapi';
import { FastifySchema } from 'fastify';
import { z } from 'zod';
import { lecture, review, week } from '../../utils/schemas';

const editWeek = {
  params: z.object({
    id: z.number(),
  }),
  body: z.object({
    isPublished: z.boolean().optional(),
    title: z.string().optional(),
    order: z.number().optional(),
  }),
  response: z.object({
    success: z.literal(true),
    data: z.object({
      week,
    }),
  }),
};

const editWeekSchema: FastifySchema = {
  params: generateSchema(editWeek.params),
  body: generateSchema(editWeek.body),
  response: {
    200: generateSchema(editWeek.response),
  },
};

const archiveWeek = {
  params: z.object({
    id: z.number(),
  }),
  response: z.object({
    success: z.literal(true),
    data: z.object({
      week,
    }),
  }),
};

const archiveWeekSchema: FastifySchema = {
  params: generateSchema(archiveWeek.params),
  response: {
    200: generateSchema(archiveWeek.response),
  },
};

const getWeek = {
  queryString: z.object({
    isPublished: z.boolean().optional(),
    isActive: z.boolean().optional(),
    lectures: z
      .object({
        reviews: z.boolean().optional(),
      })
      .optional(),
  }),
  params: z.any(),
  response: z.object({
    success: z.literal(true),
    data: z.object({
      week: week.extend({
        course: z.object({
          title: z.string(),
        }),
        lectures: z.array(
          z.object({
            id: z.number(),
            title: z.string(),
            isFree: z.boolean(),
            isPublished: z.boolean(),
            order: z.number(),
            exercises: z.array(
              z.object({
                id: z.number(),
              }),
            ),
            reviews: z
              .array(
                review.extend({
                  user: z.object({
                    firstName: z.string(),
                    lastName: z.string(),
                  }),
                }),
              )
              .optional(),
          }),
        ),
      }),
    }),
  }),
};

const getWeekSchema: FastifySchema = {
  querystring: generateSchema(getWeek.queryString),
  params: generateSchema(getWeek.params),
  response: {
    200: generateSchema(getWeek.response),
  },
};

const createLecture = {
  params: z.object({
    id: z.number(),
  }),
  body: z.object({
    title: z.string(),
  }),
  response: z.object({
    success: z.literal(true),
    data: z.object({
      lecture,
    }),
  }),
};

const createLectureSchema = {
  params: generateSchema(createLecture.params),
  body: generateSchema(createLecture.body),
  response: {
    201: generateSchema(createLecture.response),
  },
};

export default {
  editWeek,
  editWeekSchema,
  getWeek,
  getWeekSchema,
  createLecture,
  createLectureSchema,
  archiveWeek,
  archiveWeekSchema,
};
