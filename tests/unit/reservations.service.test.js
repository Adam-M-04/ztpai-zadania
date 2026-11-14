const { createReservationsService } = require("../../src/modules/reservations/reservations.service");
const {
  createMemoryRoomsRepository,
  createMemoryReservationsRepository,
  createMemoryTransaction,
} = require("../support/memoryRepositories");

const NOW = new Date("2026-11-30T12:00:00.000Z");

const owner = { id: 1, role: "USER" };
const otherUser = { id: 2, role: "USER" };
const admin = { id: 3, role: "ADMIN" };

const rooms = [
  { id: 1, name: "101", capacity: 10 },
  { id: 2, name: "102", capacity: 20 },
];

function at(time) {
  return `2026-12-01T${time}:00.000Z`;
}

function reservation(overrides = {}) {
  return {
    id: 1,
    roomId: 1,
    userId: owner.id,
    participants: 5,
    startTime: new Date(at("10:00")),
    endTime: new Date(at("12:00")),
    status: "CONFIRMED",
    createdAt: NOW,
    cancelledAt: null,
    ...overrides,
  };
}

function setup(reservations = []) {
  const clock = { current: NOW };
  const roomsRepository = createMemoryRoomsRepository(rooms);
  const reservationsRepository = createMemoryReservationsRepository(reservations);

  const service = createReservationsService({
    reservationsRepository,
    runInTransaction: createMemoryTransaction({ roomsRepository, reservationsRepository }),
    now: () => clock.current,
  });

  return { service, reservationsRepository, clock };
}

function input(start, end, overrides = {}) {
  return { roomId: 1, participants: 5, startTime: at(start), endTime: at(end), ...overrides };
}

describe("createReservation - overlapping", () => {
  test.each([
    ["partial overlap at the start", "09:00", "11:00"],
    ["partial overlap at the end", "11:00", "13:00"],
    ["inside existing reservation", "10:30", "11:30"],
    ["containing existing reservation", "09:00", "13:00"],
    ["exactly the same time", "10:00", "12:00"],
  ])("rejects %s", async (_, start, end) => {
    const { service } = setup([reservation()]);

    await expect(service.createReservation(input(start, end), otherUser)).rejects.toMatchObject({
      code: "ROOM_ALREADY_BOOKED",
    });
  });

  test.each([
    ["ending when existing starts", "08:00", "10:00"],
    ["starting when existing ends", "12:00", "13:00"],
  ])("allows reservation %s", async (_, start, end) => {
    const { service } = setup([reservation()]);

    const created = await service.createReservation(input(start, end), otherUser);

    expect(created.status).toBe("CONFIRMED");
  });

  test("allows the same time in another room", async () => {
    const { service } = setup([reservation()]);

    const created = await service.createReservation(input("10:00", "12:00", { roomId: 2 }), otherUser);

    expect(created.roomId).toBe(2);
  });

  test("cancelled reservation does not block the time slot", async () => {
    const { service } = setup([reservation({ status: "CANCELLED", cancelledAt: NOW })]);

    const created = await service.createReservation(input("10:00", "12:00"), otherUser);

    expect(created.status).toBe("CONFIRMED");
  });
});

describe("createReservation - other rules", () => {
  test("saves reservation for current user with time from injected clock", async () => {
    const { service, reservationsRepository } = setup();

    const created = await service.createReservation(input("10:00", "12:00"), owner);

    expect(created).toMatchObject({ userId: owner.id, status: "CONFIRMED", createdAt: NOW, cancelledAt: null });
    expect(await reservationsRepository.findById(created.id)).toMatchObject({ userId: owner.id });
  });

  test("allows participants equal to room capacity", async () => {
    const { service } = setup();

    const created = await service.createReservation(input("10:00", "12:00", { participants: 10 }), owner);

    expect(created.participants).toBe(10);
  });

  test("rejects participants above room capacity", async () => {
    const { service } = setup();

    await expect(
      service.createReservation(input("10:00", "12:00", { participants: 11 }), owner)
    ).rejects.toMatchObject({ code: "ROOM_CAPACITY_EXCEEDED" });
  });

  test.each([
    ["15 minutes", "10:00", "10:15"],
    ["8 hours", "10:00", "18:00"],
  ])("allows reservation lasting exactly %s", async (_, start, end) => {
    const { service } = setup();

    const created = await service.createReservation(input(start, end), owner);

    expect(created.status).toBe("CONFIRMED");
  });

  test.each([
    ["14 minutes", "10:00", "10:14"],
    ["8 hours 1 minute", "10:00", "18:01"],
  ])("rejects reservation lasting %s", async (_, start, end) => {
    const { service } = setup();

    await expect(service.createReservation(input(start, end), owner)).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });
  });

  test("rejects reservation starting in the past", async () => {
    const { service, clock } = setup();
    clock.current = new Date(at("10:30"));

    await expect(service.createReservation(input("10:00", "12:00"), owner)).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });
  });

  test("rejects reservation for not existing room", async () => {
    const { service } = setup();

    await expect(
      service.createReservation(input("10:00", "12:00", { roomId: 99 }), owner)
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("cancelReservation", () => {
  test("owner can cancel future reservation", async () => {
    const { service } = setup([reservation()]);

    const cancelled = await service.cancelReservation(1, owner);

    expect(cancelled).toMatchObject({ status: "CANCELLED", cancelledAt: NOW });
  });

  test("rejects cancelling reservation that already started", async () => {
    const { service, clock } = setup([reservation()]);
    clock.current = new Date(at("11:00"));

    await expect(service.cancelReservation(1, owner)).rejects.toMatchObject({
      code: "RESERVATION_ALREADY_STARTED",
    });
  });

  test("second cancel is idempotent and keeps cancelledAt", async () => {
    const { service, clock } = setup([reservation()]);

    const first = await service.cancelReservation(1, owner);
    clock.current = new Date("2026-11-30T15:00:00.000Z");
    const second = await service.cancelReservation(1, owner);

    expect(second.status).toBe("CANCELLED");
    expect(second.cancelledAt).toEqual(first.cancelledAt);
  });

  test("other USER cannot cancel someone else's reservation", async () => {
    const { service, reservationsRepository } = setup([reservation()]);

    await expect(service.cancelReservation(1, otherUser)).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect((await reservationsRepository.findById(1)).status).toBe("CONFIRMED");
  });

  test("ADMIN can cancel someone else's reservation", async () => {
    const { service } = setup([reservation()]);

    const cancelled = await service.cancelReservation(1, admin);

    expect(cancelled.status).toBe("CANCELLED");
  });
});

describe("getReservation - ownership", () => {
  test("owner gets own reservation", async () => {
    const { service } = setup([reservation()]);

    const found = await service.getReservation(1, owner);

    expect(found.id).toBe(1);
  });

  test("other USER gets NOT_FOUND for someone else's reservation", async () => {
    const { service } = setup([reservation()]);

    await expect(service.getReservation(1, otherUser)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  test("ADMIN gets someone else's reservation", async () => {
    const { service } = setup([reservation()]);

    const found = await service.getReservation(1, admin);

    expect(found.userId).toBe(owner.id);
  });
});
