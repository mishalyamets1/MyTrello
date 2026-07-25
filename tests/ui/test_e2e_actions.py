from playwright.sync_api import expect


def test_add_task_to_inbox(logged_in_page, page):
    task_title = "Погунить"

    inbox_input = page.get_by_placeholder("Add a card")
    inbox_input.click()
    inbox_input.fill(task_title)

    add_button = page.get_by_role("button", name="Добавить").first
    add_button.dispatch_event("mousedown")

    expect(page.get_by_text(task_title)).to_be_visible()

def test_add_column(page, logged_in_page):
    column_title = "To Do"
    page.get_by_placeholder("Add a column").click()
    page.get_by_placeholder("Add a column").fill(column_title)
    page.get_by_role("button", name="Добавить").last.click()
    expect(page.get_by_text(column_title)).to_be_visible()
