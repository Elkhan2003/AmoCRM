/* eslint-disable prefer-const */
import { RouteHandler } from 'fastify';
import { z } from 'zod';
import { WebClient } from '@slack/web-api';
import slackSchemas from './slack.schemas';

const web = new WebClient(`${process.env.SLACK_BOT_TOKEN}`);

const createSlackChannel: RouteHandler<{
  Body: z.TypeOf<typeof slackSchemas.createSlackChannel.body>;
  Reply: z.TypeOf<typeof slackSchemas.createSlackChannel.response>;
}> = async (req, res) => {
  // Get Batches and its user to create channel
  const batchId = req.body.batchId!;

  const batch = await req.server.prisma.batch.findFirst({
    where: {
      id: batchId,
    },
    include: {
      users: {
        select: {
          user: true,
        },
      },
    },
  });

  if (batch?.slack !== null) {
    throw req.server.httpErrors.conflict(
      `slack channel already exist with channelId:${batch?.slack}`,
    );
  }

  let channelId: any;
  if (batch?.users.length) {
    try {
      let channelName = batch.title.toLowerCase();
      channelId = await createSlackChannelInApp(channelName);
    } catch (error: any) {
      throw req.server.httpErrors.serviceUnavailable(error.data.error);
    }
  } else {
    throw req.server.httpErrors.badRequest(
      'either batch or users in batch does not exist ',
    );
  }

  const updatedBatch = await req.server.prisma.batch.update({
    where: {
      id: batchId,
    },
    data: {
      slack: channelId,
    },
  });

  await res.code(201).send({
    success: true,
    data: {
      batch: updatedBatch,
    },
  });
};

const addUserToChannel: RouteHandler<{
  Body: z.TypeOf<typeof slackSchemas.addUserToChannel.body>;
  Reply: z.TypeOf<typeof slackSchemas.addUserToChannel.response>;
}> = async (req, res) => {
  const { batchId, email } = req.body!;

  const batch = await req.server.prisma.batch.findFirst({
    where: {
      id: batchId,
    },
    include: {
      users: {
        select: {
          user: true,
        },
      },
    },
  });

  if (batch?.slack == null || !batch) {
    throw req.server.httpErrors.badRequest(
      'either batch or slack channel doesnot exist',
    );
  }

  try {
    const userSlackId = await lookupByEmail(email);
    await inviteUserToChannel(batch.slack, userSlackId);
  } catch (error: any) {
    if (error.data.error == 'users_not_found') {
      throw req.server.httpErrors.forbidden('email is not registered on slack');
    } else if (error.data.error == 'already_in_channel') {
      throw req.server.httpErrors.conflict('user already in slack channel');
    } else
      throw req.server.httpErrors.internalServerError('something went wrong');
  }

  await res.code(200).send({
    success: true,
    message: 'user added to slack channel',
  });
};

const getUserSlackStatus: RouteHandler<{
  Querystring: z.TypeOf<typeof slackSchemas.getUser.queryString>;
  Reply: z.TypeOf<typeof slackSchemas.getUser.response>;
}> = async (req, res) => {
  const { channelId, email } = req.query;

  let userInChannel = false;
  try {
    const userSlackId = await lookupByEmail(email);

    const channelMembers = await web.conversations.members({
      channel: channelId,
    });

    if (channelMembers.ok && channelMembers?.members?.includes(userSlackId!)) {
      userInChannel = true;
    }
  } catch (error: any) {
    console.log(error);
    if (error.data.error == 'channel_not_found') {
      throw req.server.httpErrors.badRequest(
        `No Slack Channel For ChannelId:${channelId}`,
      );
    } else if (error.data.error == 'users_not_found') {
      throw req.server.httpErrors.forbidden('email is not registered on slack');
    } else throw req.server.httpErrors.internalServerError();
  }

  return await res.send({
    success: true,
    data: userInChannel,
  });
};

const removeUserFromChannel: RouteHandler<{
  Querystring: z.TypeOf<typeof slackSchemas.deleteUser.queryString>;
  Reply: z.TypeOf<typeof slackSchemas.deleteUser.response>;
}> = async (req, res) => {
  const { email, channelId } = req.query;

  let userDeleted = false;
  try {
    const userSlackId = await lookupByEmail(email);

    const channelMembers = await web.conversations.members({
      channel: channelId,
    });

    if (channelMembers.ok && channelMembers?.members?.includes(userSlackId!)) {
      const userDeletionStatus = await deleteFromChannel(
        userSlackId!,
        channelId,
      );
      if (userDeletionStatus.ok == true) userDeleted = true;
    }
  } catch (error: any) {
    if (error.data.error == 'channel_not_found') {
      throw req.server.httpErrors.badRequest(
        `No Slack Channel For ChannelId:${channelId}`,
      );
    } else if (error.data.error == 'users_not_found') {
      throw req.server.httpErrors.forbidden('email is not registered on slack');
    } else throw req.server.httpErrors.internalServerError();
  }

  return res.send({
    success: true,
    data: {
      userDeleted: userDeleted,
      message: userDeleted
        ? 'user deleted successfully'
        : 'user is not in a channel',
    },
  });
};

//HELPER FUNCTION TO CREATE SLACK CHANNEL
const createSlackChannelInApp = async (channelName: string) => {
  const newChannel = await web.conversations.create({
    name: channelName,
    is_private: true,
  });
  return newChannel.channel?.id;
};

//HELPER FUNCTION TO ADD USER'S TO SLACK CHANNEL
const inviteUserToChannel = async (
  channelId: any,
  userSlackId: string | undefined,
) => {
  const result = await web.conversations.invite({
    channel: channelId,
    users: userSlackId!,
  });
  return result;
};

// HELPER FUNCTION TO GET USERID FROM EMAIL
const lookupByEmail = async (email: string) => {
  const userDetails = await web.users.lookupByEmail({ email });
  return userDetails.user?.id;
};

const deleteFromChannel = async (userId: string, channelId: string) => {
  const result = await web.conversations.kick({
    channel: channelId,
    user: userId,
  });
  return result;
};

export default {
  createSlackChannel,
  addUserToChannel,
  getUserSlackStatus,
  removeUserFromChannel,
};
