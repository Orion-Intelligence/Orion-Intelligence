export function createCyController<T extends Record<string, (...args: any[]) => any>>(controller: T): T {
  return controller;
}
