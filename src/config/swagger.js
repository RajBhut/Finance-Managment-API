import { env } from "./env.js";

export const swaggerSpec = {
  openapi: "3.0.3",
  info: {
    title: "Finance Data Processing and Access Control API",
    version: "1.0.0",
    description:
      "A production-oriented finance backend with role-based access control, summaries, search, filtering, pagination, and soft delete support.",
  },
  servers: [
    {
      url: `http://localhost:${env.PORT}`,
      description: "Local development server",
    },
  ],
  tags: [
    { name: "Health" },
    { name: "Auth" },
    { name: "Users" },
    { name: "Records" },
    { name: "Categories" },
    { name: "Dashboard" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "Validation failed" },
          details: { type: "array", items: { type: "object" } },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          email: { type: "string" },
          role: { type: "string", enum: ["VIEWER", "ANALYST", "ADMIN"] },
          status: { type: "string", enum: ["ACTIVE", "INACTIVE"] },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Category: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          type: { type: "string", enum: ["INCOME", "EXPENSE"] },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Record: {
        type: "object",
        properties: {
          id: { type: "string" },
          amount: { type: "string", example: "1250.00" },
          type: { type: "string", enum: ["INCOME", "EXPENSE"] },
          note: { type: ["string", "null"] },
          date: { type: "string", format: "date-time" },
          isDeleted: { type: "boolean" },
          user: { $ref: "#/components/schemas/User" },
          category: {
            anyOf: [
              { $ref: "#/components/schemas/Category" },
              { type: "null" },
            ],
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      AuthResponse: {
        type: "object",
        properties: {
          user: { $ref: "#/components/schemas/User" },
          accessToken: { type: "string" },
          refreshToken: { type: "string" },
        },
      },
      CreateCategoryRequest: {
        type: "object",
        required: ["name", "type"],
        properties: {
          name: { type: "string", example: "Salary" },
          type: {
            type: "string",
            enum: ["INCOME", "EXPENSE"],
            example: "INCOME",
          },
        },
      },
      CreateRecordRequest: {
        type: "object",
        required: ["amount", "type", "date"],
        properties: {
          amount: { type: "number", example: 1250 },
          type: {
            type: "string",
            enum: ["INCOME", "EXPENSE"],
            example: "INCOME",
          },
          note: { type: ["string", "null"], example: "Monthly salary" },
          date: {
            type: "string",
            format: "date-time",
            example: "2026-04-03T00:00:00.000Z",
          },
          userId: {
            type: "string",
            format: "uuid",
            example: "550e8400-e29b-41d4-a716-446655440000",
          },
          categoryId: {
            type: "string",
            format: "uuid",
            example: "550e8400-e29b-41d4-a716-446655440001",
          },
          categoryName: { type: "string", example: "Salary" },
        },
      },
      DashboardSummary: {
        type: "object",
        properties: {
          range: {
            type: "object",
            properties: {
              from: { type: ["string", "null"], format: "date-time" },
              to: { type: ["string", "null"], format: "date-time" },
            },
          },
          totalIncome: { type: "number" },
          totalExpense: { type: "number" },
          netBalance: { type: "number" },
          recentActivity: {
            type: "array",
            items: { $ref: "#/components/schemas/Record" },
          },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        responses: {
          200: {
            description: "Service is healthy",
          },
        },
      },
    },
    "/api/v1/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string" },
                  email: { type: "string" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "User created" },
        },
      },
    },
    "/api/v1/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login and receive tokens",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Authenticated" },
        },
      },
    },
    "/api/v1/auth/refresh": {
      post: {
        tags: ["Auth"],
        summary: "Refresh the access token",
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  refreshToken: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "New tokens issued" },
        },
      },
    },
    "/api/v1/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Invalidate the refresh token",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Logged out" },
        },
      },
    },
    "/api/v1/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Return the current user",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Current user" },
        },
      },
    },
    "/api/v1/users": {
      get: {
        tags: ["Users"],
        summary: "List users",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "page",
            in: "query",
            required: false,
            schema: { type: "integer", minimum: 1, example: 1 },
          },
          {
            name: "limit",
            in: "query",
            required: false,
            schema: { type: "integer", minimum: 1, maximum: 100, example: 20 },
          },
          {
            name: "search",
            in: "query",
            required: false,
            schema: { type: "string", example: "jane" },
          },
          {
            name: "role",
            in: "query",
            required: false,
            schema: {
              type: "string",
              enum: ["VIEWER", "ANALYST", "ADMIN"],
            },
          },
          {
            name: "status",
            in: "query",
            required: false,
            schema: {
              type: "string",
              enum: ["ACTIVE", "INACTIVE"],
            },
          },
          {
            name: "sortBy",
            in: "query",
            required: false,
            schema: {
              type: "string",
              enum: ["createdAt", "updatedAt", "name", "email"],
              example: "createdAt",
            },
          },
          {
            name: "sortOrder",
            in: "query",
            required: false,
            schema: {
              type: "string",
              enum: ["asc", "desc"],
              example: "desc",
            },
          },
        ],
        responses: {
          200: { description: "Paginated user list" },
        },
      },
      post: {
        tags: ["Users"],
        summary: "Create a user as admin",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string", example: "Jane Analyst" },
                  email: { type: "string", example: "jane@company.com" },
                  password: { type: "string", example: "StrongPass#123" },
                  role: {
                    type: "string",
                    enum: ["VIEWER", "ANALYST", "ADMIN"],
                    example: "ANALYST",
                  },
                  status: {
                    type: "string",
                    enum: ["ACTIVE", "INACTIVE"],
                    example: "ACTIVE",
                  },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "User created" },
        },
      },
    },
    "/api/v1/users/{id}": {
      patch: {
        tags: ["Users"],
        summary: "Update user access or profile",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string", example: "Jane Updated" },
                  email: { type: "string", example: "jane@company.com" },
                  password: { type: "string", example: "NewStrongPass#123" },
                  role: {
                    type: "string",
                    enum: ["VIEWER", "ANALYST", "ADMIN"],
                    example: "VIEWER",
                  },
                  status: {
                    type: "string",
                    enum: ["ACTIVE", "INACTIVE"],
                    example: "ACTIVE",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "User updated" },
        },
      },
    },
    "/api/v1/records": {
      get: {
        tags: ["Records"],
        summary: "List financial records with search and filters",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "page",
            in: "query",
            required: false,
            schema: { type: "integer", minimum: 1, example: 1 },
          },
          {
            name: "limit",
            in: "query",
            required: false,
            schema: { type: "integer", minimum: 1, maximum: 100, example: 20 },
          },
          {
            name: "search",
            in: "query",
            required: false,
            schema: { type: "string", example: "rent" },
          },
          {
            name: "type",
            in: "query",
            required: false,
            schema: { type: "string", enum: ["INCOME", "EXPENSE"] },
          },
          {
            name: "userId",
            in: "query",
            required: false,
            schema: { type: "string", format: "uuid" },
          },
          {
            name: "categoryId",
            in: "query",
            required: false,
            schema: { type: "string", format: "uuid" },
          },
          {
            name: "dateFrom",
            in: "query",
            required: false,
            schema: { type: "string", format: "date-time" },
          },
          {
            name: "dateTo",
            in: "query",
            required: false,
            schema: { type: "string", format: "date-time" },
          },
          {
            name: "includeDeleted",
            in: "query",
            required: false,
            schema: { type: "boolean", example: false },
          },
          {
            name: "sortBy",
            in: "query",
            required: false,
            schema: {
              type: "string",
              enum: ["date", "createdAt", "amount", "updatedAt"],
              example: "date",
            },
          },
          {
            name: "sortOrder",
            in: "query",
            required: false,
            schema: {
              type: "string",
              enum: ["asc", "desc"],
              example: "desc",
            },
          },
        ],
        responses: {
          200: { description: "Paginated record list" },
        },
      },
      post: {
        tags: ["Records"],
        summary: "Create a financial record",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateRecordRequest" },
            },
          },
        },
        responses: {
          201: { description: "Record created" },
        },
      },
    },
    "/api/v1/records/{id}": {
      get: {
        tags: ["Records"],
        summary: "Fetch a single record",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: { description: "Record details" },
        },
      },
      patch: {
        tags: ["Records"],
        summary: "Update a record",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: { description: "Record updated" },
        },
      },
      delete: {
        tags: ["Records"],
        summary: "Soft delete a record",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: { description: "Record archived" },
        },
      },
    },
    "/api/v1/records/{id}/restore": {
      patch: {
        tags: ["Records"],
        summary: "Restore a soft deleted record",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: { description: "Record restored" },
        },
      },
    },
    "/api/v1/categories": {
      get: {
        tags: ["Categories"],
        summary: "List categories",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "page",
            in: "query",
            required: false,
            schema: { type: "integer", minimum: 1, example: 1 },
          },
          {
            name: "limit",
            in: "query",
            required: false,
            schema: { type: "integer", minimum: 1, maximum: 100, example: 20 },
          },
          {
            name: "search",
            in: "query",
            required: false,
            schema: { type: "string", example: "salary" },
          },
          {
            name: "type",
            in: "query",
            required: false,
            schema: { type: "string", enum: ["INCOME", "EXPENSE"] },
          },
          {
            name: "sortBy",
            in: "query",
            required: false,
            schema: {
              type: "string",
              enum: ["createdAt", "name"],
              example: "createdAt",
            },
          },
          {
            name: "sortOrder",
            in: "query",
            required: false,
            schema: {
              type: "string",
              enum: ["asc", "desc"],
              example: "asc",
            },
          },
        ],
        responses: {
          200: { description: "Category list" },
        },
      },
      post: {
        tags: ["Categories"],
        summary: "Create a category",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateCategoryRequest" },
            },
          },
        },
        responses: {
          201: { description: "Category created" },
        },
      },
    },
    "/api/v1/categories/{id}": {
      patch: {
        tags: ["Categories"],
        summary: "Update a category",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: { description: "Category updated" },
        },
      },
      delete: {
        tags: ["Categories"],
        summary: "Delete a category",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: { description: "Category deleted" },
        },
      },
    },
    "/api/v1/dashboard/summary": {
      get: {
        tags: ["Dashboard"],
        summary: "Return dashboard summary metrics",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "dateFrom",
            in: "query",
            required: false,
            schema: { type: "string", format: "date-time" },
          },
          {
            name: "dateTo",
            in: "query",
            required: false,
            schema: { type: "string", format: "date-time" },
          },
        ],
        responses: {
          200: { description: "Summary data" },
        },
      },
    },
  },
};
