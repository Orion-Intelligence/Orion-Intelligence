import datetime
import inspect
import logging
import os
import stat
import sys
from threading import Lock

from termcolor import colored

if sys.platform == "win32":
    os.system('color')


class log:
    __server_instance = None
    __file_handler_added = False
    __lock = Lock()
    __last_cleanup_date = None

    def __configure_logs(self):
        with self.__lock:
            self.__server_instance = logging.getLogger('genesis_logs')

            if not self.__server_instance.hasHandlers():
                self.__server_instance.setLevel(logging.DEBUG)

                console_handler = logging.StreamHandler()
                console_handler.setLevel(logging.DEBUG)

                formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
                console_handler.setFormatter(formatter)

                self.__server_instance.addHandler(console_handler)

            self.__server_instance.propagate = False

    @staticmethod
    def g():
        if log.__server_instance is None:
            log()
        return log.__server_instance

    def __init__(self):
        log.__server_instance = self
        self.__configure_logs()

    def get_caller_info(self):
        frame = inspect.currentframe()
        while frame:
            frame = frame.f_back
            if frame:
                caller_class = frame.f_locals.get("self", None)
                if caller_class and caller_class.__class__.__name__ != self.__class__.__name__:
                    caller_class = caller_class.__class__.__name__
                    caller_file = os.path.abspath(frame.f_code.co_filename)
                    caller_line = frame.f_lineno
                    return caller_class, caller_file, caller_line
                elif not caller_class:
                    caller_file = os.path.abspath(frame.f_code.co_filename)
                    caller_line = frame.f_lineno
                    return "Function", caller_file, caller_line
        return "Unknown", "Unknown", 0

    def __write_to_file(self, log_message, lines_per_file=10000):
        try:
            log_directory = os.path.join(os.getcwd(), 'orion/logs', datetime.datetime.now().strftime("%Y-%m-%d"))
            if not os.path.exists(log_directory):
                os.makedirs(log_directory, exist_ok=True)
                self.__cleanup_old_logs()

            log_files = sorted([f for f in os.listdir(log_directory) if f.startswith("log_") and f.endswith(".log")])

            if not log_files:
                log_filepath = os.path.join(log_directory, "log_1.log")
            else:
                last_log_file = os.path.join(log_directory, log_files[-1])
                if sum(1 for _ in open(last_log_file)) >= lines_per_file:
                    log_number = len(log_files) + 1
                    log_filepath = os.path.join(log_directory, f"log_{log_number}.log")
                else:
                    log_filepath = last_log_file

            caller_class, caller_file, caller_line = self.get_caller_info()
            full_log_message = f"{log_message} - {caller_class} ({caller_file}:{caller_line})"

            with open(log_filepath, 'a') as log_file:
                log_file.write(full_log_message + "\n")

            os.chmod(log_filepath, stat.S_IRUSR | stat.S_IWUSR | stat.S_IRGRP | stat.S_IROTH)

        except Exception as e:
            print(f"Error writing to log: {e}")

    def __format_log_message(self, log_type, p_log, include_caller=False):
        current_time = datetime.datetime.now().strftime("%d/%m/%Y %H:%M:%S")
        if include_caller:
            caller_class, caller_file, caller_line = self.get_caller_info()
            formatted_log = f"{log_type} - {current_time} : {p_log} - {caller_class} ({caller_file}:{caller_line})"
        else:
            formatted_log = f"{log_type} - {current_time} : {p_log}"
        return formatted_log

    @staticmethod
    def __cleanup_old_logs(retention_days=30):
        try:
            now = datetime.datetime.now().date()
            if log.__last_cleanup_date == now:
                return

            log.__last_cleanup_date = now
            cutoff_date = now - datetime.timedelta(days=retention_days)

            log_root = os.path.join(os.getcwd(), 'logs')

            for log_dir in os.listdir(log_root):
                log_path = os.path.join(log_root, log_dir)
                if os.path.isdir(log_path):
                    try:
                        log_date = datetime.datetime.strptime(log_dir, "%Y-%m-%d").date()
                        if log_date < cutoff_date:
                            for file in os.listdir(log_path):
                                os.remove(os.path.join(log_path, file))
                            os.rmdir(log_path)
                    except ValueError:
                        continue

        except Exception as e:
            print(f"Error during log cleanup: {e}")

    def i(self, p_log):
        try:
            console_log = self.__format_log_message("INFO", p_log)
            self.__write_to_file(console_log)
            print(colored(console_log, 'cyan', attrs=['bold']))
        except Exception:
            pass

    def s(self, p_log):
        try:
            console_log = self.__format_log_message("SUCCESS", p_log)
            self.__write_to_file(console_log)
            print(colored(console_log, 'green'))
        except Exception:
            pass

    def w(self, p_log):
        try:
            console_log = self.__format_log_message("WARNING", p_log)
            self.__server_instance.warning(console_log)
            self.__write_to_file(console_log)
            print(colored(console_log, 'yellow'))
        except Exception:
            pass

    def e(self, p_log):
        try:
            console_log = self.__format_log_message("ERROR", p_log)
            self.__server_instance.error(console_log)
            self.__write_to_file(console_log)
            print(colored(console_log, 'blue'))
        except Exception:
            pass

    def c(self, p_log):
        try:
            console_log = self.__format_log_message("CRITICAL", p_log)
            self.__server_instance.critical(console_log)
            self.__write_to_file(console_log)
            print(colored(console_log, 'red'))
        except Exception:
            pass
