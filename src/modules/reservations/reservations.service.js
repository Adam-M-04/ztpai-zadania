const { NotFoundError, ConflictError, ValidationError } = require("../../errors/AppError");

const MIN_DURATION = 15 * 60 * 1000;
const MAX_DURATION = 8 * 60 * 60 * 1000;

const ALLOWED_TRANSITIONS = {
  CONFIRMED: ["CANCELLED"],
  CANCELLED: [],
};

function createReservationsService({ reservationsRepository, runInTransaction, now = () => new Date() }) {
  async function listReservations(filters) {
    const { data, total } = await reservationsRepository.findAll(filters);

    return {
      data,
      meta: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      },
    };
  }

  async function getReservation(id) {
    const reservation = await reservationsRepository.findById(id);

    if (!reservation) {
      throw new NotFoundError("Reservation");
    }

    return reservation;
  }

  async function createReservation(input) {
    return runInTransaction(async ({ roomsRepository, reservationsRepository }) => {
      const room = await roomsRepository.findByIdForUpdate(input.roomId);

      if (!room) {
        throw new NotFoundError("Room");
      }

      const start = new Date(input.startTime).getTime();
      const end = new Date(input.endTime).getTime();

      if (end <= start) {
        throw new ValidationError([
          { location: "body", field: "endTime", message: "endTime must be later than startTime" },
        ]);
      }

      if (end - start < MIN_DURATION || end - start > MAX_DURATION) {
        throw new ValidationError([
          { location: "body", field: "endTime", message: "Reservation must last from 15 minutes to 8 hours" },
        ]);
      }

      if (start < now().getTime()) {
        throw new ValidationError([
          { location: "body", field: "startTime", message: "startTime cannot be in the past" },
        ]);
      }

      if (input.participants > room.capacity) {
        throw new ConflictError("Room capacity exceeded", "ROOM_CAPACITY_EXCEEDED");
      }

      const active = await reservationsRepository.findByRoomAndStatus(room.id, "CONFIRMED");
      const overlapping = active.find((r) => start < r.endTime.getTime() && r.startTime.getTime() < end);

      if (overlapping) {
        throw new ConflictError("Room is already booked in this time", "ROOM_ALREADY_BOOKED");
      }

      return reservationsRepository.create({
        roomId: room.id,
        reservedBy: input.reservedBy,
        participants: input.participants,
        startTime: new Date(start),
        endTime: new Date(end),
        status: "CONFIRMED",
        createdAt: now(),
        cancelledAt: null,
        internalNote: "created via API v2",
      });
    });
  }

  async function cancelReservation(id) {
    const reservation = await getReservation(id);

    if (reservation.status === "CANCELLED") {
      return reservation;
    }

    if (!ALLOWED_TRANSITIONS[reservation.status].includes("CANCELLED")) {
      throw new ConflictError(
        `Cannot change status from ${reservation.status} to CANCELLED`,
        "INVALID_STATUS_TRANSITION"
      );
    }

    if (reservation.startTime.getTime() <= now().getTime()) {
      throw new ConflictError("Reservation has already started", "RESERVATION_ALREADY_STARTED");
    }

    return reservationsRepository.update(id, { status: "CANCELLED", cancelledAt: now() });
  }

  return { listReservations, getReservation, createReservation, cancelReservation };
}

module.exports = { createReservationsService };
