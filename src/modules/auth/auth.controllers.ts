/* eslint-disable @typescript-eslint/ban-ts-comment */
import { RouteHandler } from 'fastify';
import { z } from 'zod';
import { hashPassword } from '../../utils/helpers';
import {
  mixPanelPeopleIncrement,
  mixPanelPeopleSet,
  mixPanelTrack,
} from '../../utils/service.mixpanel';
import authSchemas from './auth.schemas';

const registerUser: RouteHandler<{
  Body: z.TypeOf<typeof authSchemas.registerUser.body>;
  Reply: z.TypeOf<typeof authSchemas.registerUser.response>;
}> = async (req, res) => {
  const { email, password, firstName, lastName } = req.body;

  const hashedPassword = await hashPassword(password);

  const existingUser = await req.server.prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (existingUser) {
    throw req.server.httpErrors.conflict('User with this email already exists');
  }

  const stripeCustomer = await req.server.stripe.customers.create({
    email,
  });

  const user = await req.server.prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      stripeCustomerId: stripeCustomer.id,
    },
  });
  // sending Email on sign up
  const emailMessage = {
    to: user.email,
    from: process.env.SENDER_EMAIL,
    template_id: process.env.SIGNUP_TEMPLATE,
    dynamic_template_data: {
      first_name: user.firstName,
    },
  };

  try {
    //@ts-ignore
    await req.server.sendgrid.send(emailMessage);
  } catch (err: any) {
    console.log('SENDGRID ERROR');
  }

  const clientIp = req.headers['x-forwarded-for'];

  //track user Sign Up event and create User Profile with user id
  Promise.all([
    await mixPanelTrack('Sign Up', {
      distinct_id: user.id,
      $first_name: firstName,
      $last_name: lastName,
      $email: email,
      Avatar: user.photo,
      'Plan Type': user.plan,
      'Registration Date': user.createdAt,
      'Registration Method': 'Local',
      ip: clientIp,
    }),
    await mixPanelPeopleSet(
      user.id,
      {
        $first_name: firstName,
        $last_name: lastName,
        $email: email,
        Avatar: user.photo,
        'Plan Type': user.plan,
        'Registration Date': user.createdAt,
        'Registration Method': 'Local',
        'Number Of Logins': 1,
      },
      {
        $ip: clientIp,
      },
    ),
    await req.server.prisma.notification.create({
      data: {
        notification: {
          connectOrCreate: {
            where: {
              content: 'Hi there, Welcome to our platform',
            },
            create: {
              content: 'Hi there, Welcome to our platform',
            },
          },
        },
        receiver: {
          connect: {
            id: user.id,
          },
        },
      },
    }),

    await res.code(201).send({
      success: true,
      data: {
        user,
      },
    }),
  ]);
};

const login: RouteHandler<{
  Body: z.TypeOf<typeof authSchemas.login.body>;
  Reply: z.TypeOf<typeof authSchemas.login.response>;
}> = async (req, res) => {
  const user = req.user;

  if (!user) throw req.server.httpErrors.unauthorized();

  const clientIp = req.headers['x-forwarded-for'];

  // track Log In event and increment Number of Logins
  Promise.all([
    await mixPanelPeopleIncrement(user.id, { 'Number Of Logins': 1 }),
    await mixPanelTrack('Log In', {
      distinct_id: user.id,
      $first_name: user.firstName,
      $last_name: user.lastName,
      'Plan Type': user.plan,
      ip: clientIp,
    }),
    await res.code(200).send({
      success: true,
      data: {
        user,
      },
    }),
  ]);
};

const getMe: RouteHandler<{
  Reply: z.TypeOf<typeof authSchemas.getMe.response>;
}> = async (req, res) => {
  const user = req.user!;

  const userActivity = await req.server.prisma.userActivity.findFirst({
    where: {
      userId: user.id,
    },
  });

  if (userActivity == null) {
    await req.server.prisma.userActivity.create({
      data: {
        userId: user.id,
        lastSeen: new Date(),
      },
    });
  } else {
    await req.server.prisma.userActivity.update({
      where: {
        id: userActivity.id,
      },
      data: {
        userId: user.id,
        lastSeen: new Date(),
      },
    });
  }

  res.code(200).send({
    success: true,
    data: {
      user,
    },
  });
};

const editMe: RouteHandler<{
  Body: z.TypeOf<typeof authSchemas.editMe.body>;
  Reply: z.TypeOf<typeof authSchemas.editMe.response>;
}> = async (req, res) => {
  const user = req.user!;
  const { firstName, lastName, photo, phone, preferences } = req.body;

  const updatedUser = await req.server.prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      firstName,
      lastName,
      photo,
      phone,
      preferences,
    },
  });

  if (photo) {
    const clientIp = req.headers['x-forwarded-for'];
    Promise.all([
      await mixPanelPeopleSet(
        user.id,
        {
          $avatar: `${process.env.SUPABASE_URL}/storage/v1/object/public/users/photos/${photo}`,
        },
        {
          $ip: clientIp,
        },
      ),
      await mixPanelTrack('Avatar Updated', {
        distinct_id: user.id,
        ip: clientIp,
      }),
    ]);
  }

  if (phone) {
    const clientIp = req.headers['x-forwarded-for'];
    Promise.all([
      await mixPanelPeopleSet(
        user.id,
        {
          'Phone number': phone,
        },
        {
          $ip: clientIp,
        },
      ),
      await mixPanelTrack('Phone updated', {
        distinct_id: user.id,
        ip: clientIp,
      }),
    ]);
  }

  res.code(200).send({
    success: true,
    data: {
      user: updatedUser,
    },
  });
};

const logout: RouteHandler = async (req, res) => {
  req.logout();
  req.session.delete();

  res.code(200).send({
    success: true,
  });
};

const getMyNotifications: RouteHandler<{
  Reply: z.TypeOf<typeof authSchemas.getMyNotifications.response>;
}> = async (req, res) => {
  const user = req.user!;

  const notifications = await req.server.prisma.notification.findMany({
    where: {
      receiverId: user.id,
    },
    include: {
      notification: true,
    },
    orderBy: {
      notification: {
        createdAt: 'desc',
      },
    },
  });

  res.code(200).send({
    success: true,
    count: notifications.length,
    data: {
      notifications,
    },
  });
};

const readNotifications: RouteHandler<{
  Reply: z.infer<typeof authSchemas.readNotifications.response>;
}> = async (req, res) => {
  const user = req.user!;

  await req.server.prisma.notification.updateMany({
    where: {
      receiver: {
        id: user.id,
      },
    },
    data: {
      readAt: new Date(),
    },
  });

  return res.code(200).send({
    success: true,
  });
};

export default {
  registerUser,
  login,
  logout,
  getMe,
  editMe,
  getMyNotifications,
  readNotifications,
};
