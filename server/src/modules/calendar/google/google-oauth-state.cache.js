import { createHash, randomBytes } from "node:crypto";
import redisClient from "../../../infra/redis/redis.client.js";

const GOOGLE_OAUTH_STATE_TTL_SECONDS = 10 * 60;
const STATE_PATTERN = /^[A-Za-z0-9_-]{32,128}$/;

const CONSUME_STATE_SCRIPT = `
local storedUserId = redis.call("GET", KEYS[1])
if not storedUserId then
  return 0
end
if storedUserId ~= ARGV[1] then
  return -1
end
redis.call("DEL", KEYS[1])
return 1
`;

function stateKey(state) {
  const digest = createHash("sha256").update(state).digest("hex");
  return `google:oauth:state:${digest}`;
}

export async function issueGoogleOAuthState({ userId }) {
  const state = randomBytes(32).toString("base64url");
  await redisClient.set(stateKey(state), String(Number(userId)), {
    EX: GOOGLE_OAUTH_STATE_TTL_SECONDS,
  });
  return state;
}

export async function consumeGoogleOAuthState({ state, userId }) {
  if (typeof state !== "string" || !STATE_PATTERN.test(state)) return false;

  const result = await redisClient.eval(CONSUME_STATE_SCRIPT, {
    keys: [stateKey(state)],
    arguments: [String(Number(userId))],
  });

  return Number(result) === 1;
}

export { GOOGLE_OAUTH_STATE_TTL_SECONDS };
