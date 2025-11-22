import os
import time
from playwright.sync_api import sync_playwright

# Constants
OUTPUT_DIR = "videos/"
URL_FILE = f"file://{os.path.abspath('index.html')}"

def mock_google_script(page):
    """Injects the google.script.run mock into the page."""
    page.evaluate("""
        window.google = {
            script: {
                run: {
                    withSuccessHandler: function(callback) {
                        this.successCallback = callback;
                        return this;
                    },
                    withFailureHandler: function(callback) {
                        this.failureCallback = callback;
                        return this;
                    },
                    createSession: function(data) {
                        if (this.successCallback) {
                            this.successCallback({
                                success: true,
                                code: 'DEMO12',
                                data: JSON.parse(data)
                            });
                        }
                    },
                    joinSession: function(code) {
                        if (this.successCallback) {
                            // Mock response for joining
                            this.successCallback({
                                success: true,
                                data: {
                                    bg: 'bg-slate-900',
                                    widgets: [
                                        { id: 't1', type: 'clock', x: 100, y: 100, w: 280, h: 160, z: 1, allowInteraction: false, data: { is24h: false, showSeconds: true } }
                                    ],
                                    polls: {}
                                }
                            });
                        }
                    },
                    getSessionData: function(code) {
                        // Mock polling response
                         if (this.successCallback) {
                            this.successCallback({
                                success: true,
                                active: true,
                                data: {
                                    paused: false,
                                    widgets: [],
                                    polls: {'poll-1': {A: 5, B: 3}}
                                }
                            });
                        }
                    },
                    updateSession: function(code, data) { console.log("Session updated"); },
                    setSessionPaused: function(code, paused) {
                         if (this.successCallback) this.successCallback({ success: true, paused: paused });
                    },
                    endSession: function(code) {
                         if (this.successCallback) this.successCallback({ success: true });
                    },
                    saveDashboard: function(name, state) {
                        if (this.successCallback) this.successCallback({ success: true, message: 'Saved!' });
                    },
                    getDashboards: function() {
                        if (this.successCallback) this.successCallback(JSON.stringify({
                            'My Saved Dashboard': { bg: 'bg-slate-900', widgets: [] }
                        }));
                    },
                    updateWidgetState: function(code, id, state) { console.log("Widget updated"); },
                    submitPollResponse: function(code, id, opt) {
                         if (this.successCallback) this.successCallback({ success: true, polls: {A: 1, B: 0} });
                    }
                }
            }
        };

        // Global helper to verify widgets are spawned
        window.spawnWidget = window.spawnWidget || function() { console.log("Real spawnWidget not ready yet"); };
    """)

def record_scenario(playwright, name, action_callback):
    """
    Runs a recording scenario.
    - playwright: The playwright instance.
    - name: The name of the output video file (e.g., 'clock').
    - action_callback: A function receiving (page) to perform actions.
    """
    print(f"--- Recording Scenario: {name} ---")
    browser = playwright.chromium.launch(headless=True)

    # Create context with video recording
    context = browser.new_context(
        record_video_dir=OUTPUT_DIR,
        record_video_size={"width": 1280, "height": 720},
        viewport={"width": 1280, "height": 720}
    )

    page = context.new_page()
    page.goto(URL_FILE)
    mock_google_script(page)

    try:
        action_callback(page)
    except Exception as e:
        print(f"Error in scenario {name}: {e}")

    # Close context to save video
    context.close()
    browser.close()

    # Rename video
    video_path = page.video.path()
    if video_path and os.path.exists(video_path):
        new_path = os.path.join(OUTPUT_DIR, f"{name}.webm")
        if os.path.exists(new_path):
            os.remove(new_path)
        os.rename(video_path, new_path)
        print(f"Saved video: {new_path}")
    else:
        print(f"Warning: No video found for {name}")

# --- Scenarios ---

def scenario_clock(page):
    page.evaluate("spawnWidget('clock')")
    w = page.locator(".widget", has_text="Clock")
    w.wait_for()
    page.wait_for_timeout(1000)

    # Open settings
    w.locator(".btn-settings").click()
    page.wait_for_timeout(500)

    # Toggle 24h
    w.locator(".inp-24h").click()
    page.wait_for_timeout(1000)

    # Close settings
    w.locator(".btn-settings-done").click()
    page.wait_for_timeout(1000)

