/* eslint-disable @typescript-eslint/ban-ts-comment */
import { RouteHandler } from 'fastify';
import { z } from 'zod';
import usersSchemas from './users.schemas';
import { Prisma } from '.prisma/client';
import { mixPanelPeopleSet, mixPanelTrack } from '../../utils/service.mixpanel';

const getUsers: RouteHandler<{
  Querystring: z.infer<typeof usersSchemas.getUsers.queryString>;
  Reply: z.infer<typeof usersSchemas.getUsers.response>;
}> = async (req, res) => {
  const { limit = 10, page = 1, planType, filterOn } = req.query;

  const where: Prisma.UserWhereInput = {
    OR: [
      {
        role: 'USER',
        AND: filterOn
          ? [
              {
                OR: [
                  { firstName: { contains: filterOn, mode: 'insensitive' } },
                  { lastName: { contains: filterOn, mode: 'insensitive' } },
                  { email: { contains: filterOn, mode: 'insensitive' } },
                  { phone: { contains: filterOn, mode: 'insensitive' } },
                ],
              },
            ]
          : [],
      },
      {
        role: 'BETATESTER',
        AND: filterOn
          ? [
              {
                OR: [
                  { firstName: { contains: filterOn, mode: 'insensitive' } },
                  { lastName: { contains: filterOn, mode: 'insensitive' } },
                  { email: { contains: filterOn, mode: 'insensitive' } },
                  { phone: { contains: filterOn, mode: 'insensitive' } },
                ],
              },
            ]
          : [],
      },
      {
        role: 'MENTOR',
        AND: filterOn
          ? [
              {
                OR: [
                  { firstName: { contains: filterOn, mode: 'insensitive' } },
                  { lastName: { contains: filterOn, mode: 'insensitive' } },
                  { email: { contains: filterOn, mode: 'insensitive' } },
                  { phone: { contains: filterOn, mode: 'insensitive' } },
                ],
              },
            ]
          : [],
      },
    ],
    plan: planType,
  };

  const users = await req.server.prisma.user.findMany({
    where,
    skip: limit * (page - 1),
    take: limit,
  });

  const count = await req.server.prisma.user.count({
    where,
  });

  return res.code(200).send({
    success: true,
    count: count,
    data: {
      users,
    },
  });
};

const getUser: RouteHandler<{
  Params: z.infer<typeof usersSchemas.getUser.params>;
  Reply: z.infer<typeof usersSchemas.getUser.response>;
}> = async (req, res) => {
  const { id } = req.params;

  const where: Prisma.UserWhereInput = {
    OR: [
      {
        role: 'USER',
      },
      {
        role: 'BETATESTER',
      },
      {
        role: 'MENTOR',
      },
    ],
    id,
  };

  const user = await req.server.prisma.user.findFirst({
    where,
  });

  if (!user) {
    throw req.server.httpErrors.notFound('User is not found');
  }

  return res.code(200).send({
    success: true,
    data: {
      user,
    },
  });
};
//deactivate user
const deactivateUser: RouteHandler<{
  Params: z.infer<typeof usersSchemas.getUser.params>;
  Reply: z.infer<typeof usersSchemas.getUser.response>;
}> = async (req, res) => {
  const { id } = req.params;

  const user = await req.server.prisma.user.findFirst({
    where: {
      id: id,
    },
  });

  if (!user) {
    throw req.server.httpErrors.notFound('User is not found');
  }

  const deactivatedUser = await req.server.prisma.user.update({
    where: {
      id,
    },
    data: {
      isActive: false,
    },
  });

  // email for deactivating
  const emailMessage = {
    to: user.email,
    from: process.env.SENDER_EMAIL,
    template_id: process.env.DEACTIVATE_GOODBYE_TEMPLATE,
    dynamic_template_data: {
      first_name: user.firstName,
    },
  };
  try {
    //@ts-ignore
    await req.server.sendgrid.send(emailMessage);
  } catch (err: any) {
    console.log('SENDGRID ERROR');
  }

  if (user.plan == 'PREMIUM')
    emailMessage.template_id = process.env.DEACTIVATE_PREMIUM_FEEDBACK_TEMPLATE;
  else emailMessage.template_id = process.env.DEACTIVATE_FEEDBACK_TEMPLATE;

  try {
    //@ts-ignore
    await req.server.sendgrid.send(emailMessage);
  } catch (err: any) {
    console.log('SENDGRID ERROR');
  }

  emailMessage.template_id = process.env.DEACTIVATE_FEEDBACK_TEMPLATE;

  try {
    //@ts-ignore
    await req.server.sendgrid.send(emailMessage);
  } catch (err: any) {
    console.log('SENDGRID ERROR');
  }

  return res.code(200).send({
    success: true,
    data: {
      user: deactivatedUser,
    },
  });
};

//activate user
const activateUser: RouteHandler<{
  Params: z.infer<typeof usersSchemas.getUser.params>;
  Reply: z.infer<typeof usersSchemas.getUser.response>;
}> = async (req, res) => {
  const { id } = req.params;

  const user = await req.server.prisma.user.findFirst({
    where: {
      id: id,
    },
  });

  if (!user) {
    throw req.server.httpErrors.notFound('User is not found');
  }

  const activatedUser = await req.server.prisma.user.update({
    where: {
      id,
    },
    data: {
      isActive: true,
    },
  });

  return res.code(200).send({
    success: true,
    data: {
      user: activatedUser,
    },
  });
};

