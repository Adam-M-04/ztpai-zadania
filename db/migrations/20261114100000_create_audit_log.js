exports.up = function (knex) {
  return knex.schema.createTable("audit_log", (table) => {
    table.increments("id");
    table.string("event_type", 100).notNullable();
    table.jsonb("payload").notNullable();
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(["event_type"]);
    table.index(["created_at"]);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("audit_log");
};
