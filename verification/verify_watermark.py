
import os
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load index.html from the current directory
        cwd = os.getcwd()
        page.goto(f"file://{cwd}/index.html")

        # Wait a bit for things to settle (though without backend, it might stay in loading state)
        # We just want to see the background watermark.
        page.wait_for_timeout(2000)

        # Take a screenshot
        page.screenshot(path="verification/watermark_verification.png")

        browser.close()

if __name__ == "__main__":
    run()
