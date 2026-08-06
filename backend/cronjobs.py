import asyncio
import os

from orion.management.managers.service_manager import service_manager


async def main():
    if os.getenv("TESTING_ENABLED", "0") == "1":
        return

    manager = service_manager.get_instance()
    await manager.init_services(run_migrations=False)
    await manager.init_cronjobs()

    while True:
        await asyncio.sleep(3600)


if __name__ == "__main__":
    asyncio.run(main())
