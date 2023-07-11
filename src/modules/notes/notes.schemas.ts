import { z } from 'zod';
import { generateSchema } from '@anatine/zod-openapi';
import { FastifySchema } from 'fastify';
import { notes } from '../../utils/schemas';

const createOrUpdateNotes = {
  body: z.object({
    note: z.string(),
    lectureId: z.number(),
  }),
  response: z.object({
    success: z.literal(true),
    data: z.object({
      notes,
    }),
  }),
};

const createOrUpdateNotesSchema: FastifySchema = {
  body: generateSchema(createOrUpdateNotes.body),
  response: {
    201: generateSchema(createOrUpdateNotes.response),
  },
};

const getNotes = {
  queryString: z.object({
    lectureId: z.number().optional(),
  }),
  response: z.object({
    success: z.literal(true),
    data: z.array(notes),
  }),
};

const getNotesSchema: FastifySchema = {
  querystring: generateSchema(getNotes.queryString),
  response: {
    200: generateSchema(getNotes.response),
  },
};

export default {
  createOrUpdateNotesSchema,
  createOrUpdateNotes,
  getNotesSchema,
  getNotes,
};
