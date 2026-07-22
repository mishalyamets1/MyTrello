import requests
from typing import Any
BASE_URL = "http://localhost:3001/api"

class ApiClient:
    def __init__(self, base_url: str = BASE_URL): 
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self.access_token: str | None = None

    def _url(self, path: str) -> str:
            """ Собирает URL: /auth/login -> http://localhost:3001/api/auth/login """
            return f"{self.base_url}{path}"
        
    def _auth_headers(self) -> dict[str, str]:
            """ Authorization для эндпоинтов """ 
            if not self.access_token: 
                return {}
            return {"Authorization": f"Bearer {self.access_token}"}
        
    def _request(self, method: str, path: str, **kwargs: Any):
            """ Общий метод для всех HTTP-запросов. """
            headers = kwargs.pop("headers", {})
            headers = {**self._auth_headers(), **headers}

            response = self.session.request(
                method=method,
                url = self._url(path),
                headers=headers,
                timeout = 10,
                **kwargs,
            )
            return response
    def set_access_token(self, token: str) -> None:
            """ Сохранить токен после логина или регистрации """
            self.access_token = token

    def register(self, email: str, password: str, display_name: str | None = None, avatar: str | None = None) -> requests.Response:
            body: dict[str, Any] = {"email": email, "password": password}
            if display_name is not None:
                body["displayName"] = display_name
            if avatar is not None:
                body["avatar"] = avatar
            response = self._request("POST", "/auth/register", json=body )
            if response.ok:
                token = response.json()["data"]["accessToken"]
                self.set_access_token(token)
            return response
        
    def login(self, email: str, password: str) -> requests.Response:
        response = self._request(
            "POST",
            "/auth/login",
            json={"email": email, "password": password},
        )
        if response.ok:
            token = response.json()["data"]["accessToken"]
            self.set_access_token(token)
        return response

    def refresh(self) -> requests.Response:
        """ Обновить  access token. Refresh cookie уже в сессии """
        response  = self._request("POST", "/auth/refresh")

        if response.ok: 
            token = response.json()["data"]["accessToken"]
            self.set_access_token(token)
        return response

    def logout(self):
        response = self._request("POST", "/auth/logout")
        self.access_token = None
        return response

        # --- boards ---

    def get_boards(self) -> requests.Response:
        return self._request("GET", "/boards")

    def get_board(self, board_id: str) -> requests.Response:
        return self._request("GET", f"/boards/{board_id}")

    def create_board(self, title: str) -> requests.Response:
        return self._request("POST", "/boards", json={"title": title})

    def delete_board(self, board_id: str) -> requests.Response:
        return self._request("DELETE", f"/boards/{board_id}")

    # --- columns ---

    def get_columns(self, board_id: str) -> requests.Response:
        return self._request("GET", "/columns", params={"boardId": board_id})

    def create_column(self, title: str, board_id: str) -> requests.Response:
        return self._request(
            "POST",
            "/columns",
            params={"boardId": board_id},
            json={"title": title},
        )

    def move_column(self, column_id: str, to_index: int, board_id: str) -> requests.Response:
        return self._request(
            "POST",
            f"/columns/{column_id}/move",
            params={"boardId": board_id},
            json={"toIndex": to_index},
        )

    def delete_column(self, column_id: str, board_id: str) -> requests.Response:
        return self._request(
            "DELETE",
            f"/columns/{column_id}",
            params={"boardId": board_id},
        )

    # --- tasks ---

    def get_inbox_tasks(self, board_id: str) -> requests.Response:
        return self._request("GET", "/tasks/inbox", params={"boardId": board_id})

    def add_inbox_task(self, title: str, board_id: str) -> requests.Response:
        return self._request(
            "POST",
            "/tasks/inbox",
            params={"boardId": board_id},
            json={"title": title},
        )

    def update_task(self, task_id: str, board_id: str, **fields: Any) -> requests.Response:
        return self._request(
            "PUT",
            f"/tasks/{task_id}",
            params={"boardId": board_id},
            json=fields,
        )

    def delete_task(self, task_id: str, board_id: str) -> requests.Response:
        return self._request(
            "DELETE",
            f"/tasks/{task_id}",
            params={"boardId": board_id},
        )

    def move_task(
        self,
        task_id: str,
        board_id: str,
        from_column_id: str,
        to_column_id: str,
        to_index: int,
    ) -> requests.Response:
        return self._request(
            "POST",
            f"/tasks/{task_id}/move",
            json={
                "boardId": board_id,
                "fromColumnId": from_column_id,
                "toColumnId": to_column_id,
                "toIndex": to_index,
            },
        )
    def complete_task(self, task_id: str, board_id: str) -> requests.Response:
        return self._request(
            "POST",
            f"/tasks/{task_id}/complete",
            params={"boardId": board_id},
        )
    # --- users ---

    def get_me(self) -> requests.Response:
        return self._request("GET", "/users/me")

    def update_me(self, **fields: Any) -> requests.Response:
        return self._request("PATCH", "/users/me", json=fields)

    def change_password(self, old_password: str, new_password: str) -> requests.Response:
        return self._request(
            "PATCH",
            "/users/me/password",
            json={"oldPassword": old_password, "newPassword": new_password},
        )