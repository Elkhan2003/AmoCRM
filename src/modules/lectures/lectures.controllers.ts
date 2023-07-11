import { RouteHandler } from 'fastify';
import { z } from 'zod';
import lecturesSchemas from './lectures.schemas';
import { Prisma } from '.prisma/client';
import axios from 'axios';
import { Review } from '@prisma/client';

const getLecture: RouteHandler<{
  Params: z.TypeOf<typeof lecturesSchemas.getLecture.params>;
  Reply: z.TypeOf<typeof lecturesSchemas.getLecture.response>;
}> = async (req, res) => {
  const { param }: any = req.params;
  const id = !isNaN(param) ? parseInt(param) : undefined;
  const slug = isNaN(param) ? param : undefined;

  const user = req.user;

  const where: Prisma.LectureWhereInput = {
    id,
    isActive: true,
    slug,
  };

  const whereExercises: Prisma.ExerciseWhereInput = {
    isActive: true,
  };

  /**
   * Do not show unpublished lectures to
   * non admins
   */

  if (
    user &&
    (user.role === 'USER' ||
      user.role === 'BETATESTER' ||
      user.role === 'MENTOR')
  ) {
    where.isPublished = true;
  }

  /**
   * Do not show unpublished exercises to
   * non admins
   */

  if (
    user &&
    (user.role === 'USER' ||
      user.role === 'BETATESTER' ||
      user.role === 'MENTOR')
  ) {
    whereExercises.isPublished = true;
  }

  const lecture = await req.server.prisma.lecture.findFirst({
    where,
    include: {
      week: {
        select: {
          title: true,
          id: true,
          order: true,
          slug: true,
          course: {
            select: {
              title: true,
              id: true,
              slug: true,
            },
          },
        },
      },
      exercises: {
        where: whereExercises,
        orderBy: {
          createdAt: 'asc',
        },
        include: {
          submissions: {
            where: {
              //show only for the current user
              userId: req.user?.id,
            },
            select: {
              status: true,
            },
          },
        },
      },
    },
  });

  if (!lecture) {
    throw req.server.httpErrors.notFound('Lecture is not found');
  }

  if (user && user.role === 'USER') {
    if (!lecture.isFree && user?.plan === 'FREE') {
      throw req.server.httpErrors.notFound('User does not have a right plan');
    }
  }

  if (!user) lecture.video = '';

  if (
    user &&
    user.plan == 'FREE' &&
    lecture.isFree == false &&
    user.role !== 'ADMIN' &&
    user.role !== 'MENTOR'
  )
    lecture.video = '';

  return res.code(200).send({
    success: true,
    data: {
      lecture,
    },
  });
};

