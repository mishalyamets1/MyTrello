import pytest
@pytest.mark.integration
def test_full_board_workflow(api, board):
    """
    register (fixture) → column → task в inbox → move в колонку → complete
    """
    board_id = board
    inbox_id = f'inbox_{board_id}'

    col_res = api.create_column("To do", board_id)
    assert col_res.status_code == 200
    column_id = col_res.json()['data']['id']

    task_res = api.add_inbox_task("Buy milk", board_id)
    assert task_res.status_code == 200
    task_id = task_res.json()['data']['id']

    inbox_res = api.get_inbox_tasks(board_id)
    assert inbox_res.status_code == 200
    inbox_tasks = inbox_res.json()["data"]
    assert any(t["id"] == task_id for t in inbox_tasks)

    move_res = api.move_task(task_id=task_id, board_id=board_id, from_column_id=inbox_id, to_column_id=column_id, to_index=0)
    assert move_res.status_code == 200

    board_res = api.get_board(board_id)
    assert board_res.status_code == 200
    columns = board_res.json()['data']['columns']
    target_col = next(c for c in columns if c['id'] == column_id)
    assert any(t['id'] == task_id for t in target_col['tasks'])

    complete_res = api.complete_task(task_id, board_id)
    assert complete_res.status_code == 200


def test_create_column_on_board(api, board):
    response = api.create_column("Backlog", board)
    assert response.status_code == 200
    assert response.json()["data"]["title"] == "Backlog"


def test_add_and_update_task(api, board):
    create_res = api.add_inbox_task("Old title", board)
    assert create_res.status_code == 200
    task_id = create_res.json()["data"]["id"]

    update_res = api.update_task(
        task_id,
        board,
        title="New title",
        description="Details",
    )
    assert update_res.status_code == 200
    assert update_res.json()["data"]["title"] == "New title"


def test_delete_task_from_inbox(api, board):
    create_res = api.add_inbox_task("Temp task", board)
    task_id = create_res.json()["data"]["id"]

    delete_res = api.delete_task(task_id, board)
    assert delete_res.status_code == 200

    inbox_res = api.get_inbox_tasks(board)
    assert not any(t["id"] == task_id for t in inbox_res.json()["data"])


def test_create_and_delete_board(api, registered_user):
    create_res = api.create_board("Sprint 1")
    assert create_res.status_code == 200
    board_id = create_res.json()["data"]["id"]

    delete_res = api.delete_board(board_id)
    assert delete_res.status_code == 200

    boards_res = api.get_boards()
    board_ids = [b["id"] for b in boards_res.json()["data"]]
    assert board_id not in board_ids

def test_create_column_without_title(api, board):
    response = api.create_column("", board)
    assert response.status_code == 400
def test_add_task_without_title(api, board):
    response = api.add_inbox_task("", board)
    assert response.status_code == 400