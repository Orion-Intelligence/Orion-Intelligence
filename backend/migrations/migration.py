class migration_manager:
  __instance = None

  @staticmethod
  def get_instance():
    if migration_manager.__instance is None:
      migration_manager()
    return migration_manager.__instance

  @staticmethod
  def init_migratation():
    print(":::::::::::::::::::::::::::::::::", flush=True)
    print(":::::::::::::::::::::::::::::::::", flush=True)
    print(":::::::::::::::::::::::::::::::::", flush=True)
    print(":::::::::::::::::::::::::::::::::", flush=True)
    print(":::::::::::::::::::::::::::::::::", flush=True)
    print(":::::::::::::::::::::::::::::::::", flush=True)
