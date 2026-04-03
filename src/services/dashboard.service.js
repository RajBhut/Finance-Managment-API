import { prisma } from "../config/prisma.js";
import { buildDateRange } from "../utils/query.js";

const getDefaultMonthlyRange = () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999,
  );

  return {
    gte: startOfMonth,
    lte: endOfMonth,
  };
};

const normalizeRange = ({ dateFrom, dateTo }) => {
  const explicitRange = buildDateRange(dateFrom, dateTo);
  if (Object.keys(explicitRange).length > 0) {
    return explicitRange;
  }

  return getDefaultMonthlyRange();
};

const formatRecord = (record) => ({
  id: record.id,
  amount: record.amount.toString(),
  type: record.type,
  note: record.note,
  date: record.date,
  isDeleted: record.isDeleted,
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
  user: record.user
    ? {
        id: record.user.id,
        name: record.user.name,
        email: record.user.email,
        role: record.user.role,
        status: record.user.status,
      }
    : null,
  category: record.category
    ? {
        id: record.category.id,
        name: record.category.name,
        type: record.category.type,
      }
    : null,
});

export const buildDashboardSummary = async ({ dateFrom, dateTo }) => {
  const range = normalizeRange({ dateFrom, dateTo });
  const where = {
    isDeleted: false,
    date: range,
  };

  const [aggregates, recentActivity, categoryBreakdown, monthlyTrends] =
    await Promise.all([
      prisma.record.aggregate({
        where,
        _sum: {
          amount: true,
        },
        _count: {
          _all: true,
        },
      }),
      prisma.record.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              status: true,
            },
          },
          category: true,
        },
        orderBy: { date: "desc" },
        take: 10,
      }),
      prisma.$queryRaw`
      SELECT
        c."id" AS "categoryId",
        c."name" AS "categoryName",
        r."type" AS "type",
        COALESCE(SUM(r."amount"), 0) AS "total"
      FROM "Record" r
      LEFT JOIN "Category" c ON c."id" = r."categoryId"
      WHERE r."isDeleted" = false
        AND r."date" BETWEEN ${range.gte} AND ${range.lte}
      GROUP BY c."id", c."name", r."type"
      ORDER BY "total" DESC
    `,
      prisma.$queryRaw`
      SELECT
        DATE_TRUNC('month', r."date") AS "month",
        r."type" AS "type",
        COALESCE(SUM(r."amount"), 0) AS "total"
      FROM "Record" r
      WHERE r."isDeleted" = false
        AND r."date" BETWEEN ${range.gte} AND ${range.lte}
      GROUP BY 1, 2
      ORDER BY 1 ASC
    `,
    ]);

  const [incomeCount, expenseCount] = await Promise.all([
    prisma.record.count({ where: { ...where, type: "INCOME" } }),
    prisma.record.count({ where: { ...where, type: "EXPENSE" } }),
  ]);

  const incomeTotal = await prisma.record.aggregate({
    where: { ...where, type: "INCOME" },
    _sum: { amount: true },
  });

  const expenseTotal = await prisma.record.aggregate({
    where: { ...where, type: "EXPENSE" },
    _sum: { amount: true },
  });

  return {
    range: {
      from: range.gte,
      to: range.lte,
    },
    totalIncome: Number(incomeTotal._sum.amount ?? 0),
    totalExpense: Number(expenseTotal._sum.amount ?? 0),
    netBalance:
      Number(incomeTotal._sum.amount ?? 0) -
      Number(expenseTotal._sum.amount ?? 0),
    totalTransactions: aggregates._count._all,
    recentActivity: recentActivity.map(formatRecord),
    categoryBreakdown: categoryBreakdown.map((row) => ({
      categoryId: row.categoryId,
      categoryName: row.categoryName ?? "Uncategorized",
      type: row.type,
      total: Number(row.total),
    })),
    monthlyTrends: monthlyTrends.map((row) => ({
      month: row.month ? new Date(row.month).toISOString().slice(0, 7) : null,
      type: row.type,
      total: Number(row.total),
    })),
    activityMix: {
      income: incomeCount,
      expense: expenseCount,
    },
  };
};
