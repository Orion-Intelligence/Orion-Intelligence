from migrations.migration import migration_manager


async def main():
    migration_manager.get_instance().init_migratation()

if __name__ == "__main__":
    main()
