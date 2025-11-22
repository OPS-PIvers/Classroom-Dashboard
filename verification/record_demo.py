"""
Playwright script to record a demonstration video of the application.

This script creates a video recording and screenshot of typical user interactions
including starting a session, spawning a widget, and modifying settings.

Usage: python verification/record_demo.py (run from project root)
Outputs:
  - videos/demo_recording.webm
  - verification/demo_screenshot.png
"""

from playwright.sync_api import sync_playwright
import os
import sys

if not os.path.exists('index.html'):
    print("Error: index.html not found. Please run this script from the project root.")
    sys.exit(1)

def run_and_rename(playwright):
    browser = playwright.chromium.launch(headless=True)

    # Create output directory if it doesn't exist
    os.makedirs("videos/", exist_ok=True)

    # Create a context with video recording enabled
    # Videos will be saved to the 'videos/' directory
    context = browser.new_context(
        record_video_dir="videos/",
        record_video_size={"width": 1280, "height": 720},
        viewport={"width": 1280, "height": 720}
    )

    page = context.new_page()

    # Load the local index.html
    # Assumes script is run from repo root
    page.goto(f"file://{os.path.abspath('index.html')}")

    # Mock google.script.run interactions for the frontend
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
                        if (this.callback) {
                            this.callback({
                                success: true,
                                code: 'DEMO12',
                                data: JSON.parse(data)
                            });
                        }
                    },
                    updateSession: function(code, data) {
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

    print("--- Starting Interaction Recording ---")

    # 1. Start Session
    page.locator("#btn-start-session").click()
    page.wait_for_selector("#session-menu", state="visible")
    page.locator("#btn-menu-start-session").click()
    page.wait_for_selector("#session-indicator", state="visible")
    print("Action: Started Session")

    try:
        # 2. Add a Clock Widget
        # Using the global spawnWidget function via evaluate
        page.evaluate("spawnWidget('clock')")

        # Wait for the widget to appear. The widget has class 'widget' and contains 'Clock'
        widget_locator = page.locator(".widget", has_text="Clock")
        widget_locator.wait_for(state="visible")
        print("Action: Spawned Clock Widget")

        # Wait a bit to capture the clock ticking in the video
        page.wait_for_timeout(2000)

        # 3. Open Widget Settings
        # Find the settings button on the widget
        widget_locator.locator(".btn-settings").click()
        print("Action: Opened Widget Settings")
        page.wait_for_timeout(1000)

        # 4. Toggle Interaction Checkbox
        # The settings form is on the back face of the card
        # We might need to wait for the flip animation or just check visibility
        interact_checkbox = widget_locator.locator(".inp-interact")
        if interact_checkbox.is_visible():
            interact_checkbox.click()
            print("Action: Toggled Student Interaction")
            page.wait_for_timeout(1000)

    except Exception as e:
        print(f"Error during widget spawning or interaction: {e}")

    # 5. Take a screenshot (demonstrating dual capability)
    os.makedirs("verification", exist_ok=True)
    screenshot_path = "verification/demo_screenshot.png"
    page.screenshot(path=screenshot_path)
    print(f"Action: Took screenshot saved to {screenshot_path}")

    # 6. Pause Session
    page.locator("#btn-start-session").click()
    page.wait_for_selector("#session-menu", state="visible")
    page.locator("#btn-menu-pause").click()
    page.wait_for_timeout(1000) # Wait for toast/UI update
    print("Action: Paused Session")

    # Retrieve video path before closing
    video_path = page.video.path()

    context.close()
    browser.close()

    # Rename the video file
    if video_path and os.path.exists(video_path):
        new_path = os.path.join("videos", "demo_recording.webm")
        if os.path.exists(new_path):
            os.remove(new_path)
        os.rename(video_path, new_path)
        print(f"--- Recording Complete ---")
        print(f"Video saved to: {new_path}")
    else:
        print("Error: Video file not found.")

with sync_playwright() as playwright:
    run_and_rename(playwright)
