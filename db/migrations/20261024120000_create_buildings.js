exports.up = function (knex) {
  return knex.schema.createTable("buildings", (table) => {
    table.increments("id");
    table.string("name", 100).notNullable().unique();
    table.string("address", 200).notNullable();
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("buildings");
};
