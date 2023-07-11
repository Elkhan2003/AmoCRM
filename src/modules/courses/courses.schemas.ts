import { z } from 'zod';
import {
  course,
  courseProgress,
  lectureProgress,
  submission,
  week,
  weekProgress,
} from '../../utils/schemas';
import { generateSchema } from '@anatine/zod-openapi';
import { FastifySchema } from 'fastify';

const getCoursesPublic = {
  response: z.object({
    success: z.literal(true),
    count: z.number(),
    data: z.object({
      courses: z.array(
        z.object({
          id: z.number(),
          title: z.string(),
          cover: z.string().nullable(),
          slug: z.string().nullable(),
          weeks: z.array(
            z.object({
              id: z.number(),
              title: z.string(),
              slug: z.string().nullable(),
              lectures: z.array(
                z.object({
                  id: z.number(),
                  title: z.string(),
                  cover: z.string().nullable(),
                  slug: z.string().nullable(),
                  exercises: z.array(
                    z.object({
                      id: z.number(),
                    }),
                  ),
                }),
              ),
            }),
          ),
        }),
      ),
    }),
  }),
};

const getCoursesPublicSchema: FastifySchema = {
  response: {
    200: generateSchema(getCoursesPublic.response),
  },
};

const getCourses = {
  queryString: z.object({
    isPublished: z.boolean().optional(),
    isActive: z.boolean().optional(),
  }),
  response: z.object({
    success: z.literal(true),
    count: z.number(),
    data: z.object({
      courses: z.array(
        course.extend({
          weeks: z.array(
            z.object({
              id: z.number(),
            }),
          ),
        }),
      ),
    }),
  }),
};

const getCoursesSchema: FastifySchema = {
  querystring: generateSchema(getCourses.queryString),
  response: {
    200: generateSchema(getCourses.response),
  },
};

const getCoursePublic = {
  params: z.any(),
  response: z.object({
    success: z.literal(true),
    data: z.object({
      course: z.object({
        id: z.number(),
        title: z.string(),
        cover: z.string().nullable(),
        slug: z.string().nullable(),
        weeks: z.array(
          z.object({
            id: z.number(),
            title: z.string(),
            slug: z.string().nullable(),
            lectures: z.array(
              z.object({
                id: z.number(),
                title: z.string(),
                cover: z.string().nullable(),
                slug: z.string().nullable(),
                exercises: z.array(
                  z.object({
                    id: z.number(),
                  }),
                ),
              }),
            ),
          }),
        ),
      }),
    }),
  }),
};

const getCoursePublicSchema: FastifySchema = {
  params: generateSchema(getCoursePublic.params),
  response: {
    200: generateSchema(getCoursePublic.response),
  },
};

const getCourse = {
  queryString: z.object({
    isPublished: z.boolean().optional(),
    isActive: z.boolean().optional(),
    weeks: z
      .object({
        isPublished: z.boolean().optional(),
      })
      .optional(),
    lectures: z
      .object({
        isPublished: z.boolean().optional(),
      })
      .optional(),
    exercises: z
      .object({
        isPublished: z.boolean().optional(),
      })
      .optional(),
  }),
  params: z.any(),
  response: z.object({
    success: z.literal(true),
    data: z.object({
      course: course.extend({
        weeks: z.array(
          week.extend({
            lectures: z.array(
              z.object({
                id: z.number(),
                title: z.string(),
                isFree: z.boolean(),
                isPublished: z.boolean(),
                cover: z.string().nullable(),
                slug: z.string().nullable(),
                exercises: z.array(
                  z.object({
                    id: z.number(),
                    title: z.string(),
                    level: z.string(),
                    isPublished: z.boolean(),
                    submissions: z.array(submission),
                    slug: z.string().nullable(),
                    mandatory: z.boolean(),
                  }),
                ),
                progress: z.array(lectureProgress),
              }),
            ),
            progress: z.array(weekProgress),
            numOfExercises: z.number(),
          }),
        ),
        progress: z.array(courseProgress),
      }),
    }),
  }),
};

const getCourseSchema: FastifySchema = {
  querystring: generateSchema(getCourse.queryString),
  params: generateSchema(getCourse.params),
  response: {
    200: generateSchema(getCourse.response),
  },
};

const createCourse = {
  body: z.object({
    title: z.string(),
  }),
  response: z.object({
    success: z.literal(true),
    data: z.object({
      course: course,
    }),
  }),
};

const createCourseSchema: FastifySchema = {
  body: generateSchema(createCourse.body),
  response: {
    201: generateSchema(createCourse.response),
  },
};

const editCourse = {
  params: z.object({
    id: z.number(),
  }),
  body: z.object({
    title: z.string().optional(),
    isPublished: z.boolean().optional(),
    isActive: z.boolean().optional(),
    cover: z.string().optional(),
  }),
  response: z.object({
    success: z.literal(true),
    data: z.object({
      course: z.object({
        id: z.number(),
        title: z.string(),
        cover: z.string().nullable(),
        isPublished: z.boolean(),
        slug: z.string().optional(),
      }),
    }),
  }),
};

const editCourseSchema: FastifySchema = {
  params: generateSchema(editCourse.params),
  // body: generateSchema(editCourse.body),
  response: { 200: generateSchema(editCourse.response) },
};

const createWeek = {
  params: z.object({
    id: z.number(),
  }),
  body: z.object({
    title: z.string(),
  }),
  response: z.object({
    success: z.literal(true),
    data: z.object({
      week: z.object({
        id: z.number(),
        title: z.string(),
        isPublished: z.boolean(),
        order: z.number(),
        slug: z.string().nullable(),
      }),
    }),
  }),
};

const createWeekSchema = {
  params: generateSchema(createWeek.params),
  body: generateSchema(createWeek.body),
  response: {
    201: generateSchema(createWeek.response),
  },
};

export default {
  getCoursesPublic,
  getCoursesPublicSchema,

  getCourses,
  getCoursesSchema,

  getCoursePublic,
  getCoursePublicSchema,

  getCourse,
  getCourseSchema,

  createCourse,
  createCourseSchema,

  editCourse,
  editCourseSchema,

  createWeek,
  createWeekSchema,
};
