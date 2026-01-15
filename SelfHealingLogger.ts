export class SelfHealingLogger {
  static log(type: string, message: string, status: string) {
    console.log(`[${type}] ${status}: ${message}`);
  }
}
