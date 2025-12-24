from orion.helper_manager.env_handler import env_handler


class MONGO_CONNECTIONS:
    S_MONGO_DATABASE_NAME = 'orion-web'
    S_MONGO_DATABASE_PORT = 27017
    S_MONGO_DATABASE_IP = 'mongo'
    S_MONGO_USERNAME = env_handler.get_instance().env('MONGO_ROOT_USERNAME')
    S_MONGO_PASSWORD = env_handler.get_instance().env('MONGO_ROOT_PASSWORD')
