function toBuilding(row) {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    createdAt: row.created_at,
    roomsCount: Number(row.rooms_count ?? 0),
  };
}

function selectBuildings(db) {
  return db("buildings as b")
    .leftJoin("rooms as r", "r.building_id", "b.id")
    .select("b.*")
    .count("r.id as rooms_count")
    .groupBy("b.id");
}

function createBuildingsRepository(db) {
  return {
    async findAll() {
      const rows = await selectBuildings(db).orderBy("b.id");
      return rows.map(toBuilding);
    },

    async findById(id) {
      const row = await selectBuildings(db).where("b.id", id).first();
      return row ? toBuilding(row) : null;
    },

    async create(data) {
      const [row] = await db("buildings")
        .insert({ name: data.name, address: data.address })
        .returning("*");
      return toBuilding(row);
    },
  };
}

module.exports = { createBuildingsRepository };
