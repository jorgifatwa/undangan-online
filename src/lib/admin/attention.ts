import "server-only";

import { db } from "@/lib/db";

/**
 * DAFTAR "PERLU TINDAKAN" panel admin — hal yang butuh ditindaklanjuti hari ini.
 */
const DAY = 86400_000;

export async function getAttention(now = new Date()) {
  const in7 = new Date(now.getTime() + 7 * DAY);
  const in14 = new Date(now.getTime() + 14 * DAY);
  const hourAgo = new Date(now.getTime() - 3600_000);
  const claimInclude = {
    invitation: {
      select: { slug: true, themeId: true, activeUntil: true, user: { select: { email: true } } },
    },
  } as const;
  const [expiring, liveNoAccount, activeEnding, emailFailed, stuckPayment, unfulfilled] =
    await Promise.all([
      db.claimLink.findMany({
        where: { status: "OPEN", expiresAt: { gt: now, lte: in7 } },
        orderBy: { expiresAt: "asc" },
        take: 20,
        include: claimInclude,
      }),
      db.claimLink.findMany({
        where: { status: "CONFIRMED", invitation: { user: { email: null } } },
        orderBy: { confirmedAt: "asc" },
        take: 20,
        include: claimInclude,
      }),
      db.claimLink.findMany({
        where: { status: "CONFIRMED", invitation: { activeUntil: { gt: now, lte: in14 } } },
        take: 20,
        include: claimInclude,
      }),
      db.webOrder.findMany({
        where: { status: "PAID", claimId: { not: null }, emailSentAt: null },
        orderBy: { paidAt: "asc" },
        take: 20,
      }),
      db.webOrder.findMany({
        where: { status: "PENDING", createdAt: { lte: hourAgo } },
        orderBy: { createdAt: "asc" },
        take: 20,
      }),
      db.webOrder.findMany({ where: { status: "PAID", claimId: null }, take: 20 }),
    ]);
  const total =
    expiring.length +
    liveNoAccount.length +
    activeEnding.length +
    emailFailed.length +
    stuckPayment.length +
    unfulfilled.length;
  return { expiring, liveNoAccount, activeEnding, emailFailed, stuckPayment, unfulfilled, total };
}
