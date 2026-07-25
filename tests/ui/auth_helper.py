import uuid
from playwright.sync_api import  Page, expect

def register_and_open_board(page: Page):
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
    return {"email": email, "password": password}