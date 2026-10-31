const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../../config");
const { ConflictError, UnauthorizedError } = require("../../errors/AppError");

const BCRYPT_ROUNDS = 12;
const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing", BCRYPT_ROUNDS);

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

  async function login(input) {
    const user = await usersRepository.findByEmail(input.email);
    const passwordOk = await bcrypt.compare(input.password, user ? user.passwordHash : DUMMY_HASH);

    if (!user || !passwordOk) {
      throw new UnauthorizedError("Invalid email or password", "INVALID_CREDENTIALS");
    }

    const accessToken = jwt.sign({ role: user.role }, config.jwt.secret, {
      algorithm: "HS256",
      subject: String(user.id),
      expiresIn: config.jwt.expiresIn,
    });

    return { accessToken, tokenType: "Bearer", expiresIn: config.jwt.expiresIn };
  }

  async function getCurrentUser(currentUser) {
    const user = await usersRepository.findById(currentUser.id);

    if (!user) {
      throw new UnauthorizedError("User no longer exists");
    }

    return user;
  }

  return { register, login, getCurrentUser };
}

module.exports = { createAuthService };
