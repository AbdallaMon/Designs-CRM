import bcrypt from "bcrypt";

class HashService {
  static #SALT_ROUNDS = 8;

  static hash(plaintext) {
    return bcrypt.hash(plaintext, HashService.#SALT_ROUNDS);
  }

  static compare(plaintext, hashed) {
    return bcrypt.compare(plaintext, hashed);
  }
}

export { HashService };
