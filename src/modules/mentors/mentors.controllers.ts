import { RouteHandler } from 'fastify';
import { z } from 'zod';
import mentorsSchemas from './mentors.schemas';

const createMentor: RouteHandler<{
  Body: z.TypeOf<typeof mentorsSchemas.createMentor.body>;
  Reply: z.TypeOf<typeof mentorsSchemas.createMentor.response>;
}> = async (req, res) => {
  const { firstName, lastName } = req.body;

  const mentor = await req.server.prisma.mentor.create({
    data: {
      firstName,
      lastName,
    },
  });

  return res.code(201).send({
    success: true,
    data: {
      mentor,
    },
  });
};

const getMentors: RouteHandler<{
  Querystring: z.infer<typeof mentorsSchemas.getMentors.queryString>;
  Reply: z.infer<typeof mentorsSchemas.getMentors.response>;
}> = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const mentors = await req.server.prisma.mentor.findMany({
    skip: limit * (page - 1),
    take: limit,
    include: {
      batches: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return res.code(200).send({
    success: true,
    count: mentors.length,
    data: {
      mentors,
    },
  });
};

export default {
  getMentors,
  createMentor,
};
