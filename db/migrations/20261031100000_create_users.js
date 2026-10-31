exports.up = function (knex) {
  return knex.schema.createTable("users", (table) => {
    table.increments("id");
    table.string("email", 254).notNullable().unique();
    table.string("password_hash", 60).notNullable();
    table.string("role", 20).notNullable().defaultTo("USER");
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.check("role in ('USER', 'ADMIN')", [], "users_role_check");
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("users");
};
