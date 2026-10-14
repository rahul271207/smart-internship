import { MongoClient } from "mongodb";
import { config } from "./config.js";

// Global cache for Next.js hot-reloading
let globalClient = globalThis._mongoClient || null;
let memoryStore = globalThis._memoryDbStore || null;

class MemoryCursor {
  constructor(items) {
    this._items = [...items];
  }

  sort(sortObj) {
    if (!sortObj) return this;
    const entries = Object.entries(sortObj);
    this._items.sort((a, b) => {
      for (const [key, dir] of entries) {
        const valA = getNestedValue(a, key);
        const valB = getNestedValue(b, key);
        if (valA === valB) continue;
        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;
        const comp = valA > valB ? 1 : -1;
        return dir === -1 ? -comp : comp;
      }
      return 0;
    });
    return this;
  }

  skip(n) {
    if (n > 0) this._items = this._items.slice(n);
    return this;
  }

  limit(n) {
    if (n > 0) this._items = this._items.slice(0, n);
    return this;
  }

  async toArray() {
    return this._items.map((doc) => JSON.parse(JSON.stringify(doc)));
  }

  // Allow awaiting directly
  then(resolve, reject) {
    return this.toArray().then(resolve, reject);
  }
}

function getNestedValue(obj, path) {
  if (!obj || typeof obj !== "object") return undefined;
  if (!path.includes(".")) return obj[path];
  const parts = path.split(".");
  let cur = obj;
  for (const p of parts) {
    if (cur === null || cur === undefined) return undefined;
    cur = cur[p];
  }
  return cur;
}

function matchFilter(doc, filter) {
  if (!filter || Object.keys(filter).length === 0) return true;
  for (const [key, expected] of Object.entries(filter)) {
    const val = getNestedValue(doc, key);
    if (expected && typeof expected === "object" && !Array.isArray(expected)) {
      if ("$in" in expected) {
        const arr = expected.$in;
        if (!arr.includes(val)) return false;
      } else if ("$regex" in expected) {
        const reg = new RegExp(expected.$regex, expected.$options || "");
        if (!reg.test(String(val || ""))) return false;
      } else if ("$exists" in expected) {
        const exists = val !== undefined;
        if (exists !== Boolean(expected.$exists)) return false;
      } else {
        if (JSON.stringify(val) !== JSON.stringify(expected)) return false;
      }
    } else {
      if (val !== expected && String(val) !== String(expected)) return false;
    }
  }
  return true;
}

class MemoryCollection {
  constructor(name, getDocs, setDocs) {
    this.name = name;
    this.getDocs = getDocs;
    this.setDocs = setDocs;
  }

  find(filter = {}) {
    const docs = this.getDocs().filter((d) => matchFilter(d, filter));
    return new MemoryCursor(docs);
  }

  async findOne(filter = {}, options = {}) {
    let docs = this.getDocs().filter((d) => matchFilter(d, filter));
    if (options.sort) {
      docs = await new MemoryCursor(docs).sort(options.sort).toArray();
    }
    const found = docs[0];
    return found ? JSON.parse(JSON.stringify(found)) : null;
  }

  async insertOne(doc) {
    const copy = JSON.parse(JSON.stringify(doc));
    if (!copy._id) {
      copy._id = "doc_" + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    }
    const docs = this.getDocs();
    docs.push(copy);
    this.setDocs(docs);
    return { insertedId: copy._id, acknowledged: true };
  }

  async insertMany(docs) {
    const insertedIds = {};
    const list = this.getDocs();
    for (let i = 0; i < docs.length; i++) {
      const copy = JSON.parse(JSON.stringify(docs[i]));
      if (!copy._id) {
        copy._id = "doc_" + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
      }
      list.push(copy);
      insertedIds[i] = copy._id;
    }
    this.setDocs(list);
    return { insertedIds, acknowledged: true };
  }

