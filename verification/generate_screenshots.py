
from playwright.sync_api import sync_playwright
import os
import sys

def run(playwright):
    # Validate environment
    if not os.path.exists('index.html'):
        print("Error: index.html not found. Please run this script from the project root.")
        sys.exit(1)

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

    # Create output directory if it doesn't exist
    os.makedirs('onboarding-video/public', exist_ok=True)

    for widget_type in widgets:
        print(f"Processing widget: {widget_type}")

        try:
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
            """)

            # Wait for page to settle
            page.wait_for_load_state('load')

            # Spawn Widget 1 & 2 safely
            page.evaluate("type => spawnWidget(type)", widget_type)
            page.evaluate("type => spawnWidget(type)", widget_type)

            # Position and resize widgets
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
            settings_btn = page.locator("#widget-2 .btn-settings")
            try:
                settings_btn.wait_for(state="visible", timeout=5000)
                settings_btn.click()
                # Wait for the flip animation to potentially finish
                # The CSS transition is 0.6s.
                page.wait_for_timeout(1000)
            except Exception:
                print(f"Warning: Settings button not found or not visible for {widget_type}")

            # Take screenshot
            output_path = f"onboarding-video/public/{widget_type}_comparison.png"
            page.screenshot(path=output_path)
            print(f"Saved screenshot to {output_path}")

        except Exception as e:
            print(f"FAILED to process {widget_type}: {type(e).__name__}: {e}")
            # We continue to the next widget to attempt to generate as many as possible
            continue

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