def scenario_timer(page):
    page.evaluate("spawnWidget('timer')")
    w = page.locator(".widget", has_text="Timer")
    w.wait_for()

    # Start
    w.locator(".btn-start").click()
    page.wait_for_timeout(2000) # Let it count down

    # Pause
    w.locator(".btn-pause").click()
    page.wait_for_timeout(500)

    # Reset
    w.locator(".btn-reset").click()
    page.wait_for_timeout(500)

    # Settings: Change time to 1 min
    w.locator(".btn-settings").click()
    page.wait_for_timeout(500)
    w.locator(".inp-min").fill("1")
    w.locator(".inp-min").dispatch_event("change") # Ensure event fires
    page.wait_for_timeout(500)
    w.locator(".btn-settings-done").click()
    page.wait_for_timeout(1000)

def scenario_traffic(page):
    page.evaluate("spawnWidget('traffic')")
    w = page.locator(".widget", has_text="Signal")
    w.wait_for()

    # Click Red
    w.locator(".traffic-light[data-color='red']").click()
    page.wait_for_timeout(1000)

    # Click Yellow
    w.locator(".traffic-light[data-color='yellow']").click()
    page.wait_for_timeout(1000)

    # Click Green
    w.locator(".traffic-light[data-color='green']").click()
    page.wait_for_timeout(1000)

def scenario_dice(page):
    page.evaluate("spawnWidget('dice')")
    w = page.locator(".widget", has_text="Dice")
    w.wait_for()

    # Roll 1
    w.locator(".btn-roll").click()
    page.wait_for_timeout(1500)

    # Settings -> 3 Dice
    w.locator(".btn-settings").click()
    page.wait_for_timeout(500)
    w.locator(".inp-count").select_option("3")
    w.locator(".btn-settings-done").click()
    page.wait_for_timeout(500)

    # Roll 3
    w.locator(".btn-roll").click()
    page.wait_for_timeout(1500)

def scenario_qr(page):
    page.evaluate("spawnWidget('qr')")
    w = page.locator(".widget", has_text="QR Code")
    w.wait_for()

    page.wait_for_timeout(1000)

    # Settings
    w.locator(".btn-settings").click()
    page.wait_for_timeout(500)

    w.locator(".inp-url").fill("https://classroom.google.com")
    w.locator(".inp-url").dispatch_event("input") # Trigger update
    page.wait_for_timeout(1500)

    w.locator(".btn-settings-done").click()
    page.wait_for_timeout(1000)

def scenario_text(page):
    page.evaluate("spawnWidget('text')")
    w = page.locator(".widget", has_text="Note")
    w.wait_for()

    # Type text
    area = w.locator(".widget-content div[contenteditable]")
    area.click()
    area.fill("Welcome to Class!")
    page.wait_for_timeout(1000)

    # Settings: Change Background Color
    w.locator(".btn-settings").click()
    page.wait_for_timeout(500)

    # Pick a color (e.g., yellow)
    w.locator(".bg-picker").nth(1).click()
    page.wait_for_timeout(1000)

    # Change Font Size
    w.locator(".inp-size").fill("36")
    w.locator(".inp-size").dispatch_event("input")
    page.wait_for_timeout(1000)

    w.locator(".btn-settings-done").click()
    page.wait_for_timeout(1000)

def scenario_checklist(page):
    page.evaluate("spawnWidget('checklist')")
    w = page.locator(".widget", has_text="Checklist")
    w.wait_for()

    # Settings: Add items
    w.locator(".btn-settings").click()
    page.wait_for_timeout(500)

    w.locator(".inp-list").fill("Turn in Homework\\nRead Chapter 4\\nGroup Discussion")
    w.locator(".btn-update").click()
    page.wait_for_timeout(1000)

    # Check an item
    w.locator(".check-item input").first.click()
    page.wait_for_timeout(1000)

def scenario_timetable(page):
    page.evaluate("spawnWidget('timetable')")
    w = page.locator(".widget", has_text="Timetable")
    w.wait_for()

    # Settings: Add data
    w.locator(".btn-settings").click()
    page.wait_for_timeout(500)

    w.locator(".inp-data").fill("09:00 | Mathematics\\n10:00 | Morning Break\\n10:30 | Science Lab")
    w.locator(".btn-apply").click()
    page.wait_for_timeout(1500)

def scenario_embed(page):
    page.evaluate("spawnWidget('embed')")
    w = page.locator(".widget", has_text="Embed")
    w.wait_for()

    # Settings: Load URL
    w.locator(".btn-settings").click()
    page.wait_for_timeout(500)

    w.locator(".inp-embed").fill("https://example.com")
    w.locator(".btn-load").click()
    page.wait_for_timeout(2000)

