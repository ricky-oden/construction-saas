from fastapi import Query
from fastapi.testclient import TestClient

from app.main import create_app


def test_validation_error_uses_common_shape() -> None:
    application = create_app()

    @application.get("/api/v1/test-validation")
    def validation_probe(sample: int = Query()) -> dict[str, int]:
        return {"sample": sample}

    client = TestClient(application)
    response = client.get("/api/v1/test-validation", params={"sample": "not-an-integer"})

    assert response.status_code == 422
    assert response.json() == {
        "error": {
            "code": "VALIDATION_ERROR",
            "message": "Request validation failed.",
            "field_errors": [
                {
                    "field": "query.sample",
                    "message": (
                        "Input should be a valid integer, unable to parse string as an integer"
                    ),
                    "type": "int_parsing",
                }
            ],
            "conflict": None,
        }
    }


def test_not_found_uses_common_shape() -> None:
    client = TestClient(create_app())

    response = client.get("/api/v1/does-not-exist")

    assert response.status_code == 404
    assert response.json() == {
        "error": {
            "code": "NOT_FOUND",
            "message": "Resource not found.",
            "field_errors": [],
            "conflict": None,
        }
    }


def test_unexpected_error_is_generic_and_does_not_expose_internal_message() -> None:
    application = create_app()
    internal_message = "sensitive-stack-trace-detail"

    @application.get("/api/v1/test-unexpected")
    def unexpected_probe() -> None:
        raise RuntimeError(internal_message)

    client = TestClient(application, raise_server_exceptions=False)
    response = client.get("/api/v1/test-unexpected")

    assert response.status_code == 500
    assert response.json() == {
        "error": {
            "code": "INTERNAL_SERVER_ERROR",
            "message": "An unexpected error occurred.",
            "field_errors": [],
            "conflict": None,
        }
    }
    assert internal_message not in response.text