const editLecture: RouteHandler<{
  Params: z.TypeOf<typeof lecturesSchemas.editLecture.params>;
  Body: z.TypeOf<typeof lecturesSchemas.editLecture.body>;
  Reply: z.TypeOf<typeof lecturesSchemas.editLecture.response>;
}> = async (req, res) => {
  const { id } = req.params;
  const {
    isPublished,
    title,
    isFree,
    video,
    description,
    notes,
    cover,
    weekId,
    order,
  } = req.body;

  if (title) {
    const existingLecture = await req.server.prisma.lecture.findFirst({
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

    if (existingLecture)
      throw req.server.httpErrors.conflict(
        'Lecture with this title already existss',
      );
  }

  const data = {
    isPublished,
    isFree,
    title,
    video,
    description,
    notes,
    cover,
    weekId,
    order,
    slug: title
      ? title
          .replace(/[:?#[\]@!$&'()*+%|/,;=]/g, '')
          .trim()
          .toLowerCase()
          .replace(/\s+/g, ' ')
          .replace(/\s/g, '-')
      : undefined,
  };

  const lecture = await req.server.prisma.lecture.update({
    where: {
      id,
    },
    data,
  });

  return res.code(200).send({
    success: true,
    data: {
      lecture,
    },
  });
};

const archiveLecture: RouteHandler<{
  Params: z.TypeOf<typeof lecturesSchemas.archiveLecture.params>;
  Reply: z.TypeOf<typeof lecturesSchemas.archiveLecture.response>;
}> = async (req, res) => {
  const { id: lectureId } = req.params;

  const lecture = await req.server.prisma.lecture.findFirst({
    where: {
      id: lectureId,
      isActive: true,
    },
  });

  if (!lecture) {
    throw req.server.httpErrors.notFound('Lecture is not found');
  }

  const archivedLecture = await req.server.prisma.lecture.update({
    where: {
      id: lectureId,
    },
    data: {
      isActive: false,
    },
  });

  await req.server.prisma.lecture.updateMany({
    where: {
      weekId: lecture.weekId,
      order: {
        gt: lecture.order,
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
      lecture: archivedLecture,
    },
  });
};

const createExercise: RouteHandler<{
  Params: z.TypeOf<typeof lecturesSchemas.createExercise.params>;
  Body: z.TypeOf<typeof lecturesSchemas.createExercise.body>;
  Reply: z.TypeOf<typeof lecturesSchemas.createExercise.response>;
}> = async (req, res) => {
  const { id } = req.params;
  const { title } = req.body;
  const slug = title
    .replace(/[:?#[\]@!$&'()*+%|/,;=]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\s/g, '-');

  const existingExercise = await req.server.prisma.exercise.findFirst({
    where: {
      OR: [
        { title: title },
        {
          slug: slug,
        },
      ],
    },
  });

  if (existingExercise)
    throw req.server.httpErrors.conflict(
      'Exercise with this title already exist',
    );

  const exercise = await req.server.prisma.exercise.create({
    data: {
      title,
      level: 'EASY',
      lectureId: id,
      description: '',
      code: {},
      slug,
    },
  });

  res.code(201).send({
    success: true,
    data: {
      exercise,
    },
  });
};

const createReview: RouteHandler<{
  Params: z.TypeOf<typeof lecturesSchemas.createReview.params>;
  Body: z.TypeOf<typeof lecturesSchemas.createReview.body>;
  Reply: z.TypeOf<typeof lecturesSchemas.createReview.response>;
}> = async (req, res) => {
  const { id } = req.params;
  const { comment, rating, reviewFor } = req.body;
  const user = req.user!;

  const lecture = await req.server.prisma.lecture.findFirst({
    where: {
      id,
      isActive: true,
      isPublished: true,
    },
  });

  if (!lecture) {
    throw req.server.httpErrors.notFound('Lecture is not found');
  }

  const existingReview = await req.server.prisma.review.findFirst({
    where: {
      userId: user.id,
      lectureId: id,
      for: reviewFor,
    },
  });

  let review: Review;
  if (!existingReview) {
    review = await req.server.prisma.review.create({
      data: {
        userId: user.id,
        for: reviewFor,
        lectureId: id,
        comment: comment,
        rating: rating,
      },
    });
  } else {
    review = await req.server.prisma.review.update({
      where: {
        id: existingReview.id,
      },
      data: {
        comment: comment,
        rating: rating,
        for: reviewFor,
      },
    });
  }

  const priority =
    rating > 0 && rating <= 3
      ? 'HIGHEST'
      : rating == 4
      ? 'MEDIUM'
      : rating == 5
      ? 'LOWEST'
      : undefined;

  const slackMessage = `🚨 PRIORITY - *${priority}* 🚨 
>Date - *${new Date().toDateString()}*
>Feedback Type - *${reviewFor}* 
>User's Email - ${user.email}
>Lecture Name - *${lecture.title}*
>Rating - *${rating}*
>Feedback - *${comment}*`;

  // brodcast message in slack channel (feedback-platform)
  brodcastToSlack(slackMessage, [process.env.DEVX_SLACK_FEEDBACK_PLATFORM_ID!]);
  // brodcast message to mentors i.e Askar and Adina for now
  if (rating < 5) {
    brodcastToSlack(slackMessage, [
      process.env.ASKAR_SLACK_USER_ID!,
      process.env.ADINA_SLACK_USER_ID!,
    ]);
  }

  return res.code(201).send({
    success: true,
    data: {
      review,
    },
  });
};

const getReview: RouteHandler<{
  Params: z.TypeOf<typeof lecturesSchemas.getReview.params>;
  Querystring: z.TypeOf<typeof lecturesSchemas.getReview.queryString>;
  Reply: z.TypeOf<typeof lecturesSchemas.getReview.response>;
}> = async (req, res) => {
  const { id } = req.params;
  const { reviewFor } = req.query;
  const user = req.user!;

  const lecture = await req.server.prisma.lecture.findFirst({
    where: {
      id,
      isActive: true,
      isPublished: true,
    },
  });

  if (!lecture) {
    throw req.server.httpErrors.notFound('Lecture is not found');
  }

  const review = await req.server.prisma.review.findFirst({
    where: {
      lectureId: id,
      userId: user.id,
      for: reviewFor,
    },
  });

  return res.code(200).send({
    success: true,
    data: {
      review,
    },
  });
};

export default {
  editLecture,
  archiveLecture,
  getLecture,
  createExercise,
  createReview,
  getReview,
};

// #### HELPER FUNCTIONS######
// function to brodcast message if slack channel(platform-feedback)

const brodcastToSlack = async (message: string, channel: string[]) => {
  try {
    for (const channelId of channel) {
      await axios.post(
        'https://slack.com/api/chat.postMessage',
        {
          channel: channelId,
          text: message,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.DEVX_APP_SLACK_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
        },
      );
    }
  } catch (err) {
    console.log('SLACK BROADCAST ERROR:');
    console.log(err);
  }
};