def scenario_random(page):
    page.evaluate("spawnWidget('random')")
    w = page.locator(".widget", has_text="Name Picker")
    w.wait_for()

    # Settings: Add 2004 baby names
    w.locator(".btn-settings").click()
    page.wait_for_timeout(500)

    names = "Emily\\nMichael\\nJacob\\nJoshua\\nMatthew\\nEthan\\nAndrew\\nDaniel\\nWilliam\\nJoseph\\nChristopher\\nAnthony\\nRyan\\nNicholas\\nDavid"
    w.locator(".inp-list").fill(names)

    # Pick One
    w.locator(".btn-settings-done").click()
    page.wait_for_timeout(500)
    w.locator(".btn-pick").click()
    page.wait_for_timeout(2500) # Wait for animation

    # Group Mode
    w.locator(".btn-settings").click()
    page.wait_for_timeout(500)
    w.locator(".inp-mode").select_option("groups")
    w.locator(".inp-group-size").fill("3")
    w.locator(".btn-settings-done").click()
    page.wait_for_timeout(500)
    w.locator(".btn-pick").click()
    page.wait_for_timeout(2000)

def scenario_sound(page):
    page.evaluate("spawnWidget('sound')")
    w = page.locator(".widget", has_text="Noise Level")
    w.wait_for()

    # Inject script to mock microphone visual
    page.evaluate("""
        const bar = document.querySelector('.mic-bar');
        if(bar) {
            let h = 10;
            setInterval(() => {
                h = Math.random() * 80 + 10;
                bar.style.height = h + '%';
            }, 100);
        }
    """)

    # Click Enable (even though we mock, it changes UI state)
    # We need to mock getUserMedia to avoid error
    page.evaluate("navigator.mediaDevices.getUserMedia = () => Promise.resolve(new MediaStream())")
    w.locator(".btn-mic-start").click()
    page.wait_for_timeout(3000)

def scenario_drawing(page):
    page.evaluate("spawnWidget('drawing')")
    w = page.locator(".widget", has_text="Sketch")
    w.wait_for()

    # Locate canvas
    canvas = w.locator("canvas")
    box = canvas.bounding_box()

    if box:
        # Draw a smile
        # Left eye
        page.mouse.move(box["x"] + 100, box["y"] + 100)
        page.mouse.down()
        page.mouse.move(box["x"] + 100, box["y"] + 101) # dot
        page.mouse.up()

        # Right eye
        page.mouse.move(box["x"] + 200, box["y"] + 100)
        page.mouse.down()
        page.mouse.move(box["x"] + 200, box["y"] + 101) # dot
        page.mouse.up()

        # Smile
        page.mouse.move(box["x"] + 80, box["y"] + 180)
        page.mouse.down()
        page.mouse.move(box["x"] + 150, box["y"] + 220)
        page.mouse.move(box["x"] + 220, box["y"] + 180)
        page.mouse.up()

    page.wait_for_timeout(1000)

    # Change color (requires hover to show tools)
    w.hover()
    page.wait_for_timeout(500)
    w.locator(".btn-color[data-color='#ef4444']").click() # Red

    # Draw red line
    page.mouse.move(box["x"] + 50, box["y"] + 50)
    page.mouse.down()
    page.mouse.move(box["x"] + 300, box["y"] + 50)
    page.mouse.up()

    page.wait_for_timeout(1500)

def scenario_backgrounds(page):
    page.wait_for_timeout(500)

    # Open BG Menu
    page.locator("#btn-bg-menu").click()
    page.wait_for_timeout(1000)

    # Select gradients/colors
    page.locator(".bg-opt").nth(1).click() # Gradient
    page.wait_for_timeout(1500)

    page.locator("#btn-bg-menu").click()
    page.locator(".bg-opt").nth(2).click() # Emerald
    page.wait_for_timeout(1500)

    page.locator("#btn-bg-menu").click()
    page.locator(".bg-opt").last.click() # Grid
    page.wait_for_timeout(1500)

