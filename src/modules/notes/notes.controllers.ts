import { RouteHandler } from 'fastify';
import { z } from 'zod';
import notesSchemas from './notes.schemas';

const createOrUpdateNotes: RouteHandler<{
  Body: z.TypeOf<typeof notesSchemas.createOrUpdateNotes.body>;
  Reply: z.TypeOf<typeof notesSchemas.createOrUpdateNotes.response>;
}> = async (req, res) => {
  const { id: userId } = req.user!;
  const { lectureId, note } = req.body;

  const existingNotes = await req.server.prisma.notes.findFirst({
    where: {
      userId: userId,
      lectureId: lectureId,
    },
  });

  let notes;
  if (!existingNotes) {
    const newNotes = await req.server.prisma.notes.create({
      data: {
        userId: userId,
        lectureId: lectureId,
        notes: note,
      },
    });
    notes = newNotes;
  } else {
    const updatedNotes = await req.server.prisma.notes.update({
      where: {
        id: existingNotes.id,
      },
      data: {
        notes: note,
      },
    });
    notes = updatedNotes;
  }

  await res.code(200).send({
    success: true,
    data: {
      notes,
    },
  });
};

const getNotes: RouteHandler<{
  Querystring: z.TypeOf<typeof notesSchemas.getNotes.queryString>;
  Reply: z.TypeOf<typeof notesSchemas.getNotes.response>;
}> = async (req, res) => {
  const { id: userId } = req.user!;
  const { lectureId } = req.query;

  const notes = await req.server.prisma.notes.findMany({
    where: {
      userId: userId,
      lectureId: lectureId ? lectureId : undefined,
    },
  });

  await res.code(200).send({
    success: true,
    data: notes,
  });
};

export default {
  createOrUpdateNotes,
  getNotes,
};
