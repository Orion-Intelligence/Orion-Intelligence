import asyncio

from migrations.migration import migration_manager
from orion.management.managers.service_manager import service_manager


async def main():
    manager = service_manager.get_instance()
    await manager.init_services()
    await manager.init_cronjobs()
    await migration_manager.get_instance().init_migration()

    while True:
        await asyncio.sleep(3600)


if __name__ == "__main__":
    asyncio.run(main())
