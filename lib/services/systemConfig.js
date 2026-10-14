import { getDb } from "../db.js";
import { DEFAULT_WEIGHTS, validateWeights } from "./matching.js";
import { createAllocationPolicy } from "./allocation.js";

export async function getMatchingConfig() {
  const db = await getDb();
  const doc = await db.system_config.findOne({ key: "matching_weights" });
  const weights = (doc && doc.value) || DEFAULT_WEIGHTS;
  return {
    weights: validateWeights(weights),
    updated_at: doc && doc.updated_at,
  };
}

export async function setMatchingConfig(weights, actorId) {
  const validated = validateWeights(weights);
  const db = await getDb();
  await db.system_config.updateOne(
    { key: "matching_weights" },
    {
      $set: {
        key: "matching_weights",
        value: validated,
        updated_at: new Date().toISOString(),
        updated_by: actorId,
      },
      $setOnInsert: { _id: "cfg_weights" },
    },
    { upsert: true }
  );
  return { weights: validated };
}

export async function getAllocationPolicyConfig() {
  const db = await getDb();
  const doc = await db.system_config.findOne({ key: "allocation_policy" });
  return createAllocationPolicy(doc && doc.value);
}

export async function setAllocationPolicyConfig(payload, actorId) {
  const policy = createAllocationPolicy(payload);
  const db = await getDb();
  await db.system_config.updateOne(
    { key: "allocation_policy" },
    {
      $set: {
        key: "allocation_policy",
        value: policy,
        updated_at: new Date().toISOString(),
        updated_by: actorId,
      },
      $setOnInsert: { _id: "cfg_policy" },
    },
    { upsert: true }
  );
  return policy;
}
