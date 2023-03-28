import { v4 as uuidv4 } from "uuid";

/**
 * Provides a simple API for generating duplication-proof uuidv4 unique strings from the time of creating the 
 * instance of this class
 */
class UUID {
  _generated = new Set();

  /**
   * generates a new uuid and stores it in the history of generated uuids to avoid duplication in
   * the next generation process
   * @returns {string} a newly generated uuid string
   */
  generate() {
    const size = this._generated.size;
    let uuid = "";

    while (size === this._generated.size) {
      uuid = uuidv4();
      this._generated.add(uuid);
    }

    return uuid;
  }

  /**
   * removes the given uuid from the history of generated uuids
   * @param {string} uuid
   */
  delete(uuid) {
    this._generated.delete(uuid);
  }

  /**
   *clears the history of generated uuids
   */
  clear() {
    this._generated.clear();
  }
}

export const duuid = new UUID();
