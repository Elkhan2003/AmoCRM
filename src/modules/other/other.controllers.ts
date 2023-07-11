/* eslint-disable @typescript-eslint/ban-ts-comment */
import { PlanRange, UserPlan } from '@prisma/client';
import { RouteHandler } from 'fastify';
import Stripe from 'stripe';
import { z } from 'zod';
import getNextKey from '../../utils/helpers';
import { mixPanelPeopleSet, mixPanelTrack } from '../../utils/service.mixpanel';
import otherSchemas from './other.schemas';
import axios from 'axios';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
import twilio from 'twilio';

const client = twilio(accountSid, authToken);

const createCheckoutSession: RouteHandler<{
  Reply: z.TypeOf<typeof otherSchemas.createCheckoutSession.response>;
}> = async (req, res) => {
  let user: any = req.user!;

  try {
    let stripeCustomer: any;

    const existingCustomer = await req.server.stripe.customers.search({
      query: `email:'${user.email}'`,
    });

    if (existingCustomer.data.length === 0) {
      stripeCustomer = await req.server.stripe.customers.create({
        email: user.email,
      });

      user = await req.server.prisma.user.update({
        where: {
          email: user.email,
        },
        data: {
          stripeCustomerId: stripeCustomer.id,
        },
      });
    }

    //list payment methods
    // const paymentMethods = await req.server.stripe.customers.listPaymentMethods(
    //   user.stripeCustomerId,
    //   {type: 'card'}
    // );
    // console.log(JSON.stringify(paymentMethods, null, 4));

    // const plans = await req.server.stripe.plans.list();

    // console.log(JSON.stringify(plans, null, 4));

    // const subscriptions = await req.server.stripe.subscriptions.list({
    //   customer: user.stripeCustomerId
    // });

    // console.log(JSON.stringify(subscriptions, null, 4));

    const redirectAfterCheckoutUrl =
      req.server.config.NODE_ENV === 'development'
        ? `${process.env.FRONTEND_BASE_URL_DEV}/profile`
        : process.env.MODE === 'test'
        ? `${process.env.FRONTEND_BASE_URL_TEST}/profile`
        : `${process.env.FRONTEND_BASE_URL_PROD}/profile`;

    const priceId =
      req.server.config.NODE_ENV === 'development' ||
      process.env.MODE === 'test'
        ? process.env.TEST_STRIPE_PRICE_ID_PRO_MONTHLY
        : process.env.STRIPE_PRICE_ID_PRO_MONTHLY;

    const checkoutSession = await req.server.stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: user.stripeCustomerId,
      allow_promotion_codes: true,
      success_url: `${redirectAfterCheckoutUrl}?stripe_customer_id=${user.stripeCustomerId}`,
      cancel_url: `${redirectAfterCheckoutUrl}?stripe_customer_id=${user.stripeCustomerId}`,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        metadata: {
          payingUserId: user.id,
          plan: 'PRO',
        },
      },
    });

    if (!checkoutSession.url) {
      throw req.server.httpErrors.serviceUnavailable(
        'Could not create stripe checkout session',
      );
    }

    res.code(201).send({
      success: true,
      data: {
        redirectUrl: checkoutSession.url,
      },
    });
  } catch (error) {
    console.log(error);
  }
};

