
from playwright.sync_api import sync_playwright
import os
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(viewport={'width': 1920, 'height': 1080})
    page = context.new_page()

    # List of widgets to process
    widgets = [
        'clock', 'timer', 'traffic', 'text', 'checklist', 'timetable',
        'random', 'dice', 'qr', 'sound', 'drawing', 'embed', 'poll', 'webcam'
    ]

    # File path to index.html
    file_path = f"file://{os.path.abspath('index.html')}"

    for widget_type in widgets:
        print(f"Processing widget: {widget_type}")

        # Reload page for fresh state
        page.goto(file_path)

        # Mock google.script.run and other necessary setups
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
                        getDashboards: function() {
                            if (this.callback) this.callback(JSON.stringify({}));
                        },
                        saveDashboard: function(name, data) {
                            if (this.callback) this.callback({success: true});
                        }
                    }
                }
            };

            // Hide the start session button and other UI distractions if needed
            // document.getElementById('toolbar-container').style.display = 'none';
        """)

        # Wait for page to settle
        page.wait_for_load_state('networkidle')

        # Spawn Widget 1
        page.evaluate(f"spawnWidget('{widget_type}')")

        # Spawn Widget 2
        page.evaluate(f"spawnWidget('{widget_type}')")

        # Inject JS to position and resize widgets
        # Widget IDs will be widget-1 and widget-2 (if nextId resets on reload, actually page reload resets JS state so yes)
        # We need to wait a bit for DOM updates although evaluate is synchronous for the spawn, the DOM creation happens there.

        page.evaluate("""
            const w1 = document.getElementById('widget-1');
            const w2 = document.getElementById('widget-2');

            if (w1 && w2) {
                // Target size
                const width = 500;
                const height = 400;
                const gap = 40;
                const top = (window.innerHeight - height) / 2;

                // Center horizontally: Total width = width * 2 + gap
                const totalWidth = (width * 2) + gap;
                const startX = (window.innerWidth - totalWidth) / 2;

                // Position W1 (Left - Active Side)
                w1.style.width = width + 'px';
                w1.style.height = height + 'px';
                w1.style.left = startX + 'px';
                w1.style.top = top + 'px';
                w1.style.zIndex = 100;

                // Position W2 (Right - Settings Side)
                w2.style.width = width + 'px';
                w2.style.height = height + 'px';
                w2.style.left = (startX + width + gap) + 'px';
                w2.style.top = top + 'px';
                w2.style.zIndex = 100;
            }
        """)

        # Flip the second widget to settings
        # Click the settings button on widget-2
        # .btn-settings is inside .widget-header
        try:
            page.locator("#widget-2 .btn-settings").click()
        except Exception as e:
            print(f"Error clicking settings on {widget_type}: {e}")

        # Small delay to allow transitions (flip animation is 0.6s in CSS)
        time.sleep(1.0)

        # Take screenshot
        output_path = f"onboarding-video/public/{widget_type}_comparison.png"
        page.screenshot(path=output_path)
        print(f"Saved screenshot to {output_path}")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