  async updateOne(filter, update, options = {}) {
    const docs = this.getDocs();
    let index = docs.findIndex((d) => matchFilter(d, filter));
    if (index === -1) {
      if (options.upsert) {
        const newDoc = { ...filter };
        if (update.$setOnInsert) Object.assign(newDoc, update.$setOnInsert);
        if (update.$set) Object.assign(newDoc, update.$set);
        if (!newDoc._id) {
          newDoc._id = "doc_" + Math.random().toString(36).substring(2, 11);
        }
        docs.push(newDoc);
        this.setDocs(docs);
        return { matchedCount: 0, modifiedCount: 1, upsertedId: newDoc._id };
      }
      return { matchedCount: 0, modifiedCount: 0 };
    }

    const current = docs[index];
    if (update.$set) {
      for (const [k, v] of Object.entries(update.$set)) {
        if (k.includes(".")) {
          const parts = k.split(".");
          let cur = current;
          for (let p = 0; p < parts.length - 1; p++) {
            cur[parts[p]] = cur[parts[p]] || {};
            cur = cur[parts[p]];
          }
          cur[parts[parts.length - 1]] = v;
        } else {
          current[k] = v;
        }
      }
    }
    this.setDocs(docs);
    return { matchedCount: 1, modifiedCount: 1 };
  }

  async deleteMany(filter = {}) {
    const before = this.getDocs();
    const remaining = before.filter((d) => !matchFilter(d, filter));
    this.setDocs(remaining);
    return { deletedCount: before.length - remaining.length, acknowledged: true };
  }

  async countDocuments(filter = {}) {
    return this.getDocs().filter((d) => matchFilter(d, filter)).length;
  }
}

class MemoryDatabase {
  constructor() {
    this.collections = {};
  }

  collection(name) {
    if (!this.collections[name]) {
      this.collections[name] = [];
    }
    return new MemoryCollection(
      name,
      () => this.collections[name],
      (newDocs) => {
        this.collections[name] = newDocs;
      }
    );
  }

  // Direct properties like db.users
  get users() { return this.collection("users"); }
  get students() { return this.collection("students"); }
  get organizations() { return this.collection("organizations"); }
  get internships() { return this.collection("internships"); }
  get applications() { return this.collection("applications"); }
  get allocations() { return this.collection("allocations"); }
  get allocation_rounds() { return this.collection("allocation_rounds"); }
  get audit_logs() { return this.collection("audit_logs"); }
  get system_config() { return this.collection("system_config"); }
  get resume_jobs() { return this.collection("resume_jobs"); }
}

export async function getDb() {
  if (config.useMemoryDb) {
    if (!memoryStore) {
      memoryStore = new MemoryDatabase();
      globalThis._memoryDbStore = memoryStore;
    }
    return memoryStore;
  }

  try {
    if (!globalClient) {
      globalClient = new MongoClient(config.mongodbUri, { serverSelectionTimeoutMS: 3000 });
      await globalClient.connect();
      globalThis._mongoClient = globalClient;
    }
    const realDb = globalClient.db(config.mongodbDbName);
    // Wrap to provide direct collections (e.g. db.users)
    return new Proxy(realDb, {
      get(target, prop) {
        if (typeof target[prop] === "function") {
          return target[prop].bind(target);
        }
        if (typeof prop === "string" && !prop.startsWith("_") && !(prop in target)) {
          return target.collection(prop);
        }
        return target[prop];
      },
    });
  } catch (err) {
    console.warn("MongoDB connection failed, falling back to in-memory database store:", err.message);
    if (!memoryStore) {
      memoryStore = new MemoryDatabase();
      globalThis._memoryDbStore = memoryStore;
    }
    return memoryStore;
  }
}

export async function pingDatabase() {
  const isMem = config.useMemoryDb || !globalClient;
  return {
    reachable: true,
    mode: isMem ? "memory" : "mongodb",
    database: config.mongodbDbName,
  };
}

export const getDatabase = getDb;
export default getDb;
