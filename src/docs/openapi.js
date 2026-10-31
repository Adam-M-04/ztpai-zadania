function errorResponse(description, code, message) {
  return {
    description,
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/Error" },
        example: {
          error: { code, message, requestId: "8f81755f-0d5e-46af-907c-4aee63629d9a" },
        },
      },
    },
  };
}

function json(schema, description = "OK") {
  return { description, content: { "application/json": { schema } } };
}

const idParam = {
  name: "id",
  in: "path",
  required: true,
  schema: { type: "integer", minimum: 1 },
};

module.exports = {
  openapi: "3.0.3",
  info: {
    title: "Room Booking API",
    version: "4.0.0",
    description: "API do rezerwacji sal. Endpointy poza rejestracją i logowaniem wymagają tokenu JWT (przycisk Authorize).",
  },
  servers: [{ url: "/" }],
  tags: [
    { name: "auth" },
    { name: "buildings" },
    { name: "rooms" },
    { name: "reservations" },
  ],
  security: [{ bearerAuth: [] }],
  paths: {
    "/api/auth/register": {
      post: {
        tags: ["auth"],
        summary: "Rejestracja nowego użytkownika (zawsze rola USER)",
        security: [],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/RegisterRequest" } } },
        },
        responses: {
          201: json({ $ref: "#/components/schemas/User" }, "Utworzony użytkownik"),
          400: { $ref: "#/components/responses/BadRequest" },
          409: errorResponse("Email jest już zajęty", "EMAIL_TAKEN", "Email is already taken"),
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["auth"],
        summary: "Logowanie, zwraca token JWT",
        security: [],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/LoginRequest" } } },
        },
        responses: {
          200: json({ $ref: "#/components/schemas/Token" }, "Token dostępu"),
          400: { $ref: "#/components/responses/BadRequest" },
          401: errorResponse("Zły email lub hasło", "INVALID_CREDENTIALS", "Invalid email or password"),
        },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["auth"],
        summary: "Dane zalogowanego użytkownika",
        responses: {
          200: json({ $ref: "#/components/schemas/User" }),
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/buildings": {
      get: {
        tags: ["buildings"],
        summary: "Lista budynków",
        responses: {
          200: json({ type: "array", items: { $ref: "#/components/schemas/Building" } }),
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
      post: {
        tags: ["buildings"],
        summary: "Dodanie budynku (tylko ADMIN)",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreateBuildingRequest" } } },
        },
        responses: {
          201: json({ $ref: "#/components/schemas/Building" }, "Utworzony budynek"),
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          409: errorResponse("Budynek o tej nazwie już istnieje", "ALREADY_EXISTS", "Resource with this name already exists"),
        },
      },
    },
    "/api/buildings/{id}": {
      get: {
        tags: ["buildings"],
        summary: "Szczegóły budynku",
        parameters: [idParam],
        responses: {
          200: json({ $ref: "#/components/schemas/Building" }),
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          404: errorResponse("Budynek nie istnieje", "NOT_FOUND", "Building not found"),
        },
      },
    },
    "/api/buildings/{id}/rooms": {
      get: {
        tags: ["buildings"],
        summary: "Sale w budynku",
        parameters: [idParam],
        responses: {
          200: json({ type: "array", items: { $ref: "#/components/schemas/Room" } }),
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          404: errorResponse("Budynek nie istnieje", "NOT_FOUND", "Building not found"),
        },
      },
    },
    "/api/rooms": {
      get: {
        tags: ["rooms"],
        summary: "Lista sal",
        responses: {
          200: json({ type: "array", items: { $ref: "#/components/schemas/Room" } }),
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
      post: {
        tags: ["rooms"],
        summary: "Dodanie sali (tylko ADMIN)",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreateRoomRequest" } } },
        },
        responses: {
          201: json({ $ref: "#/components/schemas/Room" }, "Utworzona sala"),
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: errorResponse("Budynek nie istnieje", "NOT_FOUND", "Building not found"),
          409: errorResponse("Sala o tej nazwie już istnieje w budynku", "ALREADY_EXISTS", "Resource with this name already exists"),
        },
      },
    },
    "/api/rooms/{id}": {
      get: {
        tags: ["rooms"],
        summary: "Szczegóły sali",
        parameters: [idParam],
        responses: {
          200: json({ $ref: "#/components/schemas/Room" }),
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          404: errorResponse("Sala nie istnieje", "NOT_FOUND", "Room not found"),
        },
      },
    },
    "/api/reservations": {
      get: {
        tags: ["reservations"],
        summary: "Lista rezerwacji (USER widzi tylko swoje, ADMIN wszystkie)",
        parameters: [
          { name: "roomId", in: "query", schema: { type: "integer", minimum: 1 } },
          { name: "buildingId", in: "query", schema: { type: "integer", minimum: 1 } },
          { name: "userId", in: "query", description: "Tylko dla ADMIN, dla USER zwraca 403", schema: { type: "integer", minimum: 1 } },
          { name: "status", in: "query", schema: { type: "string", enum: ["CONFIRMED", "CANCELLED"] } },
          { name: "from", in: "query", description: "Rezerwacje kończące się po tej dacie", schema: { type: "string", format: "date-time" } },
          { name: "to", in: "query", description: "Rezerwacje zaczynające się przed tą datą", schema: { type: "string", format: "date-time" } },
          { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 20 } },
          {
            name: "sort",
            in: "query",
            schema: {
              type: "string",
              enum: ["startTime", "-startTime", "createdAt", "-createdAt", "participants", "-participants"],
              default: "startTime",
            },
          },
        ],
        responses: {
          200: json({ $ref: "#/components/schemas/ReservationList" }),
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: errorResponse("USER użył filtra userId", "FORBIDDEN", "Only ADMIN can filter reservations by userId"),
        },
      },
      post: {
        tags: ["reservations"],
        summary: "Nowa rezerwacja (użytkownik brany z tokenu)",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreateReservationRequest" } } },
        },
        responses: {
          201: json({ $ref: "#/components/schemas/Reservation" }, "Utworzona rezerwacja"),
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          404: errorResponse("Sala nie istnieje", "NOT_FOUND", "Room not found"),
          409: errorResponse(
            "Sala zajęta w tym czasie (ROOM_ALREADY_BOOKED) albo za mała (ROOM_CAPACITY_EXCEEDED)",
            "ROOM_ALREADY_BOOKED",
            "Room is already booked in this time"
          ),
        },
      },
    },
    "/api/reservations/{id}": {
      get: {
        tags: ["reservations"],
        summary: "Szczegóły rezerwacji (właściciel albo ADMIN)",
        parameters: [idParam],
        responses: {
          200: json({ $ref: "#/components/schemas/Reservation" }),
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          404: errorResponse("Rezerwacja nie istnieje albo należy do innego użytkownika", "NOT_FOUND", "Reservation not found"),
        },
      },
    },
    "/api/reservations/{id}/cancel": {
      patch: {
        tags: ["reservations"],
        summary: "Anulowanie rezerwacji (właściciel albo ADMIN)",
        parameters: [idParam],
        responses: {
          200: json({ $ref: "#/components/schemas/Reservation" }, "Anulowana rezerwacja"),
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          404: errorResponse("Rezerwacja nie istnieje albo należy do innego użytkownika", "NOT_FOUND", "Reservation not found"),
          409: errorResponse("Rezerwacja już się rozpoczęła", "RESERVATION_ALREADY_STARTED", "Reservation has already started"),
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    responses: {
      BadRequest: {
        description: "Niepoprawne dane wejściowe",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
            example: {
              error: {
                code: "VALIDATION_ERROR",
                message: "Validation failed",
                details: [{ location: "body", field: "password", message: "Too small: expected string to have >=10 characters" }],
                requestId: "8f81755f-0d5e-46af-907c-4aee63629d9a",
              },
            },
          },
        },
      },
      Unauthorized: errorResponse(
        "Brak tokenu, zły format nagłówka, niepoprawny token (INVALID_TOKEN) albo token wygasły (TOKEN_EXPIRED)",
        "UNAUTHORIZED",
        "Missing Authorization header"
      ),
      Forbidden: errorResponse("Brak uprawnień (wymagana rola ADMIN)", "FORBIDDEN", "You do not have permission to perform this action"),
    },
    schemas: {
      Error: {
        type: "object",
        required: ["error"],
        properties: {
          error: {
            type: "object",
            required: ["code", "message", "requestId"],
            properties: {
              code: { type: "string", example: "VALIDATION_ERROR" },
              message: { type: "string", example: "Validation failed" },
              details: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    location: { type: "string", enum: ["params", "query", "body"] },
                    field: { type: "string" },
                    message: { type: "string" },
                  },
                },
              },
              requestId: { type: "string", format: "uuid" },
            },
          },
        },
      },
      RegisterRequest: {
        type: "object",
        required: ["email", "password"],
        additionalProperties: false,
        properties: {
          email: { type: "string", format: "email", example: "jan.kowalski@example.com" },
          password: { type: "string", minLength: 10, maxLength: 72, example: "bardzo-dlugie-haslo" },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        additionalProperties: false,
        properties: {
          email: { type: "string", format: "email", example: "jan.kowalski@example.com" },
          password: { type: "string", maxLength: 72, example: "bardzo-dlugie-haslo" },
        },
      },
      Token: {
        type: "object",
        properties: {
          accessToken: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
          tokenType: { type: "string", example: "Bearer" },
          expiresIn: { type: "string", example: "15m" },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "integer", example: 2 },
          email: { type: "string", example: "jan.kowalski@example.com" },
          role: { type: "string", enum: ["USER", "ADMIN"] },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      CreateBuildingRequest: {
        type: "object",
        required: ["name", "address"],
        additionalProperties: false,
        properties: {
          name: { type: "string", minLength: 2, maxLength: 100, example: "Budynek D" },
          address: { type: "string", minLength: 5, maxLength: 200, example: "ul. Nowa 10, Kraków" },
        },
      },
      Building: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "Budynek A" },
          address: { type: "string", example: "ul. Warszawska 24, Kraków" },
          roomsCount: { type: "integer", example: 3 },
        },
      },
      CreateRoomRequest: {
        type: "object",
        required: ["buildingId", "name", "capacity"],
        additionalProperties: false,
        properties: {
          buildingId: { type: "integer", minimum: 1, example: 1 },
          name: { type: "string", minLength: 1, maxLength: 50, example: "301" },
          capacity: { type: "integer", minimum: 1, example: 25 },
        },
      },
      Room: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "101" },
          capacity: { type: "integer", example: 30 },
          building: {
            type: "object",
            properties: {
              id: { type: "integer", example: 1 },
              name: { type: "string", example: "Budynek A" },
            },
          },
        },
      },
      CreateReservationRequest: {
        type: "object",
        required: ["roomId", "participants", "startTime", "endTime"],
        additionalProperties: false,
        properties: {
          roomId: { type: "integer", minimum: 1, example: 1 },
          participants: { type: "integer", minimum: 1, example: 10 },
          startTime: { type: "string", format: "date-time", example: "2026-12-10T10:00:00Z" },
          endTime: { type: "string", format: "date-time", example: "2026-12-10T11:00:00Z" },
        },
      },
      Reservation: {
        type: "object",
        properties: {
          id: { type: "integer", example: 2 },
          room: {
            type: "object",
            properties: {
              id: { type: "integer", example: 1 },
              name: { type: "string", example: "101" },
              building: {
                type: "object",
                properties: {
                  id: { type: "integer", example: 1 },
                  name: { type: "string", example: "Budynek A" },
                },
              },
            },
          },
          user: {
            type: "object",
            properties: {
              id: { type: "integer", example: 3 },
              email: { type: "string", example: "jan.kowalski@example.com" },
            },
          },
          participants: { type: "integer", example: 10 },
          startTime: { type: "string", format: "date-time" },
          endTime: { type: "string", format: "date-time" },
          status: { type: "string", enum: ["CONFIRMED", "CANCELLED"] },
          createdAt: { type: "string", format: "date-time" },
          cancelledAt: { type: "string", format: "date-time", nullable: true },
        },
      },
      ReservationList: {
        type: "object",
        properties: {
          data: { type: "array", items: { $ref: "#/components/schemas/Reservation" } },
          meta: {
            type: "object",
            properties: {
              page: { type: "integer", example: 1 },
              limit: { type: "integer", example: 20 },
              total: { type: "integer", example: 5 },
              totalPages: { type: "integer", example: 1 },
            },
          },
        },
      },
    },
  },
};
