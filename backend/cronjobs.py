import asyncio

from migrations.migration import migration_manager
from orion.management.managers.service_manager import service_manager


async def main():
    print("::::::::::::::::::::::::::::::::::::: start1", flush=True)
    manager = service_manager.get_instance()
    print("::::::::::::::::::::::::::::::::::::: start2", flush=True)
    await manager.init_services()
    print("::::::::::::::::::::::::::::::::::::: start3", flush=True)
    await manager.init_cronjobs()
    print("::::::::::::::::::::::::::::::::::::: start4", flush=True)
    await migration_manager.get_instance().init_migration()
    print("::::::::::::::::::::::::::::::::::::: start5", flush=True)

    while True:
        await asyncio.sleep(3600)


if __name__ == "__main__":
    asyncio.run(main())
