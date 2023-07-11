import { RouteHandler } from 'fastify';
import { z } from 'zod';
import exercisesSchemas from './exercises.schemas';
import { Prisma } from '.prisma/client';
import axios from 'axios';

const editExercise: RouteHandler<{
  Params: z.TypeOf<typeof exercisesSchemas.editExercise.params>;
  Body: z.TypeOf<typeof exercisesSchemas.editExercise.body>;
  Reply: z.TypeOf<typeof exercisesSchemas.editExercise.response>;
}> = async (req, res) => {
  const { id } = req.params;
  const {
    isPublished,
    title,
    isActive,
    level,
    description,
    extras,
    code,
    testCases,
    mandatory,
  } = req.body;

  if (title) {
    const existingExercise = await req.server.prisma.exercise.findFirst({
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

    if (existingExercise)
      throw req.server.httpErrors.conflict(
        'Exercise with this title already exists',
      );
  }

  const data = {
    isPublished,
    title,
    isActive,
    level,
    description,
    extras,
    code,
    testCases,
    slug: title
      ? title
          .replace(/[:?#[\]@!$&'()*+%|,/;=]/g, '')
          .trim()
          .toLowerCase()
          .replace(/\s+/g, ' ')
          .replace(/\s/g, '-')
      : undefined,
    mandatory,
  };

  const exercise = await req.server.prisma.exercise.update({
    where: {
      id,
    },
    data,
  });

  return res.code(200).send({
    success: true,
    data: {
      exercise,
    },
  });
};

const getExercise: RouteHandler<{
  Params: z.TypeOf<typeof exercisesSchemas.getExercise.params>;
  Reply: z.TypeOf<typeof exercisesSchemas.getExercise.response>;
}> = async (req, res) => {
  const { param }: any = req.params;
  const id = !isNaN(param) ? parseInt(param) : undefined;
  const slug = isNaN(param) ? param : undefined;

  const user = req.user;

  const where: Prisma.ExerciseWhereInput = {
    id,
    isActive: true,
    slug,
  };

  /**
   * Do not show unpublished exercises to
   * non admins
   */

  if (
    !user ||
    user.role === 'USER' ||
    user.role === 'BETATESTER' ||
    user.role === 'MENTOR'
  ) {
    where.isPublished = true;
  }

  const exercise = await req.server.prisma.exercise.findFirst({
    where,
    include: {
      submissions: {
        where: {
          userId: user?.id,
        },
      },
      lecture: {
        select: {
          id: true,
          title: true,
          slug: true,
          week: {
            select: {
              id: true,
              title: true,
              slug: true,
              course: {
                select: {
                  id: true,
                  title: true,
                  slug: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!exercise) {
    throw req.server.httpErrors.notFound('Exercise is not found');
  }

  return res.code(200).send({
    success: true,
    data: {
      exercise,
    },
  });
};

/**
 * Create or update exercise submission
 */

const createSubmission: RouteHandler<{
  Params: z.TypeOf<typeof exercisesSchemas.createSubmission.params>;
  Body: z.TypeOf<typeof exercisesSchemas.createSubmission.body>;
  Reply: z.TypeOf<typeof exercisesSchemas.createSubmission.response>;
}> = async (req, res) => {
  const { id: exerciseId } = req.params;
  const { status, code } = req.body;
  const user = req.user!;

  /**
   * this endpoint only for users
   */
  if (user.role === 'ADMIN') {
    return res.code(200).send({
      success: true,
    });
  }

  const submission = await req.server.prisma.submission.upsert({
    where: {
      exerciseId_userId: {
        exerciseId,
        userId: user.id,
      },
    },
    create: {
      userId: user.id,
      exerciseId,
      status,
      code,
    },
    update: {
      status,
      code,
    },
  });

  /**
   * Update course progress
   *
   * Depending on the status of submission
   *
   * Add LectureProgress when user finishes all
   * exercises in that lecture
   *
   * Add WeekProgress when the user finishes all
   * lectures in that week
   *
   * Add CourseProgress when the user
   * finishes all weeks in that course
   */

  const exercise = await req.server.prisma.exercise.findUnique({
    where: {
      id: exerciseId,
    },
    include: {
      lecture: {
        include: {
          week: {
            include: {
              course: true,
            },
          },
        },
      },
    },
  });

  if (!exercise) {
    throw req.server.httpErrors.notFound('Exercise not found');
  }

  if (status === 'SOLVED') {
    const exercises = await req.server.prisma.exercise.findMany({
      where: {
        lectureId: exercise.lectureId,
        isActive: true,
        isPublished: true,
        mandatory: true,
      },
    });

    const submissionsCount = await req.server.prisma.submission.count({
      where: {
        exerciseId: {
          in: exercises.map((e) => e.id),
        },
        userId: user.id,
      },
    });

    /**
     * All exercises of a lecture are solved
     */
    if (submissionsCount >= exercises.length) {
      await req.server.prisma.lectureProgress.create({
        data: {
          userId: user.id,
          lectureId: exercise.lectureId,
        },
      });

      /**
       * Check if the week is completed
       */
      const lectures = await req.server.prisma.lecture.findMany({
        where: {
          weekId: exercise.lecture.weekId,
          isActive: true,
          isPublished: true,
        },
      });

      const completedLecturesCount =
        await req.server.prisma.lectureProgress.count({
          where: {
            lectureId: {
              in: lectures.map((l) => l.id),
            },
            userId: user.id,
          },
        });

      /**
       * All lectures of a week are completed
       */
      if (lectures.length <= completedLecturesCount) {
        await req.server.prisma.weekProgress.create({
          data: {
            userId: user.id,
            weekId: exercise.lecture.weekId,
          },
        });

        /**
         * Check if the course is completed
         */
        const weeks = await req.server.prisma.week.findMany({
          where: {
            courseId: exercise.lecture.week.courseId,
            isActive: true,
            isPublished: true,
          },
        });

        const completedWeeksCount = await req.server.prisma.weekProgress.count({
          where: {
            weekId: {
              in: weeks.map((l) => l.id),
            },
            userId: user.id,
          },
        });

        if (completedWeeksCount >= weeks.length) {
          await req.server.prisma.courseProgress.create({
            data: {
              userId: user.id,
              courseId: exercise.lecture.week.courseId,
            },
          });
        }
      }
    }
  }

  res.code(201).send({
    success: true,
    data: {
      submission,
    },
  });
};

const createReview: RouteHandler<{
  Params: z.TypeOf<typeof exercisesSchemas.createReview.params>;
  Body: z.TypeOf<typeof exercisesSchemas.createReview.body>;
  Reply: z.TypeOf<typeof exercisesSchemas.createReview.response>;
}> = async (req, res) => {
  const { id } = req.params;
  const { comment, rating } = req.body;
  const user = req.user!;

  const exercise = await req.server.prisma.exercise.findFirst({
    where: {
      id,
    },
  });

  if (!exercise) {
    throw req.server.httpErrors.notFound('exercis is not found');
  }

  const existingReview = await req.server.prisma.exerciseReview.findFirst({
    where: {
      userId: user.id,
      exerciseId: id,
    },
  });

  let review: any;
  if (!existingReview) {
    review = await req.server.prisma.exerciseReview.create({
      data: {
        userId: user.id,
        exerciseId: id,
        comment: comment,
        rating: rating,
      },
    });
  } else {
    review = await req.server.prisma.exerciseReview.update({
      where: {
        id: existingReview.id,
      },
      data: {
        comment: comment,
        rating: rating,
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
>Feedback Type - *EXERCISE* 
>User's Email - ${user.email}
>Exercise Name - *${exercise.title}*
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
      exerciseReview: review,
    },
  });
};

const getReview: RouteHandler<{
  Params: z.TypeOf<typeof exercisesSchemas.getReview.params>;
  Reply: z.TypeOf<typeof exercisesSchemas.getReview.response>;
}> = async (req, res) => {
  const { id } = req.params;
  const user = req.user!;

  const exercise = await req.server.prisma.exercise.findFirst({
    where: {
      id,
    },
  });

  if (!exercise) {
    throw req.server.httpErrors.notFound('exercise is not found');
  }

  const review = await req.server.prisma.exerciseReview.findFirst({
    where: {
      userId: user.id,
      exerciseId: id,
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
  editExercise,
  getExercise,
  createSubmission,
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