def scenario_save_load(page):
    # Add a widget to make it interesting
    page.evaluate("spawnWidget('clock')")
    page.wait_for_timeout(1000)

    # Click Save
    # We need to handle the prompt.
    # Playwright can handle dialogs.

    def handle_dialog(dialog):
        dialog.accept("My Demo Dashboard")

    page.on("dialog", handle_dialog)

    page.locator("#btn-save").click()
    page.wait_for_timeout(2000) # Wait for toast "Saved!"

    # Open Load Menu
    page.locator("#btn-my-dashboards").click()
    page.wait_for_timeout(1000)

    # Rename
    page.locator(".btn-edit").first.click()
    page.wait_for_timeout(500)
    page.locator(".dashboard-rename-input").first.fill("Renamed Dashboard")
    page.locator(".dashboard-rename-input").first.press("Enter")
    page.wait_for_timeout(1000)

    # Close
    page.locator("#btn-my-dashboards").click()

def scenario_poll(page):
    page.evaluate("spawnWidget('poll')")
    w = page.locator(".widget", has_text="Quick Poll")
    w.wait_for()

    # Settings
    w.locator(".btn-settings").click()
    page.wait_for_timeout(500)

    w.locator(".inp-opt-a").fill("Pizza")
    w.locator(".inp-opt-b").fill("Tacos")
    w.locator(".btn-settings-done").click()
    page.wait_for_timeout(1000)

    # Vote A
    w.locator(".btn-vote").first.click()
    page.wait_for_timeout(1000)

    # Vote B
    w.locator(".btn-vote").last.click()
    page.wait_for_timeout(1000)

    # Reset
    w.locator(".btn-reset").click()
    page.wait_for_timeout(1000)

def scenario_teacher_session(page):
    # Start Session
    page.locator("#btn-start-session").click()
    page.wait_for_selector("#session-menu", state="visible")
    page.locator("#btn-menu-start-session").click()
    page.wait_for_selector("#session-indicator", state="visible")
    page.wait_for_timeout(1500)

    # Copy Link
    page.locator("#btn-copy-link").click()
    page.wait_for_timeout(2000)

    # Pause
    page.wait_for_timeout(1000)
    # Force open menu if toggle fails
    page.evaluate("document.getElementById('session-menu').classList.remove('hidden')")
    page.wait_for_selector("#session-menu", state="visible")
    page.locator("#btn-menu-pause").click()
    page.wait_for_timeout(2000) # Wait for toast/update

    # Resume
    page.wait_for_timeout(1000)
    page.evaluate("document.getElementById('session-menu').classList.remove('hidden')")
    page.wait_for_selector("#session-menu", state="visible")
    page.locator("#btn-menu-resume").click()
    page.wait_for_timeout(2000)

    # End Session
    page.locator("#btn-end-session").click()
    page.wait_for_timeout(1500)

def scenario_student_join(page):
    # Simulate loading with join code via URL param wouldn't work because we load local file.
    # We use the Join Screen manually.

    page.locator("#student-join-screen").evaluate("el => el.classList.remove('hidden')")
    page.locator("#toolbar-container").evaluate("el => el.classList.add('hidden')")
    page.wait_for_timeout(1000)

    # Enter Code
    page.locator("#join-code-input").fill("DEMO12")
    page.wait_for_timeout(500)
    page.locator("#btn-join-session").click()

    # Wait for student header
    page.locator("#student-header").wait_for()
    page.wait_for_timeout(2000)

    # Verify pinned widget (mocked in joinSession response)
    w = page.locator(".widget", has_text="Clock (Shared)")
    w.wait_for()
    page.wait_for_timeout(2000)

    # Leave
    page.locator("#btn-leave-session").click()
    page.wait_for_timeout(1000)

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    with sync_playwright() as p:
        record_scenario(p, "clock", scenario_clock)
        record_scenario(p, "timer", scenario_timer)
        record_scenario(p, "traffic", scenario_traffic)
        record_scenario(p, "dice", scenario_dice)
        record_scenario(p, "qr", scenario_qr)
        record_scenario(p, "text", scenario_text)
        record_scenario(p, "checklist", scenario_checklist)
        record_scenario(p, "timetable", scenario_timetable)
        record_scenario(p, "embed", scenario_embed)
        record_scenario(p, "random", scenario_random)
        record_scenario(p, "sound", scenario_sound)
        record_scenario(p, "drawing", scenario_drawing)
        record_scenario(p, "poll", scenario_poll)
        record_scenario(p, "backgrounds", scenario_backgrounds)
        record_scenario(p, "save_load", scenario_save_load)
        record_scenario(p, "teacher_session", scenario_teacher_session)
        record_scenario(p, "student_join", scenario_student_join)

if __name__ == "__main__":
    main()
