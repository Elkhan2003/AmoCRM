import { generateSchema } from '@anatine/zod-openapi';
import { z } from 'zod';
import { lectureProgress } from '../../utils/schemas';

const createCheckoutSession = {
  response: z.object({
    success: z.literal(true),
    data: z.object({
      redirectUrl: z.string(),
    }),
  }),
};

const createCheckoutSessionSchema = {
  response: {
    201: generateSchema(createCheckoutSession.response),
  },
};

const createPortalSession = {
  response: z.object({
    success: z.literal(true),
    data: z.object({
      redirectUrl: z.string(),
    }),
  }),
};

const createPortalSessionSchema = {
  response: {
    201: generateSchema(createPortalSession.response),
  },
};

const sendSmsCodeVerification = {
  body: z.object({
    phone: z.string(),
  }),
  response: z.object({
    success: z.literal(true),
    data: z.any(),
  }),
};

const sendSmsCodeVerificationSchema = {
  response: {
    201: generateSchema(sendSmsCodeVerification.response),
  },
};

const checkSmsCodeVerification = {
  body: z.object({
    serviceSid: z.string(),
    phone: z.string(),
    code: z.string(),
  }),
  response: z.object({
    success: z.literal(true),
    data: z.any(),
  }),
};

const checkSmsCodeVerificationSchema = {
  response: {
    201: generateSchema(checkSmsCodeVerification.response),
  },
};

const addLectureProgress = {
  params: z.object({
    id: z.number(),
  }),
  response: z.object({
    success: z.literal(true),
    lectureProgress: lectureProgress,
  }),
};

const addLectureProgressSchema = {
  params: generateSchema(addLectureProgress.params),
  response: { 200: generateSchema(addLectureProgress.response) },
};

export default {
  createCheckoutSession,
  createCheckoutSessionSchema,
  createPortalSession,
  createPortalSessionSchema,
  checkSmsCodeVerification,
  checkSmsCodeVerificationSchema,
  sendSmsCodeVerification,
  sendSmsCodeVerificationSchema,
  addLectureProgress,
  addLectureProgressSchema,
};