const createCheckoutSessionProMonthly: RouteHandler<{
  Reply: z.TypeOf<typeof otherSchemas.createCheckoutSession.response>;
}> = async (req, res) => {
  let user: any = req.user!;
  const plan = 'pro';

  try {
    let stripeCustomer: any;

    const existingCustomer = await req.server.stripe.customers.search({
      query: `email:'${user.email}'`,
    });

    if (existingCustomer.data.length === 0) {
      stripeCustomer = await req.server.stripe.customers.create({
        email: user.email,
      });

      user = await req.server.prisma.user.update({
        where: {
          email: user.email,
        },
        data: {
          stripeCustomerId: stripeCustomer.id,
        },
      });
    }

    const redirectAfterCheckoutUrl =
      req.server.config.NODE_ENV === 'development'
        ? `${process.env.FRONTEND_BASE_URL_DEV}/successful-payment?plan=${plan}`
        : process.env.MODE === 'test'
        ? `${process.env.FRONTEND_BASE_URL_TEST}/successful-payment?plan=${plan}`
        : `${process.env.FRONTEND_BASE_URL_PROD}/successful-payment?plan=${plan}`;

    const priceId =
      req.server.config.NODE_ENV === 'development' ||
      process.env.MODE === 'test'
        ? process.env.TEST_STRIPE_PRICE_ID_PRO_MONTHLY
        : process.env.STRIPE_PRICE_ID_PRO_MONTHLY;

    const checkoutSession = await req.server.stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: user.stripeCustomerId,
      allow_promotion_codes: true,
      success_url: `${redirectAfterCheckoutUrl}&stripe_customer_id=${user.stripeCustomerId}`,
      cancel_url: `${redirectAfterCheckoutUrl}&stripe_customer_id=${user.stripeCustomerId}`,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        payingUserId: user.id,
        plan: UserPlan.PRO,
        planRange: PlanRange.MONTHLY,
      },
      subscription_data: {
        metadata: {
          payingUserId: user.id,
          plan: UserPlan.PRO,
          planRange: PlanRange.MONTHLY,
        },
      },
    });

    if (!checkoutSession.url) {
      throw req.server.httpErrors.serviceUnavailable(
        'Could not create stripe checkout session',
      );
    }

    res.code(201).send({
      success: true,
      data: {
        redirectUrl: checkoutSession.url,
      },
    });
  } catch (error) {
    console.log(error);
  }
};

const createCheckoutSessionProOneTime: RouteHandler<{
  Reply: z.TypeOf<typeof otherSchemas.createCheckoutSession.response>;
}> = async (req, res) => {
  let user: any = req.user!;
  const plan = 'pro';
  try {
    let stripeCustomer: any;

    const existingCustomer = await req.server.stripe.customers.search({
      query: `email:'${user.email}'`,
    });

    if (existingCustomer.data.length === 0) {
      stripeCustomer = await req.server.stripe.customers.create({
        email: user.email,
      });

      user = await req.server.prisma.user.update({
        where: {
          email: user.email,
        },
        data: {
          stripeCustomerId: stripeCustomer.id,
        },
      });
    }

    const redirectAfterCheckoutUrl =
      req.server.config.NODE_ENV === 'development'
        ? `${process.env.FRONTEND_BASE_URL_DEV}/successful-payment?plan=${plan}`
        : process.env.MODE === 'test'
        ? `${process.env.FRONTEND_BASE_URL_TEST}/successful-payment?plan=${plan}`
        : `${process.env.FRONTEND_BASE_URL_PROD}/successful-payment?plan=${plan}`;

    const priceId =
      req.server.config.NODE_ENV === 'development' ||
      process.env.MODE === 'test'
        ? process.env.TEST_STRIPE_PRICE_ID_PRO_ONE_TIME
        : process.env.STRIPE_PRICE_ID_PRO_ONE_TIME;

    const checkoutSession = await req.server.stripe.checkout.sessions.create({
      mode: 'payment',
      customer: user.stripeCustomerId,
      allow_promotion_codes: true,
      success_url: `${redirectAfterCheckoutUrl}&stripe_customer_id=${user.stripeCustomerId}`,
      cancel_url: `${redirectAfterCheckoutUrl}&stripe_customer_id=${user.stripeCustomerId}`,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        payingUserId: user.id,
        plan: UserPlan.PRO,
        planRange: PlanRange.ANNUALLY,
      },
      payment_intent_data: {
        metadata: {
          payingUserId: user.id,
          plan: UserPlan.PRO,
          planRange: PlanRange.ANNUALLY,
        },
      },
    });

    if (!checkoutSession.url) {
      throw req.server.httpErrors.serviceUnavailable(
        'Could not create stripe checkout session',
      );
    }

    res.code(201).send({
      success: true,
      data: {
        redirectUrl: checkoutSession.url,
      },
    });
  } catch (error) {
    console.log(error);
  }
};

