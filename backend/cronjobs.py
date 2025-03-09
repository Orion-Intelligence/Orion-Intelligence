import asyncio
from orion.management.managers.service_manager import service_manager

async def main():
    manager = service_manager.get_instance()
    print("xx2")
    await manager.init_services()
    print("xx3")
    await manager.init_cronjobs()

    while True:
        await asyncio.sleep(3600)

if __name__ == "__main__":
    print("xx1")
    asyncio.run(main())
