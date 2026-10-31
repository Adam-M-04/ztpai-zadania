const bcrypt = require("bcryptjs");
const { ConflictError } = require("../../errors/AppError");

const BCRYPT_ROUNDS = 12;

function createAuthService({ usersRepository }) {
  async function register(input) {
    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

    try {
      return await usersRepository.create({ email: input.email, passwordHash, role: "USER" });
    } catch (err) {
      if (err.code === "23505") {
        throw new ConflictError("Email is already taken", "EMAIL_TAKEN");
      }
      throw err;
    }
  }

  return { register };
}

module.exports = { createAuthService };