const createCheckoutSessionPremiumMonthly: RouteHandler<{
  Reply: z.TypeOf<typeof otherSchemas.createCheckoutSession.response>;
}> = async (req, res) => {
  let user: any = req.user!;
  const plan = 'premium';

  try {
    let stripeCustomer: any;

    const existingCustomer = await req.server.stripe.customers.search({
      query: `email:'${user.email}'`,
    });

    if (existingCustomer.data.length === 0) {
      stripeCustomer = await req.server.stripe.customers.create({
        email: user.email,
      });

      user = await req.server.prisma.user.update({
        where: {
          email: user.email,
        },
        data: {
          stripeCustomerId: stripeCustomer.id,
        },
      });
    }

    const redirectAfterCheckoutUrl =
      req.server.config.NODE_ENV === 'development'
        ? `${process.env.FRONTEND_BASE_URL_DEV}/successful-payment?plan=${plan}`
        : process.env.MODE === 'test'
        ? `${process.env.FRONTEND_BASE_URL_TEST}/successful-payment?plan=${plan}`
        : `${process.env.FRONTEND_BASE_URL_PROD}/successful-payment?plan=${plan}`;

    const priceId =
      req.server.config.NODE_ENV === 'development' ||
      process.env.MODE === 'test'
        ? process.env.TEST_STRIPE_PRICE_ID_PREMIUM_MONTHLY
        : process.env.STRIPE_PRICE_ID_PREMIUM_MONTHLY;

    const checkoutSession = await req.server.stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: user.stripeCustomerId,
      allow_promotion_codes: true,
      success_url: `${redirectAfterCheckoutUrl}&stripe_customer_id=${user.stripeCustomerId}`,
      cancel_url: `${redirectAfterCheckoutUrl}&stripe_customer_id=${user.stripeCustomerId}`,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        payingUserId: user.id,
        plan: UserPlan.PREMIUM,
        planRange: PlanRange.MONTHLY,
      },
      subscription_data: {
        metadata: {
          payingUserId: user.id,
          plan: UserPlan.PREMIUM,
          planRange: PlanRange.MONTHLY,
        },
      },
    });

    if (!checkoutSession.url) {
      throw req.server.httpErrors.serviceUnavailable(
        'Could not create stripe checkout session',
      );
    }

    res.code(201).send({
      success: true,
      data: {
        redirectUrl: checkoutSession.url,
      },
    });
  } catch (error) {
    console.log(error);
  }
};

const createCheckoutSessionPremiumOneTime: RouteHandler<{
  Reply: z.TypeOf<typeof otherSchemas.createCheckoutSession.response>;
}> = async (req, res) => {
  let user: any = req.user!;
  const plan = 'premium';

  try {
    let stripeCustomer: any;

    const existingCustomer = await req.server.stripe.customers.search({
      query: `email:'${user.email}'`,
    });

    if (existingCustomer.data.length === 0) {
      stripeCustomer = await req.server.stripe.customers.create({
        email: user.email,
      });

      user = await req.server.prisma.user.update({
        where: {
          email: user.email,
        },
        data: {
          stripeCustomerId: stripeCustomer.id,
        },
      });
    }

    const redirectAfterCheckoutUrl =
      req.server.config.NODE_ENV === 'development'
        ? `${process.env.FRONTEND_BASE_URL_DEV}/successful-payment?plan=${plan}`
        : process.env.MODE === 'test'
        ? `${process.env.FRONTEND_BASE_URL_TEST}/successful-payment?plan=${plan}`
        : `${process.env.FRONTEND_BASE_URL_PROD}/successful-payment?plan=${plan}`;

    const priceId =
      req.server.config.NODE_ENV === 'development' ||
      process.env.MODE === 'test'
        ? process.env.TEST_STRIPE_PRICE_ID_PREMIUM_ONE_TIME
        : process.env.STRIPE_PRICE_ID_PREMIUM_ONE_TIME;

    const checkoutSession = await req.server.stripe.checkout.sessions.create({
      mode: 'payment',
      customer: user.stripeCustomerId,
      allow_promotion_codes: true,
      success_url: `${redirectAfterCheckoutUrl}&stripe_customer_id=${user.stripeCustomerId}`,
      cancel_url: `${redirectAfterCheckoutUrl}&stripe_customer_id=${user.stripeCustomerId}`,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        payingUserId: user.id,
        plan: UserPlan.PREMIUM,
        planRange: PlanRange.ANNUALLY,
      },
      payment_intent_data: {
        metadata: {
          payingUserId: user.id,
          plan: UserPlan.PREMIUM,
          planRange: PlanRange.ANNUALLY,
        },
      },
    });

    if (!checkoutSession.url) {
      throw req.server.httpErrors.serviceUnavailable(
        'Could not create stripe checkout session',
      );
    }

    res.code(201).send({
      success: true,
      data: {
        redirectUrl: checkoutSession.url,
      },
    });
  } catch (error) {
    console.log(error);
  }
};

