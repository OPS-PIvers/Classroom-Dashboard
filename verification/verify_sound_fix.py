from playwright.sync_api import sync_playwright
import os

OUTPUT_FILE = "verification/sound_verification.png"
URL_FILE = f"file://{os.path.abspath('index.html')}"

def verify_sound_widget():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(URL_FILE)

        # Mock Google Script
        page.evaluate("""
            window.google = { script: { run: {
                withSuccessHandler: () => ({ withFailureHandler: () => ({
                    getDashboards: () => {},
                    createSession: () => {}
                })})
            }}};
            window.spawnWidget = window.spawnWidget || function() { throw "Not ready"; };
        """)

        # Spawn Sound Widget
        page.evaluate("spawnWidget('sound')")
        w = page.locator(".widget", has_text="Noise Level")
        w.wait_for()

        # Mock Active State (Same logic as record_all.py)
        page.evaluate("""
            const w = document.querySelector('.widget[id^="widget-"]');
            const overlay = w.querySelector('.mic-overlay');
            if(overlay) overlay.style.display = 'none';

            const bar = w.querySelector('.mic-bar');
            if(bar) {
                bar.style.height = '50%';
                bar.className += 'bg-yellow-400';
            }
        """)

        page.wait_for_timeout(500)
        page.screenshot(path=OUTPUT_FILE)
        print(f"Screenshot saved to {OUTPUT_FILE}")
        browser.close()

if __name__ == "__main__":
    verify_sound_widget()
