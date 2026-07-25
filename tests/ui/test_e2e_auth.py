from playwright.sync_api import Page, expect
import uuid

def test_register_and_see_board(page: Page):

    email = f"e2e_{uuid.uuid4().hex[:8]}@test.com"
    password = "12345678"

    page.goto('http://localhost:3000')

    expect(page.get_by_role('heading', name="Welcome")).to_be_visible()

    page.get_by_role("button", name="No account? Register").click()
    page.get_by_label("email").fill(email)
    page.get_by_label('password').fill(password)
    page.get_by_role("button", name="Register").click()

    expect(page.get_by_text("MyTrello")).to_be_visible()
    expect(page.get_by_text("My Board")).to_be_visible()

def test_login_existing_user(page: Page):
    email = f"e2e_{uuid.uuid4().hex[:8]}@test.com"
    password = "12345678"

    page.goto('http://localhost:3000')

    expect(page.get_by_role('heading', name="Welcome")).to_be_visible()
    page.get_by_role("button", name="No account? Register").click()
    page.get_by_label("email").fill(email)
    page.get_by_label('password').fill(password)
    page.get_by_role("button", name="Register").click()
    expect(page.get_by_text("MyTrello")).to_be_visible()
    expect(page.get_by_text("My Board")).to_be_visible()

    page.get_by_role("button", name="Выйти").click()
    expect(page.get_by_role('heading', name="Welcome")).to_be_visible()

    page.get_by_placeholder("email").fill(email)
    page.get_by_placeholder("password").fill(password)
    page.get_by_role("button", name="Login").click()
    expect(page.get_by_text("MyTrello")).to_be_visible()
    