const sendSmsCodeVerify: RouteHandler<{
  Body: z.TypeOf<typeof otherSchemas.sendSmsCodeVerification.body>;
  Reply: z.TypeOf<typeof otherSchemas.sendSmsCodeVerification.response>;
}> = async (req, res) => {
  const { phone } = req.body;
  const user = req.user!;

  if (
    (user.phone == null || user.phone !== phone) &&
    user.isPhoneVerified == false
  ) {
    await req.server.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        phone: phone,
      },
    });
  } else if (user.phone !== null && user.isPhoneVerified == false) {
    const verifiedUser = await req.server.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        isPhoneVerified: true,
        phone: phone,
      },
    });

    if (process.env.MODE == 'live') {
      //PUSHING NEW USER TO AMOCRM
      const accessToken = await req.server.prisma.amoCRM.findFirst({
        where: {
          id: 1,
          expiry: {
            gt: new Date(),
          },
        },
      });
      if (accessToken) {
        addContactsToAmoCRM(
          user.firstName,
          user.lastName,
          phone,
          accessToken.value,
        );
      } else {
        const refreshToken = await req.server.prisma.amoCRM.findFirst({
          where: {
            id: 2,
          },
        });

        if (refreshToken) {
          const tokenData = await getAccessToken(refreshToken!.value);

          if (tokenData) {
            addContactsToAmoCRM(
              user.firstName,
              user.lastName,
              phone,
              tokenData.accessToken,
            );

            await req.server.prisma.amoCRM.update({
              where: {
                id: 1,
              },
              data: {
                value: tokenData.accessToken,
                expiry: new Date(
                  new Date().setSeconds(
                    new Date().getSeconds() + tokenData.expire - 3600,
                  ),
                ),
              },
            });
            await req.server.prisma.amoCRM.update({
              where: {
                id: 2,
              },
              data: {
                value: tokenData.refreshToken,
                expiry: new Date(new Date().setDate(new Date().getDate() + 90)),
              },
            });
          }
        }
      }
    }
    await res.code(201).send({
      success: true,
      data: {
        verifiedUser,
      },
    });
  }

  let serviceSid: any;
  let verificationInfo: any;

  await client.verify.v2.services
    .create({ friendlyName: 'WeDevX phone' })
    .then((service: any) => {
      serviceSid = service.sid;
    });

  await client.verify.v2
    .services(serviceSid)
    .verifications.create({ to: phone, channel: 'sms' })
    .then((verification: any) => {
      verificationInfo = verification;
    });
  const { status, dateCreated, dateUpdated } = verificationInfo;

  res.code(201).send({
    success: true,
    data: {
      serviceSid: serviceSid,
      status,
      dateCreated,
      dateUpdated,
    },
  });
};

