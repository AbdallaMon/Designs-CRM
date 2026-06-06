import { redisService } from "../../../infra/redis/cache.service.js";

export class TelegramAuthCache {
  static checkIfCurrentTeleStatusExist({ key }) {
    return redisService.exists(key);
  }
  static getCurrentTeleStatus({ key }) {
    return redisService.get(key);
  }
  static createNewTeleStatus({ key, data, expireIn }) {
    return redisService.set(key, data, expireIn);
  }
  static updateCurrentTeleStatus({ key, data, expireIn }) {
    return redisService.update(key, data, expireIn);
  }
  static deleteCurrentTeleStatus({ key }) {
    return redisService.del(key);
  }
}
