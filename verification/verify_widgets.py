
import os
from playwright.sync_api import sync_playwright

def verify_widgets():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Get absolute path to index.html
        cwd = os.getcwd()
        index_path = f"file://{os.path.join(cwd, 'index.html')}"

        # Mock google.script.run before page loads
        page.add_init_script("""
            window.google = {
                script: {
                    run: {
                        withSuccessHandler: function(callback) {
                            this._success = callback;
                            return this;
                        },
                        withFailureHandler: function(callback) {
                            this._failure = callback;
                            return this;
                        },
                        getDashboards: function() {
                            if(this._success) this._success(JSON.stringify({}));
                        },
                        saveDashboard: function() {
                            if(this._success) this._success({success: true});
                        },
                        renameDashboard: function() {},
                        deleteDashboard: function() {}
                    }
                }
            };
        """)

        print(f"Navigating to {index_path}")
        page.goto(index_path)

        # Wait for page to settle
        page.wait_for_timeout(1000)

        # List of widgets to spawn
        widgets = [
            "clock", "timer", "traffic", "text", "checklist",
            "random", "dice", "sound", "drawing", "qr",
            "embed", "timetable", "poll", "webcam"
        ]

        # Inject script to spawn and arrange widgets
        # We spawn them and then move them programmatically
        page.evaluate("""(widgets) => {
            const GRID_X = 350; // Width + margin
            const GRID_Y = 350; // Height + margin
            const COLS = 4;

            widgets.forEach((type, index) => {
                // Spawn widget
                const widget = window.spawnWidget(type);

                // Calculate grid position
                const col = index % COLS;
                const row = Math.floor(index / COLS);

                const x = 50 + (col * GRID_X);
                const y = 50 + (row * GRID_Y);

                // Move widget
                widget.el.style.left = x + 'px';
                widget.el.style.top = y + 'px';

                // Ensure it's visible
                widget.el.style.zIndex = 100 + index;
            });
        }""", widgets)

        # Wait for widgets to render (some might have animations or async loads like QR)
        page.wait_for_timeout(2000)

        # Adjust viewport to fit all widgets
        # 4 cols * 350 = 1400 width
        # 4 rows (approx) * 350 = 1400 height
        page.set_viewport_size({"width": 1500, "height": 1600})

        output_path = os.path.join(cwd, "verification", "all_widgets.png")
        page.screenshot(path=output_path)
        print(f"Screenshot saved to {output_path}")

        browser.close()

if __name__ == "__main__":
    verify_widgets()
