exports.up = function (knex) {
  return knex.schema.createTable("rooms", (table) => {
    table.increments("id");
    table.integer("building_id").notNullable().references("id").inTable("buildings").onDelete("RESTRICT");
    table.string("name", 50).notNullable();
    table.integer("capacity").notNullable();
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.unique(["building_id", "name"]);
    table.check("capacity > 0", [], "rooms_capacity_check");
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("rooms");
};
