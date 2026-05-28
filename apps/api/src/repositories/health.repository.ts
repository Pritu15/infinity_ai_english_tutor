export interface HealthRecord {
  checkedAt: string;
  status: "ok";
}

export class HealthRepository {
  readCurrentStatus(): HealthRecord {
    return {
      checkedAt: new Date().toISOString(),
      status: "ok"
    };
  }
}
