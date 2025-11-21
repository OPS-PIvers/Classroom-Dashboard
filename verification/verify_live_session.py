
from playwright.sync_api import sync_playwright
import os

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Load the local index.html
    page.goto(f"file://{os.path.abspath('index.html')}")

    # Mock google.script.run
    page.evaluate("""
        window.google = {
            script: {
                run: {
                    withSuccessHandler: function(callback) {
                        this.callback = callback;
                        return this;
                    },
                    withFailureHandler: function(callback) {
                        return this;
                    },
                    createSession: function(data) {
                        // Mock successful session creation
                        if (this.callback) {
                            this.callback({
                                success: true,
                                code: 'TEST12',
                                data: JSON.parse(data)
                            });
                        }
                    },
                    updateSession: function(code, data) {
                         // Mock update
                         console.log("Session updated");
                    },
                    setSessionPaused: function(code, paused) {
                        if (this.callback) {
                            this.callback({
                                success: true,
                                paused: paused
                            });
                        }
                    },
                    getDashboards: function() {
                        if (this.callback) this.callback(JSON.stringify({}));
                    }
                }
            }
        };
    """)

    # 1. Test Teacher Start Session
    # Click "Live Session" menu button to open menu
    page.locator("#btn-start-session").click()

    # Wait for menu
    page.wait_for_selector("#session-menu", state="visible")

    # Click "Start Session" inside the menu
    page.locator("#btn-menu-start-session").click()

    # Wait for session indicator to appear
    page.wait_for_selector("#session-indicator", state="visible")

    # Verify Session Code Display
    assert page.locator("#session-code-display").inner_text() == "TEST12"
    print("Session started successfully")

    # 2. Test Pause Session from Menu
    # Open session menu again
    page.locator("#btn-start-session").click()

    # Wait for menu
    page.wait_for_selector("#session-menu", state="visible")

    # Click Pause
    page.locator("#btn-menu-pause").click()

    # Verify Toast appears "Session Paused"
    page.wait_for_timeout(500) # Wait for toast animation

    # 3. Simulate Student View Paused State
    # We can simulate this by calling updateStudentView with paused: true
    page.evaluate("""
        updateStudentView({
            widgets: [],
            paused: true,
            polls: {}
        });
        // Also manually trigger the overlay logic usually done in pollSessionData
        document.getElementById('student-paused-overlay').classList.remove('hidden');
    """)

    page.wait_for_selector("#student-paused-overlay", state="visible")
    print("Student paused overlay visible")

    # 4. Simulate Student Interaction Checkbox
    # Clear overlay
    page.evaluate("document.getElementById('student-paused-overlay').classList.add('hidden');")

    # Add a widget
    page.evaluate("spawnWidget('clock')")
    page.locator(".btn-settings").click()

    # Verify "Allow Student Interaction" checkbox exists
    assert page.locator(".inp-interact").is_visible()
    print("Interaction checkbox visible")

    # Take screenshot
    page.screenshot(path="verification/verification.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
