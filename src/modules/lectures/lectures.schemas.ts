import { z } from 'zod';
import { exercise, lecture, review } from '../../utils/schemas';
import { FastifySchema } from 'fastify';
import { generateSchema } from '@anatine/zod-openapi';
import { SubmissionStatus, ReviewFor } from '.prisma/client';

const getLecture = {
  params: z.any(),
  response: z.object({
    success: z.literal(true),
    data: z.object({
      lecture: lecture.extend({
        week: z.object({
          id: z.number(),
          title: z.string(),
          slug: z.string().nullable(),
          course: z.object({
            id: z.number(),
            title: z.string(),
            slug: z.string().nullable(),
          }),
        }),
        exercises: z.array(
          exercise.extend({
            submissions: z.array(
              z.object({
                status: z.enum([
                  SubmissionStatus.SOLVED,
                  SubmissionStatus.ATTEMPTED,
                  SubmissionStatus.TODO,
                ]),
              }),
            ),
          }),
        ),
      }),
    }),
  }),
};

const getLectureSchema: FastifySchema = {
  params: generateSchema(getLecture.params),
  response: {
    200: generateSchema(getLecture.response),
  },
};

const editLecture = {
  params: z.object({
    id: z.number(),
  }),
  body: z.object({
    isPublished: z.boolean().optional(),
    title: z.string().optional(),
    isFree: z.boolean().optional(),
    video: z.string().optional(),
    description: z.string().optional(),
    notes: z.string().optional(),
    cover: z.string().optional(),
    weekId: z.number().optional(),
    order: z.number().optional(),
  }),
  response: z.object({
    success: z.literal(true),
    data: z.object({
      lecture,
    }),
  }),
};

const editLectureSchema: FastifySchema = {
  params: generateSchema(editLecture.params),
  body: generateSchema(editLecture.body),
  response: { 200: generateSchema(editLecture.response) },
};

const archiveLecture = {
  params: z.object({
    id: z.number(),
  }),
  response: z.object({
    success: z.literal(true),
    data: z.object({
      lecture,
    }),
  }),
};

const archiveLectureSchema: FastifySchema = {
  params: generateSchema(editLecture.params),
  response: { 200: generateSchema(editLecture.response) },
};

const createExercise = {
  params: z.object({
    id: z.number(),
  }),
  body: z.object({
    title: z.string(),
  }),
  response: z.object({
    success: z.literal(true),
    data: z.object({
      exercise,
    }),
  }),
};

const createExerciseSchema = {
  params: generateSchema(createExercise.params),
  body: generateSchema(createExercise.body),
  response: {
    201: generateSchema(createExercise.response),
  },
};

const createReview = {
  params: z.object({
    id: z.number(),
  }),
  body: z.object({
    comment: z.string(),
    rating: z.number(),
    reviewFor: z.enum([ReviewFor.VIDEO, ReviewFor.TEXT_TUTORIAL]),
  }),
  response: z.object({
    success: z.literal(true),
    data: z.object({
      review,
    }),
  }),
};

const createReviewSchema = {
  params: generateSchema(createReview.params),
  body: generateSchema(createReview.body),
  response: {
    201: generateSchema(createReview.response),
  },
};

const getReview = {
  params: z.object({
    id: z.number(),
  }),
  queryString: z.object({
    reviewFor: z.enum([ReviewFor.VIDEO, ReviewFor.TEXT_TUTORIAL]),
  }),
  response: z.object({
    success: z.literal(true),
    data: z.object({
      review: review.nullable(),
    }),
  }),
};

const getReviewSchema = {
  params: generateSchema(getReview.params),
  response: {
    200: generateSchema(getReview.response),
  },
};

export default {
  getLecture,
  getLectureSchema,
  editLecture,
  editLectureSchema,
  createExercise,
  createExerciseSchema,
  createReview,
  createReviewSchema,
  getReview,
  getReviewSchema,
  archiveLecture,
  archiveLectureSchema,
};
