import { FastifyInstance } from 'fastify';
import notesControllers from './notes.controllers';
import notesSchemas from './notes.schemas';

export default async function (app: FastifyInstance) {
  app.post(
    '/',
    {
      schema: notesSchemas.createOrUpdateNotesSchema,
    },
    notesControllers.createOrUpdateNotes,
  );

  app.get(
    '/',
    {
      schema: notesSchemas.getNotesSchema,
    },
    notesControllers.getNotes,
  );
}
