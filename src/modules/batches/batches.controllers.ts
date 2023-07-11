import { RouteHandler } from 'fastify';
import { z } from 'zod';
import batchesSchemas from './batches.schemas';
import { Prisma } from '.prisma/client';

const createBatch: RouteHandler<{
  Body: z.TypeOf<typeof batchesSchemas.createBatch.body>;
  Reply: z.TypeOf<typeof batchesSchemas.createBatch.response>;
}> = async (req, res) => {
  const {
    title,
    capacity,
    plan,
    slack,
    startDate,
    endDate,
    courseId,
    mentorId,
  } = req.body;

  let batch: any;

  if (mentorId) {
    batch = await req.server.prisma.batch.create({
      data: {
        title,
        capacity,
        plan,
        slack,
        startDate,
        endDate,
        mentor: {
          connect: {
            id: mentorId,
          },
        },
        course: {
          connect: {
            id: courseId,
          },
        },
      },
    });
  } else {
    batch = await req.server.prisma.batch.create({
      data: {
        title,
        capacity,
        plan,
        slack,
        startDate,
        endDate,
        course: {
          connect: {
            id: courseId,
          },
        },
      },
    });
  }

  return res.code(201).send({
    success: true,
    data: {
      batch,
    },
  });
};

const getBatches: RouteHandler<{
  Querystring: z.infer<typeof batchesSchemas.getBatches.queryString>;
  // Reply: z.infer<typeof batchesSchemas.getBatches.response>;
}> = async (req, res) => {
  const { page = 1, limit = 10, isActive } = req.query;

  const where: Prisma.BatchWhereInput = {
    isActive,
  };

  const batches = await req.server.prisma.batch.findMany({
    where,
    skip: limit * (page - 1),
    take: limit,
    include: {
      users: {
        include: {
          user: true,
        },
      },
      mentor: true,
      course: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return res.code(200).send({
    success: true,
    count: batches.length,
    data: {
      batches,
    },
  });
};

const editBatch: RouteHandler<{
  Params: z.TypeOf<typeof batchesSchemas.editBatch.params>;
  Body: z.TypeOf<typeof batchesSchemas.editBatch.body>;
}> = async (req, res) => {
  const { id } = req.params;
  const {
    userId,
    title,
    capacity,
    plan,
    slack,
    isActive,
    startDate,
    endDate,
    courseId,
    mentorId,
  } = req.body;

  let batch: any;

  if (userId) {
    batch = await req.server.prisma.batch.findFirst({
      where: {
        id: id,
      },
      include: {
        users: {
          select: {
            user: true,
          },
        },
      },
    });

    if (batch && batch.plan === 'PREMIUM') {
      const usersCount = batch.users.length;
      const capacity = batch.capacity;

      if (usersCount < capacity) {
        await req.server.prisma.usersOnBatches.upsert({
          where: {
            batchId_userId: {
              batchId: batch.id,
              userId: userId,
            },
          },
          create: {
            userId: userId,
            batchId: batch.id,
          },
          update: {},
        });
      } else {
        throw req.server.httpErrors.forbidden('Capacity is full');
      }
    } else if (batch && batch.plan === 'PRO') {
      await req.server.prisma.usersOnBatches.upsert({
        where: {
          batchId_userId: {
            batchId: batch.id,
            userId: userId,
          },
        },
        create: {
          userId: userId,
          batchId: batch.id,
        },
        update: {},
      });
    }
  }

  if (mentorId) {
    batch = await req.server.prisma.batch.update({
      where: {
        id,
      },
      data: {
        mentor: {
          connect: {
            id: mentorId,
          },
        },
      },
      include: {
        users: {
          include: {
            user: true,
          },
        },
        course: true,
      },
    });
  }

  if (courseId) {
    batch = await req.server.prisma.batch.update({
      where: {
        id,
      },
      data: {
        course: {
          connect: {
            id: courseId,
          },
        },
      },
      include: {
        users: true,
        course: true,
        mentor: true,
      },
    });
  }

  if (title || capacity || plan || slack || isActive || startDate || endDate) {
    batch = await req.server.prisma.batch.update({
      where: {
        id,
      },
      data: {
        title,
        capacity,
        plan,
        slack,
        isActive,
        startDate,
        endDate,
      },
      include: {
        users: true,
        course: true,
        mentor: true,
      },
    });
  }

  return res.code(200).send({
    success: true,
    data: {
      batch,
    },
  });
};

const moveUser: RouteHandler<{
  Body: z.TypeOf<typeof batchesSchemas.moveUser.body>;
}> = async (req, res) => {
  const { userId, fromBatchId, toBatchId } = req.body;

  try {
    await req.server.prisma.usersOnBatches.delete({
      where: {
        batchId_userId: {
          batchId: fromBatchId,
          userId: userId,
        },
      },
    });

    const batch = await req.server.prisma.usersOnBatches.create({
      data: {
        userId: userId,
        batchId: toBatchId,
      },
    });

    return res.code(200).send({
      success: true,
      data: {
        batch: batch,
      },
    });
  } catch (error) {
    console.log(error);
  }
};

const deleteUser: RouteHandler<{
  Params: z.TypeOf<typeof batchesSchemas.deleteUserFromBatch.params>;
  Body: z.TypeOf<typeof batchesSchemas.deleteUserFromBatch.body>;
}> = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  try {
    const batch = await req.server.prisma.usersOnBatches.delete({
      where: {
        batchId_userId: {
          batchId: id,
          userId: userId,
        },
      },
    });

    return res.code(200).send({
      success: true,
      data: {
        batch: batch,
      },
    });
  } catch (error) {
    console.log(error);
  }
};

const deleteBatch: RouteHandler<{
  Params: z.TypeOf<typeof batchesSchemas.deleteBatch.params>;
}> = async (req, res) => {
  const { id } = req.params;

  const batch = await req.server.prisma.batch.findFirst({
    where: {
      id: id,
    },
    include: {
      users: {
        select: {
          user: true,
        },
      },
    },
  });

  if (batch?.users.length)
    throw req.server.httpErrors.conflict(
      "cannot delete a batch with existing user's",
    );

  try {
    const batch = await req.server.prisma.batch.delete({
      where: {
        id: id,
      },
    });

    return res.code(200).send({
      success: true,
      data: {
        batch: batch,
      },
    });
  } catch (error) {
    console.log(error);
  }
};

export default {
  getBatches,
  createBatch,
  editBatch,
  moveUser,
  deleteBatch,
  deleteUser,
};
