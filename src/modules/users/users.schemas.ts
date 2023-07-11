import { generateSchema } from '@anatine/zod-openapi';
import { z } from 'zod';
import { user } from '../../utils/schemas';
import { UserPlan } from '.prisma/client';
import { FastifySchema } from 'fastify';
import { PlanRange, UserRole } from '@prisma/client';

const getUsers = {
  queryString: z.object({
    page: z.number().optional(),
    limit: z.number().optional(),
    planType: z
      .enum([UserPlan.FREE, UserPlan.PAID, UserPlan.PRO, UserPlan.PREMIUM])
      .optional(),
    filterOn: z.string().optional(),
  }),
  response: z.object({
    success: z.literal(true),
    count: z.number(),
    data: z.object({
      users: z.array(user),
    }),
  }),
};

const getUsersSchema = {
  querystring: generateSchema(getUsers.queryString),
  response: {
    200: generateSchema(getUsers.response),
  },
};

const getUser = {
  params: z.object({
    id: z.number(),
  }),
  response: z.object({
    success: z.literal(true),
    data: z.object({
      user,
    }),
  }),
};

const getUserSchema = {
  params: generateSchema(getUser.params),
  response: {
    200: generateSchema(getUser.response),
  },
};

const deleteUserSchema = {
  params: generateSchema(getUser.params),
  response: {
    200: generateSchema(getUser.response),
  },
};

const activateUserSchema = {
  params: generateSchema(getUser.params),
  response: {
    200: generateSchema(getUser.response),
  },
};

const deactivateUserSchema = {
  params: generateSchema(getUser.params),
  response: {
    200: generateSchema(getUser.response),
  },
};

const changeUserPlan = {
  params: z.object({
    id: z.number(),
  }),
  body: z.object({
    plan: z
      .enum([UserPlan.FREE, UserPlan.PAID, UserPlan.PRO, UserPlan.PREMIUM])
      .optional(),
    planRange: z
      .enum([PlanRange.FREE, PlanRange.MONTHLY, PlanRange.ANNUALLY])
      .optional(),
  }),
  response: z.object({
    success: z.literal(true),
    data: z.object({
      user,
    }),
  }),
};

const changeUserPlanSchema: FastifySchema = {
  params: generateSchema(changeUserPlan.params),
  body: generateSchema(changeUserPlan.body),
  response: {
    200: generateSchema(changeUserPlan.response),
  },
};

const changeUserRole = {
  params: z.object({
    id: z.number(),
  }),
  body: z.object({
    role: z.enum([
      UserRole.USER,
      UserRole.ADMIN,
      UserRole.BETATESTER,
      UserRole.MENTOR,
    ]),
  }),
  response: z.object({
    success: z.literal(true),
    data: z.object({
      user,
    }),
  }),
};

const changeUserRoleSchema: FastifySchema = {
  params: generateSchema(changeUserRole.params),
  body: generateSchema(changeUserRole.body),
  response: {
    200: generateSchema(changeUserRole.response),
  },
};

const getUserProgress = {
  params: z.object({
    id: z.number(),
  }),
  response: z.object({
    success: z.literal(true),
    data: z.object({
      courses: z.array(
        z.object({
          id: z.number(),
          title: z.string(),
          isCompleted: z.boolean(),
          totalWeeksCount: z.number(),
          completedWeeksCount: z.number(),
          totalLecturesCount: z.number(),
          completedLecturesCount: z.number(),
          totalExercisesCount: z.number(),
          completedExercisesCount: z.number(),
        }),
      ),
    }),
  }),
};

const getUserProgressSchema: FastifySchema = {
  params: generateSchema(getUserProgress.params),
  response: {
    200: generateSchema(getUserProgress.response),
  },
};

export default {
  getUsers,
  getUsersSchema,
  getUser,
  getUserSchema,
  deleteUserSchema,
  activateUserSchema,
  deactivateUserSchema,
  changeUserPlan,
  changeUserPlanSchema,
  changeUserRole,
  changeUserRoleSchema,
  getUserProgress,
  getUserProgressSchema,
};