//delete user
const deleteUser: RouteHandler<{
  Params: z.infer<typeof usersSchemas.getUser.params>;
  Reply: z.infer<typeof usersSchemas.getUser.response>;
}> = async (req, res) => {
  const { id } = req.params;
  const requestingUser: any = req.user;
  let user: any;

  if (requestingUser.id === id || requestingUser.role === 'ADMIN') {
    user = await req.server.prisma.user.delete({
      where: {
        id: id,
      },
    });

    if (!user) {
      throw req.server.httpErrors.notFound('User is not found');
    }

    const clientIp = req.headers['x-forwarded-for'];

    await mixPanelTrack('Delete Account', {
      distinct_id: id,
      $first_name: user.firstName,
      $last_name: user.lastName,
      $email: user.email,
      'Plan Type': user.plan,
      'Delete Account Date': new Date().toUTCString(),
      ip: clientIp,
    });
  } else {
    throw req.server.httpErrors.forbidden(
      'Only admin is allowed to delete other users',
    );
  }

  return res.code(200).send({
    success: true,
    data: {
      user,
    },
  });
};

const changeUserPlan: RouteHandler<{
  Params: z.infer<typeof usersSchemas.changeUserPlan.params>;
  Body: z.infer<typeof usersSchemas.changeUserPlan.body>;
  Reply: z.infer<typeof usersSchemas.changeUserPlan.response>;
}> = async (req, res) => {
  const { id } = req.params;
  const { plan, planRange } = req.body;

  const where: Prisma.UserWhereInput = {
    OR: [
      {
        role: 'USER',
      },
      {
        role: 'BETATESTER',
      },
      {
        role: 'MENTOR',
      },
    ],
    id,
  };

  const user = await req.server.prisma.user.findFirst({
    where,
  });

  if (!user) {
    throw req.server.httpErrors.notFound('User is not found');
  }

  let updatedUser: any;
  const clientIp = req.headers['x-forwarded-for'];

  if (planRange) {
    updatedUser = await req.server.prisma.user.update({
      where: {
        id,
      },
      data: {
        planRange,
      },
    });

    await mixPanelPeopleSet(
      user.id,
      {
        'Plan Range': planRange,
      },
      {
        $ip: clientIp,
      },
    );
  }

  if (plan) {
    updatedUser = await req.server.prisma.user.update({
      where: {
        id,
      },
      data: {
        plan,
      },
    });

    await mixPanelPeopleSet(
      user.id,
      {
        'Plan type': plan,
      },
      {
        $ip: clientIp,
      },
    );

    await mixPanelTrack('Plan type updated', {
      distinct_id: user.id,
      ip: clientIp,
    });
  }

  return res.code(200).send({
    success: true,
    data: {
      user: updatedUser,
    },
  });
};

const changeUserRole: RouteHandler<{
  Params: z.infer<typeof usersSchemas.changeUserRole.params>;
  Body: z.infer<typeof usersSchemas.changeUserRole.body>;
  Reply: z.infer<typeof usersSchemas.changeUserRole.response>;
}> = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  const where: Prisma.UserWhereInput = {
    id,
  };

  const user = await req.server.prisma.user.findFirst({
    where,
  });

  if (!user) {
    throw req.server.httpErrors.notFound('User is not found');
  }

  const updatedUser = await req.server.prisma.user.update({
    where: {
      id,
    },
    data: {
      role,
    },
  });

  return res.code(200).send({
    success: true,
    data: {
      user: updatedUser,
    },
  });
};

const getUserProgress: RouteHandler<{
  Params: z.infer<typeof usersSchemas.getUserProgress.params>;
  Reply: z.infer<typeof usersSchemas.getUserProgress.response>;
}> = async (req, res) => {
  const { id } = req.params;

  const courses = await req.server.prisma.course.findMany({
    where: {
      isActive: true,
      isPublished: true,
    },
  });

  const promises = courses.map(async (course) => {
    const totalWeeksCount = await req.server.prisma.week.count({
      where: {
        isActive: true,
        isPublished: true,
        courseId: course.id,
      },
    });

    const completedWeeksCount = await req.server.prisma.weekProgress.count({
      where: {
        userId: id,
        week: {
          courseId: course.id,
        },
      },
    });

    const totalLecturesCount = await req.server.prisma.lecture.count({
      where: {
        isActive: true,
        isPublished: true,
        week: {
          courseId: course.id,
        },
      },
    });

    const completedLecturesCount =
      await req.server.prisma.lectureProgress.count({
        where: {
          userId: id,
          lecture: {
            week: {
              courseId: course.id,
            },
          },
        },
      });

    const totalExercisesCount = await req.server.prisma.exercise.count({
      where: {
        isActive: true,
        isPublished: true,
        lecture: {
          week: {
            courseId: course.id,
          },
        },
      },
    });

    const completedExercisesCount = await req.server.prisma.submission.count({
      where: {
        userId: id,
        exercise: {
          lecture: {
            week: {
              courseId: course.id,
            },
          },
        },
        status: 'SOLVED',
      },
    });

    const isCompleted =
      (await req.server.prisma.courseProgress.count({
        where: {
          userId: id,
          courseId: course.id,
        },
      })) !== 0;

    return {
      id: course.id,
      title: course.title,
      isCompleted,
      totalWeeksCount,
      completedWeeksCount,
      totalLecturesCount,
      completedLecturesCount,
      totalExercisesCount,
      completedExercisesCount,
    };
  });

  const result = await Promise.all(promises);

  return res.code(200).send({
    success: true,
    data: {
      courses: result,
    },
  });
};

export default {
  getUsers,
  getUser,
  activateUser,
  deactivateUser,
  deleteUser,
  changeUserPlan,
  changeUserRole,
  getUserProgress,
};
