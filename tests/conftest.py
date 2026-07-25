import pytest
import uuid
from ui.auth_helper import register_and_open_board
from utils.api_client import ApiClient

@pytest.fixture
def api():
    """ Новый http клиент на каждый тест """
    client = ApiClient()
    yield client
    client.session.close()

@pytest.fixture
def registered_user(api: ApiClient):
    """ Пользователь + access token для защищенных эндпоинтов """
    email = f"fixture_{uuid.uuid4().hex[:8]}@test.com"
    password = "secret123"

    res = api.register(email, password)
    assert res.status_code == 200
    data = res.json()["data"]
    return {
        "email": email,
        "password": password,
        "access_token": data["accessToken"],
        "user_id": data["userId"]
    }

@pytest.fixture
def board(api, registered_user):
    res = api.get_boards()
    boards = res.json()["data"]
    return boards[0]["id"]


@pytest.fixture
def logged_in_page(page):
    user = register_and_open_board(page)
    return user