import asyncio
from datetime import datetime, timedelta, timezone
import json
from zoneinfo import ZoneInfo

from jinja2 import Environment, FileSystemLoader

from interface import BASE_DIR
from orion.constants import constant
from orion.constants.constant import allowed_keys
from orion.management.jobs.insight_job import insight_job
from orion.management.jobs.alert_job import alert_job
from orion.services.elastic_manager.elastic_controller import elastic_controller


class cronjob_manager:
  __instance = None

  @staticmethod
  def get_instance():
    if cronjob_manager.__instance is None:
      cronjob_manager()
    return cronjob_manager.__instance

  def __init__(self):
    if cronjob_manager.__instance is not None:
      pass
    else:
      cronjob_manager.__instance = self
      self.build_assets()

  @staticmethod
  def build_assets():
    build_dir = BASE_DIR / "build"
    entities_file = build_dir / "assets" / "data" / "entities_data" / "entities.json"
    if not entities_file.exists():
      raise FileNotFoundError(f"entities.json not found at {entities_file}")

    with open(entities_file, "r", encoding="utf-8") as f:
      data = json.load(f)

    allowed_keys.clear()
    for item in data:
      if "key" in item:
        allowed_keys.add(item["key"])

    mail_templete_env = Environment(loader=FileSystemLoader(build_dir / "assets" / "data" / "mail_template_data"))
    constant.mail_template = mail_templete_env.get_template("mail_template.html")
    license_rules_env = Environment(loader=FileSystemLoader(build_dir / "assets" / "data" / "licenses"))
    license_rules_template = license_rules_env.get_template("license_rules.json")
    license_rules_json_str = license_rules_template.render()
    constant.license_rules = json.loads(license_rules_json_str)

  @staticmethod
  async def purge_loop():
    while True:
      await elastic_controller.get_instance().purge_old_records()
      await asyncio.sleep(86400)

  @staticmethod
  async def __init_handles():
    asyncio.create_task(insight_job.get_instance().update_insights())

  async def init_jobs(self):
    asyncio.create_task(cronjob_manager.purge_loop())
    asyncio.create_task(cronjob_manager.iocs_alert_loop())
    await self.__init_handles()

  @staticmethod
  async def iocs_alert_loop():
    while True:
      try:
        if len(allowed_keys) > 0:
          await alert_job.get_instance().run_all_categories()
        else:
          await asyncio.sleep(10)
          continue

      except Exception as e:
        print(f"[{datetime.now(timezone.utc)}] ALERT JOB ERROR: {e}")

      await asyncio.sleep(60)

    tz = ZoneInfo("Australia/Sydney")
    while True:
      if len(allowed_keys) <= 0:
        await asyncio.sleep(60)
        continue

      now_local = datetime.now(tz)

      next_midnight = datetime.combine(now_local.date(), datetime.min.time()).replace(tzinfo=tz)
      if now_local >= next_midnight:
        next_midnight += timedelta(days=1)

      seconds_until_next = (next_midnight - now_local).total_seconds()

      print(f"[{datetime.now(timezone.utc)}] Next alert run scheduled in {seconds_until_next / 3600:.2f} hours")

      await asyncio.sleep(seconds_until_next)

      try:
        print(f"[{datetime.now(timezone.utc)}] Running all category alert jobs for {next_midnight.date()}")
        await alert_job.get_instance().run_all_categories()
      except Exception as e:
        print(f"[{datetime.now(timezone.utc)}] ALERT JOB ERROR: {e}")
