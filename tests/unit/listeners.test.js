const { createAuditLogListener } = require("../../src/modules/audit-log/audit-log.listener");
const { createCancelNotificationListener } = require("../../src/modules/notifications/notifications.listener");

const users = [
  { id: 1, email: "jan@example.com", role: "USER" },
  { id: 2, email: "anna@example.com", role: "USER" },
  { id: 3, email: "admin@example.com", role: "ADMIN" },
];

function usersRepository() {
  return { findById: jest.fn(async (id) => users.find((u) => u.id === id) || null) };
}

describe("audit log listener", () => {
  test("saves event type and payload", async () => {
    const auditLogRepository = { create: jest.fn() };
    const listener = createAuditLogListener({ auditLogRepository });
    const payload = { reservationId: 5, roomId: 1, userId: 1, cancelledBy: 3 };

    await listener(payload, "reservation.cancelled");

    expect(auditLogRepository.create).toHaveBeenCalledWith({ eventType: "reservation.cancelled", payload });
  });
});

describe("cancel notification listener", () => {
  let log;

  beforeEach(() => {
    log = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    log.mockRestore();
  });

  test("notifies owner when ADMIN cancels their reservation", async () => {
    const listener = createCancelNotificationListener({ usersRepository: usersRepository() });

    await listener({ reservationId: 5, roomId: 1, userId: 1, cancelledBy: 3 });

    expect(log).toHaveBeenCalledTimes(1);
    expect(log.mock.calls[0][0]).toMatch(/^\[notification\] to: jan@example\.com /);
  });

  test("does not notify when owner cancels own reservation", async () => {
    const repository = usersRepository();
    const listener = createCancelNotificationListener({ usersRepository: repository });

    await listener({ reservationId: 5, roomId: 1, userId: 1, cancelledBy: 1 });

    expect(log).not.toHaveBeenCalled();
    expect(repository.findById).not.toHaveBeenCalled();
  });

  test("does not notify when canceller is not ADMIN", async () => {
    const listener = createCancelNotificationListener({ usersRepository: usersRepository() });

    await listener({ reservationId: 5, roomId: 1, userId: 1, cancelledBy: 2 });

    expect(log).not.toHaveBeenCalled();
  });
});
