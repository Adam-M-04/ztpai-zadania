const columns = {
  roomId: "room_id",
  userId: "user_id",
  participants: "participants",
  startTime: "start_time",
  endTime: "end_time",
  status: "status",
  createdAt: "created_at",
  cancelledAt: "cancelled_at",
};

const sortColumns = {
  startTime: "res.start_time",
  createdAt: "res.created_at",
  participants: "res.participants",
};

function toReservation(row) {
  return {
    id: row.id,
    roomId: row.room_id,
    userId: row.user_id,
    participants: row.participants,
    startTime: row.start_time,
    endTime: row.end_time,
    status: row.status,
    createdAt: row.created_at,
    cancelledAt: row.cancelled_at,
    room: {
      id: row.room_id,
      name: row.room_name,
      building: { id: row.building_id, name: row.building_name },
    },
    user: { id: row.user_id, email: row.user_email },
  };
}

function toRow(data) {
  const row = {};
  for (const key of Object.keys(data)) {
    if (columns[key]) {
      row[columns[key]] = data[key];
    }
  }
  return row;
}

function selectReservations(db) {
  return db("reservations as res")
    .join("rooms as r", "r.id", "res.room_id")
    .join("buildings as b", "b.id", "r.building_id")
    .join("users as u", "u.id", "res.user_id")
    .select("res.*", "r.name as room_name", "b.id as building_id", "b.name as building_name", "u.email as user_email");
}

function applyFilters(query, filters) {
  if (filters.roomId !== undefined) {
    query.where("res.room_id", filters.roomId);
  }
  if (filters.buildingId !== undefined) {
    query.where("r.building_id", filters.buildingId);
  }
  if (filters.status !== undefined) {
    query.where("res.status", filters.status);
  }
  if (filters.from !== undefined) {
    query.where("res.end_time", ">", filters.from);
  }
  if (filters.to !== undefined) {
    query.where("res.start_time", "<", filters.to);
  }
  return query;
}

function createReservationsRepository(db) {
  async function findById(id) {
    const row = await selectReservations(db).where("res.id", id).first();
    return row ? toReservation(row) : null;
  }

  return {
    async findAll(filters) {
      const desc = filters.sort.startsWith("-");
      const column = sortColumns[desc ? filters.sort.slice(1) : filters.sort];

      const rows = await applyFilters(selectReservations(db), filters)
        .orderBy(column, desc ? "desc" : "asc")
        .orderBy("res.id", "asc")
        .limit(filters.limit)
        .offset((filters.page - 1) * filters.limit);

      const [{ count }] = await applyFilters(
        db("reservations as res").join("rooms as r", "r.id", "res.room_id"),
        filters
      ).count("res.id as count");

      return { data: rows.map(toReservation), total: Number(count) };
    },

    findById,

    async findByRoomAndStatus(roomId, status) {
      const rows = await selectReservations(db).where({ "res.room_id": roomId, "res.status": status });
      return rows.map(toReservation);
    },

    async create(data) {
      const [row] = await db("reservations").insert(toRow(data)).returning("id");
      return findById(row.id);
    },

    async update(id, changes) {
      await db("reservations").where({ id }).update(toRow(changes));
      return findById(id);
    },
  };
}

module.exports = { createReservationsRepository };
