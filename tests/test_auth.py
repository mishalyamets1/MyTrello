import uuid
import pytest
from utils.api_client import ApiClient

def test_register_returns_access_token(api: ApiClient):
    email = f"user_{uuid.uuid4().hex[:8]}@test.com"

    response = api.register(email, "secret123")

    assert response.status_code ==  200

    body = response.json()
    assert body["success"] is True
    assert "accessToken" in body["data"]
    assert body["data"]["user"]["email"] == email
    assert api.access_token is not None

def test_register_duplicate_email_fails(api):
    email = f"dup_{uuid.uuid4().hex[:8]}@test.com"
    api.register(email, "secret123")
    response = api.register(email, "other_pass")
    assert response.status_code == 400
    assert "already exists" in response.json()["error"].lower()

def test_register_and_get_boards(api):
    email = f'user_{uuid.uuid4().hex[:8]}@test.com'
    register_res = api.register(email, 'secret123')
    assert register_res.status_code == 200
    assert register_res.json()["success"] is True

    boards_res = api.get_boards()
    assert boards_res.status_code == 200
    assert len(boards_res.json()["data"]) >= 1


@pytest.mark.parametrize("email, password", [("", "secret"), ("test@test.com", "")])
def test_register_empty_fields(api, email, password):
    response = api.register(email, password)
    assert response.status_code == 400

def test_login_success(api, registered_user):
    api.access_token = None
    response = api.login(registered_user['email'], registered_user['password'])
    assert response.status_code == 200
    assert "accessToken" in response.json()["data"]

def test_login_wrong_password(api, registered_user):
    response = api.login(registered_user['email'], "wrong")
    assert response.status_code == 401
    assert response.json()["error"] == "Invalid credentials"

def test_refresh_returns_new_token(api, registered_user):
    old_refresh = api.session.cookies.get("refreshToken")
    response = api.refresh()
    assert response.status_code == 200
    assert "accessToken" in response.json()['data']
    assert api.session.cookies.get("refreshToken") != old_refresh

def test_logout(api, registered_user):
    response = api.logout()
    assert response.status_code == 200
    assert api.access_token is None
# без токена → 401
def test_get_boards_without_token(api):
    api.access_token = None
    assert api.get_boards().status_code == 401

# refresh без cookie → 401
def test_refresh_without_cookie(api):
    api.session.cookies.clear()
    assert api.refresh().status_code == 401

# после logout refresh не работает
def test_refresh_after_logout(api, registered_user):
    api.logout()
    assert api.refresh().status_code == 401

# несуществующий пользователь
def test_login_unknown_user(api):
    assert api.login("nobody@test.com", "secret").status_code == 401