const checkSmsCodeVerify: RouteHandler<{
  Body: z.TypeOf<typeof otherSchemas.checkSmsCodeVerification.body>;
  Reply: z.TypeOf<typeof otherSchemas.checkSmsCodeVerification.response>;
}> = async (req, res) => {
  const { code, serviceSid, phone } = req.body;
  const userPassport = req.user!;

  let verificationCheckInfo: any;

  await client.verify.v2
    .services(serviceSid)
    .verificationChecks.create({ to: phone, code: code })
    .then((verification_check: any) => {
      verificationCheckInfo = verification_check;
    });

  const { status, dateCreated, dateUpdated } = verificationCheckInfo;
  let user: any;

  if (status === 'approved') {
    user = await req.server.prisma.user.update({
      where: {
        id: req.user?.id,
      },
      data: {
        isPhoneVerified: true,
        phone: phone,
      },
    });

    if (process.env.MODE == 'live') {
      //PUSHING NEW USER TO AMOCRM
      const accessToken = await req.server.prisma.amoCRM.findFirst({
        where: {
          id: 1,
          expiry: {
            gt: new Date(),
          },
        },
      });
      if (accessToken) {
        addContactsToAmoCRM(
          userPassport.firstName,
          userPassport.lastName,
          phone,
          accessToken.value,
        );
      } else {
        const refreshToken = await req.server.prisma.amoCRM.findFirst({
          where: {
            id: 2,
          },
        });

        if (refreshToken) {
          const tokenData = await getAccessToken(refreshToken.value);

          if (tokenData) {
            addContactsToAmoCRM(
              userPassport.firstName,
              userPassport.lastName,
              phone,
              tokenData.accessToken,
            );

            await req.server.prisma.amoCRM.update({
              where: {
                id: 1,
              },
              data: {
                value: tokenData.accessToken,
                expiry: new Date(
                  new Date().setSeconds(
                    new Date().getSeconds() + tokenData.expire - 3600,
                  ),
                ),
              },
            });
            await req.server.prisma.amoCRM.update({
              where: {
                id: 2,
              },
              data: {
                value: tokenData.refreshToken,
                expiry: new Date(new Date().setDate(new Date().getDate() + 90)),
              },
            });
          }
        }
      }
    }
  }

  res.code(201).send({
    success: true,
    data: {
      status,
      dateCreated,
      dateUpdated,
      user,
    },
  });
};

const createPortalSession: RouteHandler<{
  Reply: z.TypeOf<typeof otherSchemas.createPortalSession.response>;
}> = async (req, res) => {
  const user = req.user!;

  const redirectAfterPortalUrl =
    req.server.config.NODE_ENV === 'development'
      ? `${process.env.FRONTEND_BASE_URL_DEV}/profile`
      : process.env.MODE === 'test'
      ? `${process.env.FRONTEND_BASE_URL_TEST}/profile`
      : `${process.env.FRONTEND_BASE_URL_PROD}/profile`;

  const portalSession = await req.server.stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: redirectAfterPortalUrl,
  });

  return res.code(201).send({
    success: true,
    data: {
      redirectUrl: portalSession.url,
    },
  });
};

const addLectureProgress: RouteHandler<{
  Params: z.TypeOf<typeof otherSchemas.addLectureProgress.params>;
  Reply: z.TypeOf<typeof otherSchemas.addLectureProgress.response>;
}> = async (req, res) => {
  const user = req.user!;
  const { id } = req.params;

  let lectureProgress = await req.server.prisma.lectureProgress.findFirst({
    where: {
      userId: user.id,
      lectureId: id,
    },
  });

  if (lectureProgress) {
    throw req.server.httpErrors.conflict('Progress already exists');
  } else {
    lectureProgress = await req.server.prisma.lectureProgress.create({
      data: {
        userId: user.id,
        lectureId: id,
      },
    });
    const allLectureProgressesCount =
      await req.server.prisma.lectureProgress.count({
        where: {
          userId: user.id,
        },
      });
    switch (allLectureProgressesCount) {
      case 1: {
        const emailMessage = {
          to: user.email,
          from: process.env.SENDER_EMAIL,
          template_id: process.env.FREETRIAL_AFTER_FIRST_CLASS_TEMPLATE,
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
        break;
      }
      case 4: {
        const emailMessage = {
          to: user.email,
          from: process.env.SENDER_EMAIL,
          template_id: process.env.DEACTIVATE_FEEDBACK_TEMPLATE,
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
        break;
      }

      default:
        break;
      // user has more than 1 class completed
    }
  }

  const lecture = await req.server.prisma.lecture.findUnique({
    where: {
      id,
    },
  });

  if (lecture) {
    /**
     * Check if the week is completed
     */
    const lectures = await req.server.prisma.lecture.findMany({
      where: {
        weekId: lecture.weekId,
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
          weekId: lecture.weekId,
        },
      });

      const week = await req.server.prisma.week.findUnique({
        where: {
          id: lecture.weekId,
        },
      });

      if (week) {
        /**
         * Check if the course is completed
         */
        const weeks = await req.server.prisma.week.findMany({
          where: {
            courseId: week.courseId,
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
              courseId: week.courseId,
            },
          });
        }
      }
    }
  }

  return res.code(201).send({
    success: true,
    lectureProgress: lectureProgress,
  });
};

