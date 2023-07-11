import { RouteHandler } from 'fastify';
import { z } from 'zod';
import coursesSchemas from './courses.schemas';
import { Prisma } from '.prisma/client';

const getCourses: RouteHandler<{
  Querystring: z.infer<typeof coursesSchemas.getCourses.queryString>;
  Reply: z.infer<typeof coursesSchemas.getCourses.response>;
}> = async (req, res) => {
  const user = req.user!;
  const { isPublished, isActive } = req.query;

  const where: Prisma.CourseWhereInput = {
    isPublished,
    isActive,
  };

  /**
   * Do not show archived or unpublished courses
   * to regular users.
   */

  if (
    user.role === 'USER' ||
    user.role === 'BETATESTER' ||
    user.role === 'MENTOR'
  ) {
    where.isPublished = true;
    where.isActive = true;
  }

  const courses = await req.server.prisma.course.findMany({
    where,
    include: {
      weeks: {
        where: {
          isActive: true,
          isPublished: true,
        },
        select: {
          id: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return res.code(200).send({
    success: true,
    count: courses.length,
    data: {
      courses,
    },
  });
};

/**
 * For information about courses on the landing page
 */
const getCoursesPublic: RouteHandler<{
  Reply: z.infer<typeof coursesSchemas.getCoursesPublic.response>;
}> = async (req, res) => {
  const courses = await req.server.prisma.course.findMany({
    where: {
      isActive: true,
      isPublished: true,
    },
    select: {
      id: true,
      title: true,
      cover: true,
      slug: true,
      weeks: {
        where: {
          isActive: true,
          isPublished: true,
        },
        select: {
          id: true,
          title: true,
          slug: true,
          lectures: {
            where: {
              isActive: true,
              isPublished: true,
            },
            select: {
              id: true,
              title: true,
              cover: true,
              slug: true,
              exercises: {
                where: {
                  isActive: true,
                  isPublished: true,
                },
                select: {
                  id: true,
                },
              },
            },
            orderBy: {
              order: 'asc',
            },
          },
        },
        orderBy: {
          order: 'asc',
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return res.code(200).send({
    success: true,
    count: courses.length,
    data: {
      courses,
    },
  });
};

const getCourse: RouteHandler<{
  Querystring: z.infer<typeof coursesSchemas.getCourse.queryString>;
  Params: z.infer<typeof coursesSchemas.getCourse.params>;
  Reply: z.infer<typeof coursesSchemas.getCourse.response>;
}> = async (req, res) => {
  const { isActive, isPublished, weeks, lectures, exercises } = req.query;
  const { param }: any = req.params;
  const id = !isNaN(param) ? parseInt(param) : undefined;
  const slug = isNaN(param) ? param : undefined;

  const user = req.user!;

  const where: Prisma.CourseWhereInput = {
    id,
    isActive,
    isPublished,
    slug,
  };

  /**
   * Do not show archived or unpublished courses
   * to regular users.
   */

  if (
    user.role === 'USER' ||
    user.role === 'BETATESTER' ||
    user.role === 'MENTOR'
  ) {
    where.isActive = true;
    where.isPublished = true;
  }

  const weeksWhere: Prisma.WeekWhereInput = {
    isActive: true,
    isPublished: weeks?.isPublished,
  };

  /**
   * Do not show unpublished weeks
   * to regular users.
   */

  if (
    user.role === 'USER' ||
    user.role === 'BETATESTER' ||
    user.role === 'MENTOR'
  ) {
    weeksWhere.isPublished = true;
  }

  const lecturesWhere: Prisma.LectureWhereInput = {
    isActive: true,
    isPublished: lectures?.isPublished,
  };

  /**
   * Do not show unpublished lectures
   * to regular users.
   */

  if (
    user.role === 'USER' ||
    user.role === 'BETATESTER' ||
    user.role === 'MENTOR'
  ) {
    lecturesWhere.isPublished = true;
  }

  const exercisesWhere: Prisma.ExerciseWhereInput = {
    isActive: true,
    isPublished: exercises?.isPublished,
  };

  /**
   * Do not show unpublished exercises
   * to regular users.
   */

  if (
    user.role === 'USER' ||
    user.role === 'BETATESTER' ||
    user.role === 'MENTOR'
  ) {
    exercisesWhere.isPublished = true;
  }

  const course = await req.server.prisma.course.findFirst({
    where,
    include: {
      weeks: {
        where: weeksWhere,
        include: {
          lectures: {
            where: lecturesWhere,
            select: {
              id: true,
              title: true,
              isFree: true,
              isPublished: true,
              cover: true,
              slug: true,
              exercises: {
                where: exercisesWhere,
                select: {
                  id: true,
                  title: true,
                  level: true,
                  isPublished: true,
                  slug: true,
                  mandatory: true,
                  submissions: {
                    where: {
                      userId: user.id,
                    },
                  },
                },
                orderBy: {
                  createdAt: 'asc',
                },
              },
              progress: {
                where: {
                  userId: user.id,
                },
              },
            },
            orderBy: {
              order: 'asc',
            },
          },
          progress: {
            where: {
              userId: user.id,
            },
          },
        },
        orderBy: {
          order: 'asc',
        },
      },
      progress: {
        where: {
          userId: user.id,
        },
      },
    },
  });

  if (!course) {
    throw req.server.httpErrors.notFound('Course is not found');
  }

  const courseWithNumOfExercises = {
    ...course,
    weeks: course.weeks.map((week) => ({
      ...week,
      numOfExercises: week.lectures.reduce(
        (total, lecture) => total + lecture.exercises.length,
        0,
      ),
    })),
  };

  return res.code(200).send({
    success: true,
    data: {
      course: courseWithNumOfExercises,
    },
  });
};

/**
 * For information about courses on the landing page
 */

const getCoursePublic: RouteHandler<{
  Params: z.infer<typeof coursesSchemas.getCoursePublic.params>;
  Reply: z.infer<typeof coursesSchemas.getCoursePublic.response>;
}> = async (req, res) => {
  const { param }: any = req.params;
  const id = !isNaN(param) ? parseInt(param) : undefined;
  const slug = isNaN(param) ? param : undefined;

  const where = {
    id,
    isActive: true,
    isPublished: true,
    slug,
  };

  const course = await req.server.prisma.course.findFirst({
    where: where,
    select: {
      id: true,
      title: true,
      cover: true,
      slug: true,
      weeks: {
        where: {
          isActive: true,
          isPublished: true,
        },
        include: {
          lectures: {
            where: {
              isActive: true,
              isPublished: true,
            },
            select: {
              id: true,
              title: true,
              cover: true,
              slug: true,
              exercises: {
                where: {
                  isActive: true,
                  isPublished: true,
                },
                select: {
                  id: true,
                  title: true,
                  level: true,
                },
                orderBy: {
                  createdAt: 'asc',
                },
              },
            },
            orderBy: {
              order: 'asc',
            },
          },
        },
        orderBy: {
          order: 'asc',
        },
      },
    },
  });

  if (!course) {
    throw req.server.httpErrors.notFound('Course is not found');
  }

  return res.code(200).send({
    success: true,
    data: {
      course,
    },
  });
};

const createCourse: RouteHandler<{
  Body: z.TypeOf<typeof coursesSchemas.createCourse.body>;
  Reply: z.TypeOf<typeof coursesSchemas.createCourse.response>;
}> = async (req, res) => {
  const { title } = req.body;
  const slug = title
    .replace(/[:?#[\]@!$&'()*+%|/,;=]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\s/g, '-');

  const existingCourse = await req.server.prisma.course.findFirst({
    where: {
      OR: [{ title: title }, { slug: slug }],
    },
  });

  if (existingCourse)
    throw req.server.httpErrors.conflict(
      'Course with this title already exists',
    );

  const newCourse = await req.server.prisma.course.create({
    data: {
      title,
      slug,
    },
  });

  return res.code(201).send({
    success: true,
    data: {
      course: newCourse,
    },
  });
};

const editCourse: RouteHandler<{
  Params: z.TypeOf<typeof coursesSchemas.editCourse.params>;
  Body: z.TypeOf<typeof coursesSchemas.editCourse.body>;
}> = async (req, res) => {
  const { id } = req.params;
  const { isPublished, title, isActive, cover } = req.body;

  if (title) {
    const existingCourse = await req.server.prisma.course.findFirst({
      where: {
        OR: [
          { title: title },
          {
            slug: title
              .replace(/[:?#[\]@!$&'()*+%|/,;=]/g, '')
              .trim()
              .toLowerCase()
              .replace(/\s+/g, ' ')
              .replace(/\s/g, '-'),
          },
        ],
        NOT: {
          id: id,
        },
      },
    });

    if (existingCourse)
      throw req.server.httpErrors.conflict(
        'Course with this title already exists',
      );
  }

  const data = {
    isPublished,
    title,
    isActive,
    cover,
    slug: title
      ? title
          .replace(/[:?#[\]@!$&'()*+%|/,;=]/g, '')
          .trim()
          .toLowerCase()
          .replace(/\s+/g, ' ')
          .replace(/\s/g, '-')
      : undefined,
  };

  const newCourse = await req.server.prisma.course.update({
    where: {
      id,
    },
    data: data,
  });

  return res.code(200).send({
    success: true,
    data: {
      course: newCourse,
    },
  });
};

const createWeek: RouteHandler<{
  Params: z.TypeOf<typeof coursesSchemas.createWeek.params>;
  Body: z.TypeOf<typeof coursesSchemas.createWeek.body>;
  Reply: z.TypeOf<typeof coursesSchemas.createWeek.response>;
}> = async (req, res) => {
  const { id: courseId } = req.params;
  const { title } = req.body;
  const slug = title
    .replace(/[:?#[\]@!$&'()*+%|/,;=]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\s/g, '-');

  const existingWeek = await req.server.prisma.week.findFirst({
    where: {
      OR: [{ title: title }, { slug: slug }],
    },
  });

  if (existingWeek)
    throw req.server.httpErrors.conflict('Week with this title already exists');

  const weeksCount = await req.server.prisma.week.count({
    where: {
      courseId,
      isActive: true,
    },
  });

  const week = await req.server.prisma.week.create({
    data: {
      title,
      courseId,
      slug,
      // order field is index basically
      order: weeksCount,
    },
  });

  res.code(201).send({
    success: true,
    data: {
      week,
    },
  });
};

export default {
  getCoursesPublic,
  getCoursePublic,
  getCourses,
  getCourse,
  createCourse,
  editCourse,
  createWeek,
};
