import { environment } from "../config/environment.js";
import { HealthRepository, type HealthRecord } from "../repositories/health.repository.js";

export interface HealthResponse extends HealthRecord {
  service: string;
}

export class HealthService {
  constructor(private readonly healthRepository = new HealthRepository()) {}

  getHealth(): HealthResponse {
    return {
      ...this.healthRepository.readCurrentStatus(),
      service: environment.apiName
    };
  }
}
