import { RouteHandler } from 'fastify';
import { z } from 'zod';
import weeksSchemas from './weeks.schemas';
import { Prisma } from '.prisma/client';

const editWeek: RouteHandler<{
  Params: z.TypeOf<typeof weeksSchemas.editWeek.params>;
  Body: z.TypeOf<typeof weeksSchemas.editWeek.body>;
  Reply: z.TypeOf<typeof weeksSchemas.editWeek.response>;
}> = async (req, res) => {
  const { id } = req.params;
  const { isPublished, title, order } = req.body;

  if (title) {
    const existingWeek = await req.server.prisma.week.findFirst({
      where: {
        OR: [
          { title: title },
          {
            slug: title
              .replace(/[:?#[\]@!$&'()*+%|,/;=]/g, '')
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

    if (existingWeek)
      throw req.server.httpErrors.conflict(
        'Week with this title already exists',
      );
  }

  const data = {
    isPublished,
    title,
    order,
    slug: title
      ? title
          .replace(/[:?#[\]@!$&'()*+%|,/;=]/g, '')
          .trim()
          .toLowerCase()
          .replace(/\s+/g, ' ')
          .replace(/\s/g, '-')
      : undefined,
  };

  const week = await req.server.prisma.week.update({
    where: {
      id,
    },
    data,
  });

  return res.code(200).send({
    success: true,
    data: {
      week,
    },
  });
};

const getWeek: RouteHandler<{
  Querystring: z.TypeOf<typeof weeksSchemas.getWeek.queryString>;
  Params: z.TypeOf<typeof weeksSchemas.getWeek.params>;
  Reply: z.TypeOf<typeof weeksSchemas.getWeek.response>;
}> = async (req, res) => {
  const { isActive, isPublished, lectures } = req.query;
  const { param }: any = req.params;
  const id = !isNaN(param) ? parseInt(param) : undefined;
  const slug = isNaN(param) ? param : undefined;

  const user = req.user!;

  const where: Prisma.WeekWhereInput = {
    id,
    isActive,
    isPublished,
    slug,
  };

  /**
   * Do not show archived or unpublished weeks
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

  const lecturesWhere: Prisma.LectureWhereInput = {
    isActive: true,
  };

  /**
   * Do not show unpublished lectures to
   * regular users.
   */

  if (
    user.role === 'USER' ||
    user.role === 'BETATESTER' ||
    user.role === 'MENTOR'
  ) {
    lecturesWhere.isPublished = true;
    lecturesWhere.isActive = true;
  }

  let reviews = {
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  };

  if (!(user.role === 'ADMIN' && lectures?.reviews)) {
    (reviews as any) = false;
  }

  const week = await req.server.prisma.week.findFirst({
    where,
    include: {
      course: {
        select: {
          title: true,
        },
      },
      lectures: {
        where: lecturesWhere,
        select: {
          id: true,
          title: true,
          isFree: true,
          isPublished: true,
          order: true,
          exercises: {
            where: {
              isActive: true,
              isPublished: true,
            },
            select: {
              id: true,
            },
          },
          reviews,
        },
        orderBy: {
          order: 'asc',
        },
      },
    },
    orderBy: {
      order: 'asc',
    },
  });

  if (!week) {
    throw req.server.httpErrors.notFound('Week is not found');
  }

  return res.code(200).send({
    success: true,
    data: {
      week: week,
    },
  });
};

const createLecture: RouteHandler<{
  Params: z.TypeOf<typeof weeksSchemas.createLecture.params>;
  Body: z.TypeOf<typeof weeksSchemas.createLecture.body>;
  Reply: z.TypeOf<typeof weeksSchemas.createLecture.response>;
}> = async (req, res) => {
  const { id: weekId } = req.params;
  const { title } = req.body;
  const slug = title
    .replace(/[:?#[\]@!$&'()*+%|,/;=]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\s/g, '-');

  const existingLecture = await req.server.prisma.lecture.findFirst({
    where: {
      OR: [
        { title: title },
        {
          slug: slug,
        },
      ],
    },
  });

  if (existingLecture)
    throw req.server.httpErrors.conflict(
      'Lecture with this title already exists',
    );

  const lecturesCount = await req.server.prisma.lecture.count({
    where: {
      weekId,
      isActive: true,
    },
  });

  const lecture = await req.server.prisma.lecture.create({
    data: {
      title,
      weekId,
      video: '',
      description: '',
      notes: '',
      // order field is index basically
      order: lecturesCount,
      slug,
    },
  });

  res.code(201).send({
    success: true,
    data: {
      lecture,
    },
  });
};

const archiveWeek: RouteHandler<{
  Params: z.TypeOf<typeof weeksSchemas.archiveWeek.params>;
  Reply: z.TypeOf<typeof weeksSchemas.archiveWeek.response>;
}> = async (req, res) => {
  const { id: weekId } = req.params;

  const week = await req.server.prisma.week.findFirst({
    where: {
      id: weekId,
      isActive: true,
    },
  });

  if (!week) {
    throw req.server.httpErrors.notFound('Week is not found');
  }

  const archivedWeek = await req.server.prisma.week.update({
    where: {
      id: weekId,
    },
    data: {
      isActive: false,
    },
  });

  await req.server.prisma.week.updateMany({
    where: {
      courseId: week.courseId,
      order: {
        gt: week.order,
      },
    },
    data: {
      order: {
        decrement: 1,
      },
    },
  });

  return res.code(200).send({
    success: true,
    data: {
      week: archivedWeek,
    },
  });
};

export default {
  editWeek,
  getWeek,
  createLecture,
  archiveWeek,
};
