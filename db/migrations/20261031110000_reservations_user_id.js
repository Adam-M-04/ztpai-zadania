const crypto = require("node:crypto");
const bcrypt = require("bcryptjs");

function emailFromName(name, index) {
  if (/^\S+@\S+$/.test(name)) {
    return name.toLowerCase();
  }

  const slug = name
    .replace(/ł/g, "l")
    .replace(/Ł/g, "L")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");

  return `${slug || `user${index}`}@example.com`;
}

exports.up = async function (knex) {
  await knex.schema.alterTable("reservations", (table) => {
    table.integer("user_id").references("id").inTable("users").onDelete("RESTRICT");
  });

  const names = await knex("reservations").distinct("reserved_by").orderBy("reserved_by");

  for (let i = 0; i < names.length; i++) {
    const name = names[i].reserved_by;
    const email = emailFromName(name, i + 1);

    let user = await knex("users").where({ email }).first();

    if (!user) {
      const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 12);
      [user] = await knex("users").insert({ email, password_hash: passwordHash, role: "USER" }).returning("*");
    }

    await knex("reservations").where({ reserved_by: name }).update({ user_id: user.id });
  }

  await knex.schema.alterTable("reservations", (table) => {
    table.dropNullable("user_id");
    table.index(["user_id"], "reservations_user_id_idx");
    table.dropColumn("reserved_by");
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable("reservations", (table) => {
    table.string("reserved_by", 100);
  });

  await knex.raw("UPDATE reservations res SET reserved_by = u.email FROM users u WHERE u.id = res.user_id");

  await knex.schema.alterTable("reservations", (table) => {
    table.dropNullable("reserved_by");
    table.dropIndex(["user_id"], "reservations_user_id_idx");
    table.dropColumn("user_id");
  });
};
