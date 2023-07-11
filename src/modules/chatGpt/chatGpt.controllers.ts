import { RouteHandler } from 'fastify';
import { z } from 'zod';
import chatGptSchemas from './chatGpt.schemas';
import axios from 'axios';
import { Prisma } from '@prisma/client';

const askChatGpt: RouteHandler<{
  Body: z.TypeOf<typeof chatGptSchemas.chatGpt.body>;
  Reply: z.TypeOf<typeof chatGptSchemas.chatGpt.response>;
}> = async (req, res) => {
  const { message, exerciseId, userId } = req.body;

  const exercise = await req.server.prisma.exercise.findFirst({
    where: {
      id: exerciseId,
    },
  });

  if (!exercise) throw req.server.httpErrors.badRequest('No exercise Found');

  let availableRequestForExercise: number;
  switch (exercise.level) {
    case 'EASY':
      availableRequestForExercise = 1;
      break;
    case 'MEDIUM':
      availableRequestForExercise = 3;
      break;
    case 'HARD':
      availableRequestForExercise = 5;
      break;
  }

  const aiRequestResult = await req.server.prisma.aiRequest.findFirst({
    where: {
      userId: userId,
      exerciseId: exerciseId,
    },
  });

  const aiParameters = await req.server.prisma.aiParameters.findFirst({
    where: {
      id: 1,
    },
  });

  if (
    aiRequestResult &&
    availableRequestForExercise! - aiRequestResult.request < 1
  ) {
    throw req.server.httpErrors.forbidden('User Has No Available Request');
  }

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.CHATGPT_API_KEY}`,
  };

  const data = {
    model: aiParameters?.model,
    messages: message,
    temperature: aiParameters?.temperature.toNumber(),
    max_tokens: aiParameters?.maxTokens,
  };

  let chatGptResponse: any;
  try {
    chatGptResponse = await axios.post(`${process.env.AI_MODEL_URL}`, data, {
      headers,
    });
  } catch (error: any) {
    console.log(error);
    console.log(error.response.data);
    throw req.server.httpErrors.serviceUnavailable('AI error');
  }

  let aiResult;
  if (chatGptResponse.data) {
    try {
      if (!aiRequestResult) {
        aiResult = await req.server.prisma.ai.create({
          data: {
            input: message[0].content.toString(),
            output: chatGptResponse.data.choices[0].message.content
              .toString()
              .trim(),
            exerciseId: exerciseId,
            userId: userId,
            AiRequest: {
              create: {
                exerciseId: exerciseId,
                userId: userId,
                request: 1,
              },
            },
          },
          include: {
            AiRequest: true,
          },
        });
      } else {
        aiResult = await req.server.prisma.ai.create({
          data: {
            input: message[0].content.toString(),
            output: chatGptResponse.data.choices[0].message.content.toString(),
            exerciseId: exerciseId,
            userId: userId,
          },
        });

        await req.server.prisma.aiRequest.update({
          where: {
            id: aiRequestResult.id,
          },
          data: {
            request: {
              increment: 1,
            },
          },
        });
      }
    } catch (error) {
      console.log(error);
      throw req.server.httpErrors.badRequest('Internal Server Error');
    }
  }

  return await res.code(200).send({
    success: true,
    data: {
      id: aiResult?.id,
      input: aiResult?.input,
      output: aiResult?.output,
      exerciseId: aiResult?.exerciseId,
      userId: aiResult?.userId,
    },
  });
};

const getChatGPtHistory: RouteHandler<{
  Querystring: z.TypeOf<typeof chatGptSchemas.getChatGptHistory.queryString>;
  Reply: z.TypeOf<typeof chatGptSchemas.getChatGptHistory.response>;
}> = async (req, res) => {
  const { userId, exerciseId } = req.query;

  let userAiHistory, availableRequestForExercise: number;
  try {
    userAiHistory = await req.server.prisma.ai.findFirst({
      where: {
        userId: userId,
        exerciseId: exerciseId,
      },
      include: {
        AiRequest: true,
      },
    });

    const exercise = await req.server.prisma.exercise.findFirst({
      where: { id: exerciseId },
    });

    switch (exercise?.level) {
      case 'EASY':
        availableRequestForExercise = 1;
        break;
      case 'MEDIUM':
        availableRequestForExercise = 3;
        break;
      case 'HARD':
        availableRequestForExercise = 5;
        break;
    }
  } catch (error) {
    console.log(error);
    throw req.server.httpErrors.notFound('Internal Server Error');
  }

  let availableRequest: number;
  if (userAiHistory?.AiRequest.length) {
    availableRequest =
      availableRequestForExercise! - userAiHistory?.AiRequest[0].request > 0
        ? availableRequestForExercise! - userAiHistory?.AiRequest[0].request
        : 0;
  } else {
    availableRequest = availableRequestForExercise!;
  }

  return await res.code(200).send({
    success: true,
    data: {
      id: userAiHistory?.id,
      input: userAiHistory?.input,
      output: userAiHistory?.output,
      exerciseId: userAiHistory?.exerciseId,
      userId: userAiHistory?.userId,
      availableRequest: availableRequest,
    },
  });
};

const getAvailableRequests: RouteHandler<{
  Querystring: z.TypeOf<typeof chatGptSchemas.getAvailableRequests.queryString>;
  Reply: z.TypeOf<typeof chatGptSchemas.getAvailableRequests.response>;
}> = async (req, res) => {
  const { userId, exerciseId } = req.query;

  const aiRequestResult = await req.server.prisma.aiRequest.findFirst({
    where: {
      userId: userId,
      exerciseId: exerciseId,
    },
  });

  const exercise = await req.server.prisma.exercise.findFirst({
    where: { id: exerciseId },
  });

  let availableRequestForExercise: number;
  switch (exercise?.level) {
    case 'EASY':
      availableRequestForExercise = 1;
      break;
    case 'MEDIUM':
      availableRequestForExercise = 3;
      break;
    case 'HARD':
      availableRequestForExercise = 5;
      break;
  }

  let availableRequest: number;
  if (aiRequestResult) {
    availableRequest = availableRequest =
      availableRequestForExercise! - aiRequestResult?.request > 0
        ? availableRequestForExercise! - aiRequestResult.request
        : 0;
  } else {
    availableRequest = availableRequestForExercise!;
  }

  return await res.code(200).send({
    success: true,
    data: {
      availableRequest: availableRequest,
    },
  });
};

const editAiParameters: RouteHandler<{
  Body: z.TypeOf<typeof chatGptSchemas.editAiParameters.body>;
  Reply: z.TypeOf<typeof chatGptSchemas.editAiParameters.response>;
}> = async (req, res) => {
  if (
    req.body.temperature &&
    (req.body.temperature < 0 ||
      req.body.temperature > 1 ||
      (req.body.temperature * 100) % 1 !== 0)
  ) {
    throw req.server.httpErrors.badRequest(
      'temperature must be between 0 - 1.00 and can have upto two decimal places',
    );
  }

  const data: Prisma.AiParametersUpdateInput = {};

  for (const [key, value] of Object.entries(req.body)) {
    if (key === 'temperature' || key === 'maxTokens' || key === 'model') {
      data[key] = value;
    }
  }
  const updatedAiParameters = await req.server.prisma.aiParameters.update({
    where: {
      id: 1,
    },
    data,
  });

  return await res.code(200).send({
    success: true,
    data: {
      temperature: updatedAiParameters.temperature.toNumber(),
      maxTokens: updatedAiParameters.maxTokens,
      model: updatedAiParameters.model,
    },
  });
};

const getAiParameters: RouteHandler<{
  Reply: z.TypeOf<typeof chatGptSchemas.getAiParameters.response>;
}> = async (req, res) => {
  const aiParameters = await req.server.prisma.aiParameters.findFirst({
    where: {
      id: 1,
    },
  });

  return await res.code(200).send({
    success: true,
    data: {
      temperature: aiParameters?.temperature.toNumber(),
      maxTokens: aiParameters?.maxTokens,
      model: aiParameters?.model,
    },
  });
};

export default {
  askChatGpt,
  getChatGPtHistory,
  getAvailableRequests,
  editAiParameters,
  getAiParameters,
};