const hanldeStripeWebhook: RouteHandler = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    throw req.server.httpErrors.badRequest('Invalid Stripe webhook request');
  }

  let event: Stripe.Event;

  try {
    event = req.server.stripe.webhooks.constructEvent(
      req.rawBody as any,
      sig,
      process.env.MODE === 'test'
        ? `${process.env.WEBHOOK_SECRET_TEST}`
        : req.server.config.WEBHOOK_SECRET,
    );
  } catch (err) {
    console.log(err);
    throw req.server.httpErrors.badRequest('Invalid Stripe webhook request');
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const checkoutSessionCompleted: any = event.data.object;

      if (
        checkoutSessionCompleted.metadata.payingUserId &&
        checkoutSessionCompleted.metadata.plan === 'PREMIUM'
      ) {
        const date = new Date().toJSON().slice(0, 10);

        const batches = await req.server.prisma.batch.findMany({
          where: {
            plan: checkoutSessionCompleted.metadata.plan,
            startDate: {
              gte: date,
            },
          },
          include: {
            users: {
              select: {
                user: true,
              },
            },
          },
          orderBy: {
            startDate: 'asc',
          },
        });

        const startDate = batches[0]?.startDate;
        let includedInBatch: boolean | undefined = false;

        if (batches.length !== 0) {
          for await (const batch of batches) {
            const usersCount = batch.users.length;
            const capacity = batch.capacity;

            if (usersCount < capacity) {
              await req.server.prisma.usersOnBatches.upsert({
                where: {
                  batchId_userId: {
                    batchId: batch.id,
                    userId: parseInt(
                      checkoutSessionCompleted.metadata.payingUserId,
                    ),
                  },
                },
                create: {
                  userId: parseInt(
                    checkoutSessionCompleted.metadata.payingUserId,
                  ),
                  batchId: batch.id,
                },
                update: {},
              });
              includedInBatch = true;
              break;
            }
          }

          // ! Fixed Bug By Elkhan --- In this updated code, I moved the else block inside the "if (batches.length !== 0)" block and replaced it with "if (!includedInBatch)"
          if (!includedInBatch) {
            const batchesWithStartDate = await req.server.prisma.batch.findMany(
              {
                where: {
                  plan: checkoutSessionCompleted.metadata.plan,
                  startDate: {
                    equals: startDate,
                  },
                },
                include: {
                  users: {
                    select: {
                      user: true,
                    },
                  },
                },
                orderBy: {
                  title: 'desc',
                },
              },
            );

            let title: string = batchesWithStartDate[0].title;
            const capacity = batchesWithStartDate[0].capacity;
            const plan = batchesWithStartDate[0].plan;
            const slack = batchesWithStartDate[0].slack;
            const endDate = batchesWithStartDate[0].endDate;
            const courseId = batchesWithStartDate[0].courseId;

            const nextLetter: string = getNextKey(title[title.length - 1]);

            const titleArray: string[] = title.split('-');

            titleArray[titleArray.length - 1] = nextLetter;

            title = titleArray.join('-');

            const nextBatch = await req.server.prisma.batch.create({
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

            await req.server.prisma.usersOnBatches.upsert({
              where: {
                batchId_userId: {
                  batchId: nextBatch.id,
                  userId: parseInt(
                    checkoutSessionCompleted.metadata.payingUserId,
                  ),
                },
              },
              create: {
                userId: parseInt(
                  checkoutSessionCompleted.metadata.payingUserId,
                ),
                batchId: nextBatch.id,
              },
              update: {},
            });
          }
        }
        const emailMessage = {
          to: checkoutSessionCompleted.customer_details.email,
          from: process.env.SENDER_EMAIL,
          template_id: process.env.WELCOME_TO_PREMIUM_TEMPLATE,
          dynamic_template_data: {
            first_name: checkoutSessionCompleted.customer_details.name,
          },
        };
        try {
          //@ts-ignore
          await req.server.sendgrid.send(emailMessage);
        } catch (err: any) {
          console.log('SENDGRID ERROR');
        }
      }

      if (
        checkoutSessionCompleted.metadata.payingUserId &&
        checkoutSessionCompleted.metadata.plan === 'PRO'
      ) {
        const date = new Date().toJSON().slice(0, 10);

        const batches = await req.server.prisma.batch.findMany({
          where: {
            plan: checkoutSessionCompleted.metadata.plan,
            startDate: {
              gte: date,
            },
          },
          include: {
            users: {
              select: {
                user: true,
              },
            },
          },
          orderBy: {
            startDate: 'desc',
          },
        });

        if (batches.length !== 0) {
          await req.server.prisma.usersOnBatches.upsert({
            where: {
              batchId_userId: {
                batchId: batches[0].id,
                userId: parseInt(
                  checkoutSessionCompleted.metadata.payingUserId,
                ),
              },
            },
            create: {
              userId: parseInt(checkoutSessionCompleted.metadata.payingUserId),
              batchId: batches[0].id,
            },
            update: {},
          });
        }

        const emailMessage = {
          to: checkoutSessionCompleted.customer_details.email,
          from: process.env.SENDER_EMAIL,
          template_id: process.env.WELCOME_TO_PRO_TEMPLATE,
          dynamic_template_data: {
            first_name: checkoutSessionCompleted.customer_details.name,
          },
        };
        try {
          //@ts-ignore
          await req.server.sendgrid.send(emailMessage);

          emailMessage.template_id = process.env.SECOND_WELCOME_TEMPLATE;
          //@ts-ignore
          await req.server.sendgrid.send(emailMessage);
        } catch (err: any) {
          console.log('SENDGRID ERROR');
        }
      }

      if (checkoutSessionCompleted.metadata.payingUserId) {
        const updatedUser = await req.server.prisma.user.update({
          where: {
            id: parseInt(checkoutSessionCompleted.metadata.payingUserId),
          },
          data: {
            plan: checkoutSessionCompleted.metadata.plan,
            planRange: checkoutSessionCompleted.metadata.planRange,
          },
          select: {
            email: true,
            id: true,
            plan: true,
          },
        });

        Promise.all([
          await mixPanelTrack('Subscribe', {
            distinct_id: parseInt(
              checkoutSessionCompleted.metadata.payingUserId,
            ),
            $email: updatedUser.email,
            'Plan Type': updatedUser.plan,
            Date: new Date().toUTCString(),
          }),
          await mixPanelPeopleSet(
            parseInt(checkoutSessionCompleted.metadata.payingUserId),
            {
              'Plan Type': updatedUser.plan,
              'Plan Range': checkoutSessionCompleted.metadata.planRange,
              Price: parseInt(checkoutSessionCompleted.amount_total) / 100,
            },
            {
              $ip: null,
            },
          ),
        ]);
      }

      // Then define and call a function to handle the event invoice.paid
      break;
    }
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // switch (event.type) {
  //   case 'invoice.paid': {
  //     const subscription = event.data.object as Stripe.Subscription;
  //     console.log("invoice.paid", subscription);

  //     const user = await req.server.prisma.user.findFirst({
  //       where: {
  //         stripeCustomerId: subscription.customer.toString(),
  //       },
  //     });

  //     if (!user) {
  //       throw req.server.httpErrors.badRequest('User is not found');
  //     }

  // const updatedUser = await req.server.prisma.user.update({
  //   where: {
  //     id: user.id,
  //   },
  //   data: {
  //     plan: 'PAID',
  //   },
  //   select: {
  //     email: true,
  //     id: true,
  //     plan: true,
  //   }
  // });
  // const clientIp = req.headers['x-forwarded-for'];
  // Promise.all([
  //   await mixPanelTrack("Subscribe", {
  //     distinct_id: updatedUser.id,
  //     $email: updatedUser.email,
  //     "Plan Type": updatedUser.plan,
  //     "Promocode": subscription.discount?.promotion_code,
  //     "Date": (new Date()).toUTCString(),
  //   }),
  //   await mixPanelPeopleSet(updatedUser.id, {
  //     "Plan Type": updatedUser.plan,
  //   },
  //   {
  //     $ip: clientIp
  //   })
  // ])

  //     break;
  //   }
  //   case 'customer.subscription.deleted': {
  //     const subscription = event.data.object as Stripe.Subscription;
  //     console.log("customer.subscription.deleted", subscription);

  //     const user = await req.server.prisma.user.findFirst({
  //       where: {
  //         stripeCustomerId: subscription.customer.toString(),
  //       },
  //     });

  //     if (!user) {
  //       throw req.server.httpErrors.badRequest('User is not found');
  //     }

  //     const updatedUser = await req.server.prisma.user.update({
  //       where: {
  //         id: user.id,
  //       },
  //       data: {
  //         plan: 'FREE',
  //       },
  //       select: {
  //         id: true,
  //         plan: true
  //       }
  //     });

  //     await mixPanelTrack("Unsubscribe", {
  //       distinct_id: updatedUser.id,
  //       "Plan Type": updatedUser.plan,
  //     })

  //     break;
  //   }
  // }

  return res.code(200).send({
    received: true,
  });
};

export default {
  createCheckoutSession,
  createCheckoutSessionProMonthly,
  createCheckoutSessionProOneTime,
  createCheckoutSessionPremiumMonthly,
  createCheckoutSessionPremiumOneTime,
  hanldeStripeWebhook,
  createPortalSession,
  sendSmsCodeVerify,
  checkSmsCodeVerify,
  addLectureProgress,
};

// #### HELPER FUNCTION TO ADD CONTACTS TO AMOCRM
const addContactsToAmoCRM = async (
  first_name: string,
  last_name: string,
  phone: string,
  accessToken: string,
) => {
  // Should Not Run In Local Environment To Maintain Refresh Token History
  // if (process.env.mode !== 'live') return true;

  const leadData = [
    {
      status_id: 57686042,
      name: first_name + ' ' + last_name,
      _embedded: {
        tags: [
          {
            name: 'freeusers',
          },
        ],
        contacts: [
          {
            first_name: first_name,
            last_name: last_name,
            custom_fields_values: [
              {
                field_code: 'PHONE',
                values: [
                  {
                    enum_code: 'WORK',
                    value: phone,
                  },
                ],
              },
            ],
          },
        ],
      },
    },
  ];

  console.log("Error loading amoCRM: Today I completely fixed the issue with sending new users to amoCRM. It turns out the problem was not the "+" sign. The problem was in the incorrect validation of links and keys. Now I will make a PR to the test branch. I handled it myself")

  try {
    axios.post(`${process.env.AMOCRM_URL}/api/v4/leads/complex`, leadData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
  } catch (err) {
    console.log('AMOCRM ERROR');
  }
};

const getAccessToken = async (refreshToken: string) => {
  const data = {
    client_id: process.env.AMOCRM_CLIENT_ID,
    client_secret: process.env.AMOCRM_CLIENT_SECRET,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    redirect_uri: 'https://localhost:3000',
  };

  let tokenData: any;
  try {
    tokenData = await axios.post(
      `${process.env.AMOCRM_URL}/oauth2/access_token`,
      data,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (err) {
    throw 'Unable to get refresh token from AmoCRM';
  }

  return {
    accessToken: tokenData.data.access_token,
    refreshToken: tokenData.data.refresh_token,
    expire: tokenData.data.expires_in,
  };
};
