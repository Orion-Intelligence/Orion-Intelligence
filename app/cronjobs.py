import asyncio
from backend.management.managers.service_manager import service_manager

async def main():
    manager = service_manager.get_instance()
    await manager.init_services()
    await manager.init_cronjobs()

    while True:
        await asyncio.sleep(3600)

if __name__ == "__main__":
    asyncio.run(main())
