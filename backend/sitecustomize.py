import warnings

warnings.filterwarnings(
    "ignore",
    message=r"'HTTP_422_UNPROCESSABLE_ENTITY' is deprecated\..*",
)

import coverage

coverage.process_startup()
