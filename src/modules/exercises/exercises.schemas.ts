import { generateSchema } from '@anatine/zod-openapi';
import { FastifySchema } from 'fastify';
import { z } from 'zod';
import { exercise, submission, exerciseReview } from '../../utils/schemas';
import { ExerciseLevel, SubmissionStatus } from '.prisma/client';

const editExercise = {
  params: z.object({
    id: z.number(),
  }),
  body: z.object({
    title: z.string().optional(),
    isPublished: z.boolean().optional(),
    isActive: z.boolean().optional(),
    level: z
      .enum([ExerciseLevel.EASY, ExerciseLevel.MEDIUM, ExerciseLevel.HARD])
      .optional(),
    description: z.string().optional(),
    extras: z.array(z.object({})).optional(),
    testCases: z.array(z.object({})).optional(),
    code: z.object({}).optional(),
    mandatory: z.boolean().optional(),
  }),
  response: z.object({
    success: z.literal(true),
    data: z.object({
      exercise,
    }),
  }),
};

const editExerciseSchema: FastifySchema = {
  params: generateSchema(editExercise.params),
  body: generateSchema(editExercise.body),
  response: { 200: generateSchema(editExercise.response) },
};

const getExercise = {
  params: z.any(),
  response: z.object({
    success: z.literal(true),
    data: z.object({
      exercise: exercise.extend({
        submissions: z.array(submission),
        lecture: z.object({
          id: z.number(),
          title: z.string(),
          slug: z.string().nullable(),
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
        }),
      }),
    }),
  }),
};

const getExerciseSchema: FastifySchema = {
  params: generateSchema(getExercise.params),
  response: { 200: generateSchema(getExercise.response) },
};

const createSubmission = {
  params: z.object({
    id: z.number(),
  }),
  body: z.object({
    status: z.enum([
      SubmissionStatus.TODO,
      SubmissionStatus.ATTEMPTED,
      SubmissionStatus.SOLVED,
    ]),
    code: z.object({}),
  }),
  response: z.object({
    success: z.literal(true),
    data: z
      .object({
        submission,
      })
      .optional(),
  }),
};

const createSubmissionSchema = {
  params: generateSchema(createSubmission.params),
  body: generateSchema(createSubmission.body),
  response: {
    201: generateSchema(createSubmission.response),
  },
};

const createReview = {
  params: z.object({
    id: z.number(),
  }),
  body: z.object({
    comment: z.string(),
    rating: z.number(),
  }),
  response: z.object({
    success: z.literal(true),
    data: z.object({
      exerciseReview,
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
  response: z.object({
    success: z.literal(true),
    data: z.object({
      review: exerciseReview.nullable(),
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
  editExercise,
  editExerciseSchema,
  getExercise,
  getExerciseSchema,
  createSubmission,
  createSubmissionSchema,
  createReview,
  createReviewSchema,
  getReview,
  getReviewSchema,
};
