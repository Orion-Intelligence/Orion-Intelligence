import warnings

warnings.filterwarnings(
    "ignore",
    message=r"'HTTP_422_UNPROCESSABLE_ENTITY' is deprecated\..*",
    module=r"starlette_admin(\.|$)",
)

import coverage

coverage.process_startup()
