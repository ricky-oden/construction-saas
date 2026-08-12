from http import HTTPStatus
from typing import Any


class ApiException(Exception):
    def __init__(
        self,
        status_code: HTTPStatus,
        code: str,
        message: str,
        conflict: dict[str, Any] | None = None,
    ) -> None:
        self.status_code = status_code
        self.code = code
        self.message = message
        self.conflict = conflict
        super().__init__(message)
