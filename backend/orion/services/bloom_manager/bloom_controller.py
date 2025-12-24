import os
import threading

from bloom_filter2 import BloomFilter


class bloom_controller:
  __instance = None
  __lock = threading.RLock()

  def __new__(cls, *a, **kw):
    with cls.__lock:
      if cls.__instance is None:
        cls.__instance = super().__new__(cls)
      return cls.__instance

  def __init__(self, capacity=150_000_000_000, error_rate=0.005, dirpath=None):
    if getattr(self, "_initialized", False): return
    dirpath = dirpath or os.path.join(os.getcwd(), "bloom_data")
    os.makedirs(dirpath, exist_ok=True)
    self.path = os.path.join(dirpath, "bloom_150b_0_5pct.db")
    self.bf = BloomFilter(max_elements=capacity, error_rate=error_rate, filename=self.path)
    self._initialized = True

  def isduplicate(self, item):
    if item in self.bf:
      return True
    self.bf.add(item)
    return False
