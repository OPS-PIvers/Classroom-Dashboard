"""
Comprehensive Demo Recording Script for Classroom Dashboard.

This script automates the recording of "cinematic" demo videos for all widgets
and system features using Playwright. It generates separate .webm video files
for each scenario, intended for use in a product release video.

Features:
- "Cinematic Mode": Injects a custom cursor and smooth camera pan/zoom.
- Mocks: Simulates Google Apps Script backend and hardware (microphone/camera).
- Scenarios: Covers 17 distinct features/widgets.
- Usage: python verification/record_all.py [scenarios...]
"""

import os
import sys
import argparse
from playwright.sync_api import sync_playwright

# Constants
OUTPUT_DIR = "videos/"
URL_FILE = f"file://{os.path.abspath('index.html')}"
ZOOM_MIN_SCALE = 1.2
ZOOM_MAX_SCALE = 2.5
ZOOM_TARGET_HEIGHT_RATIO = 0.6

def mock_google_script(page):
    """Injects the google.script.run mock into the page using a robust builder pattern."""
    page.evaluate("""
        window.google = {
            script: {
                run: (function() {
                    function Runner(success, failure) {
                        this._success = success;
                        this._failure = failure;
                    }

                    Runner.prototype.withSuccessHandler = function(cb) {
                        return new Runner(cb, this._failure);
                    };

                    Runner.prototype.withFailureHandler = function(cb) {
                        return new Runner(this._success, cb);
                    };

                    // Define API methods
                    const methods = {
                        createSession: function(data) {
                            if (this._success) {
                                this._success({
                                    success: true,
                                    code: 'DEMO12',
                                    data: JSON.parse(data)
                                });
                            }
                        },
                        joinSession: function(code) {
                            if (this._success) {
                                this._success({
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
                            if (this._success) {
                                this._success({
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
                        updateSession: function(code, data) {
                            console.log("Session updated");
                        },
                        setSessionPaused: function(code, paused) {
                            if (this._success) this._success({ success: true, paused: paused });
                        },
                        endSession: function(code) {
                            if (this._success) this._success({ success: true });
                        },
                        saveDashboard: function(name, state) {
                            if (this._success) this._success({ success: true, message: 'Saved!' });
                        },
                        getDashboards: function() {
                            if (this._success) this._success(JSON.stringify({
                                'My Saved Dashboard': { bg: 'bg-slate-900', widgets: [] }
                            }));
                        },
                        updateWidgetState: function(code, id, state) {
                            console.log("Widget updated");
                        },
                        submitPollResponse: function(code, id, opt) {
                            if (this._success) this._success({ success: true, polls: {A: 1, B: 0} });
                        },
                        getScriptUrl: function() {
                            if (this._success) this._success("https://script.google.com/macros/s/...");
                        }
                    };

                    // Attach methods to Runner prototype
                    Object.assign(Runner.prototype, methods);

                    // Return a default instance which serves as the root google.script.run
                    return new Runner(null, null);
                })()
            }
        };
        window.spawnWidget = window.spawnWidget || function() {
            throw new Error("spawnWidget called before it is ready");
        };
    """)

def inject_cinematic_styles(page):
    """Injects CSS/JS for custom cursor and camera animations."""
    page.evaluate("""
        // Inject Cursor
        const cursor = document.createElement('div');
        cursor.className = 'cinematic-cursor';
        cursor.innerHTML = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 2L26 16L16 18L14 28L6 2Z" fill="black" stroke="white" stroke-width="2" stroke-linejoin="round"/>
        </svg>`;
        Object.assign(cursor.style, {
            position: 'fixed', top: '0', left: '0', pointerEvents: 'none', zIndex: '100000',
            transition: 'transform 0.1s cubic-bezier(0.2, 0, 0.2, 1)', transformOrigin: 'top left'
        });
        document.body.appendChild(cursor);

        // Track mouse
        let mouseX = 0, mouseY = 0;
        document.addEventListener('mousemove', e => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            cursor.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
        });

        document.addEventListener('mousedown', () => {
            cursor.innerHTML = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 2L26 16L16 18L14 28L6 2Z" fill="#4f46e5" stroke="white" stroke-width="2" stroke-linejoin="round"/>
            </svg>`;
            cursor.style.transform = `translate(${mouseX}px, ${mouseY}px) scale(0.8)`;
        });

        document.addEventListener('mouseup', () => {
            cursor.innerHTML = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 2L26 16L16 18L14 28L6 2Z" fill="black" stroke="white" stroke-width="2" stroke-linejoin="round"/>
            </svg>`;
            cursor.style.transform = `translate(${mouseX}px, ${mouseY}px) scale(1)`;
        });

        // Camera Control
        window.setCamera = function(x, y, scale) {
            const container = document.getElementById('app-container');
            const w = window.innerWidth;
            const h = window.innerHeight;
            container.style.transformOrigin = '0 0';
            container.style.transition = 'transform 1.2s cubic-bezier(0.25, 1, 0.5, 1)';

            if (scale === 1) {
                container.style.transform = 'translate(0, 0) scale(1)';
            } else {
                const tx = (w/2) - (x * scale);
                const ty = (h/2) - (y * scale);
                container.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
            }
        };
    """)

class Director:
    """Helper class for cinematic interactions."""
    def __init__(self, page):
        self.page = page

    def move_to(self, locator):
        """Smooth move to center of locator."""
        box = locator.bounding_box()
        if box:
            x = box['x'] + box['width'] / 2
            y = box['y'] + box['height'] / 2
            self.page.mouse.move(x, y, steps=30)
            return x, y
        return 0, 0

    def click(self, locator):
        """Cinematic click: move, wait, click, wait."""
        self.move_to(locator)
        self.page.wait_for_timeout(100)
        locator.click()
        self.page.wait_for_timeout(300)

    def type(self, locator, text):
        """Cinematic type: click then slow type (simulates user typing)."""
        self.click(locator)
        locator.type(text, delay=100)
        self.page.wait_for_timeout(500)

    def fill(self, locator, text):
        """Immediate fill: moves to element then fills value (for replacements)."""
        self.move_to(locator)
        self.page.wait_for_timeout(100)
        locator.fill(text)
        self.page.wait_for_timeout(300)

    def press(self, locator, key):
        """Press a key on the element."""
        self.move_to(locator)
        locator.press(key)
        self.page.wait_for_timeout(300)

    def zoom_to_widget(self, locator):
        """Zooms the camera to frame the widget."""
        self.page.wait_for_timeout(500)
        box = locator.bounding_box()
        if box:
            cx = box['x'] + box['width'] / 2
            cy = box['y'] + box['height'] / 2

            target_h = 720 * ZOOM_TARGET_HEIGHT_RATIO
            scale = target_h / box['height']
            if scale < ZOOM_MIN_SCALE: scale = ZOOM_MIN_SCALE
            if scale > ZOOM_MAX_SCALE: scale = ZOOM_MAX_SCALE

            self.page.evaluate(f"window.setCamera({cx}, {cy}, {scale})")
            self.page.wait_for_timeout(1200)

    def reset_camera(self):
        """Resets camera to default view."""
        self.page.evaluate("window.setCamera(0, 0, 1)")
        self.page.wait_for_timeout(1200)

def record_scenario(playwright, name, action_callback):
    """Records a single scenario to a video file."""
    print(f"--- Recording Scenario: {name} ---")
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(
        record_video_dir=OUTPUT_DIR,
        record_video_size={"width": 1280, "height": 720},
        viewport={"width": 1280, "height": 720}
    )
    page = context.new_page()
    page.goto(URL_FILE)

    mock_google_script(page)
    inject_cinematic_styles(page)

    director = Director(page)
    try:
        action_callback(director)
    except Exception as e:
        print(f"Error in scenario {name}: {e}")
        import traceback
        traceback.print_exc()

    # Retrieve path before closing context
    video_path = page.video.path()

    context.close()
    browser.close()

    if video_path and os.path.exists(video_path):
        new_path = os.path.join(OUTPUT_DIR, f"{name}.webm")
        if os.path.exists(new_path):
            os.remove(new_path)
        os.rename(video_path, new_path)
        print(f"Saved video: {new_path}")
    else:
        print(f"Warning: Video file not found for {name}")

# --- Scenarios ---

def scenario_clock(d):
    """Demonstrates Clock widget: spawn, settings, 24h toggle."""
    d.page.evaluate("spawnWidget('clock')")
    w = d.page.locator(".widget", has_text="Clock")
    w.wait_for()
    d.zoom_to_widget(w)

    d.click(w.locator(".btn-settings"))
    d.click(w.locator(".inp-24h"))
    d.click(w.locator(".btn-settings-done"))
    d.reset_camera()

def scenario_timer(d):
    """Demonstrates Timer widget: start, pause, reset, settings."""
    d.page.evaluate("spawnWidget('timer')")
    w = d.page.locator(".widget", has_text="Timer")
    w.wait_for()
    d.zoom_to_widget(w)

    d.click(w.locator(".btn-start"))
    d.page.wait_for_timeout(2000)
    d.click(w.locator(".btn-pause"))
    d.click(w.locator(".btn-reset"))

    d.click(w.locator(".btn-settings"))
    d.type(w.locator(".inp-min"), "1")
    d.click(w.locator(".btn-settings-done"))
    d.reset_camera()

def scenario_traffic(d):
    """Demonstrates Traffic Light widget interaction."""
    d.page.evaluate("spawnWidget('traffic')")
    w = d.page.locator(".widget", has_text="Signal")
    w.wait_for()
    d.zoom_to_widget(w)

    d.click(w.locator(".traffic-light[data-color='red']"))
    d.click(w.locator(".traffic-light[data-color='yellow']"))
    d.click(w.locator(".traffic-light[data-color='green']"))
    d.reset_camera()

def scenario_dice(d):
    """Demonstrates Dice widget: roll and count change."""
    d.page.evaluate("spawnWidget('dice')")
    w = d.page.locator(".widget", has_text="Dice")
    w.wait_for()
    d.zoom_to_widget(w)

    d.click(w.locator(".btn-roll"))
    d.page.wait_for_timeout(1000)

    d.click(w.locator(".btn-settings"))
    d.click(w.locator(".inp-count")) # Focus first
    w.locator(".inp-count").select_option("3") # Standard select
    d.click(w.locator(".btn-settings-done"))

    d.click(w.locator(".btn-roll"))
    d.page.wait_for_timeout(1000)
    d.reset_camera()

def scenario_qr(d):
    """Demonstrates QR Code widget: URL update."""
    d.page.evaluate("spawnWidget('qr')")
    w = d.page.locator(".widget", has_text="QR Code")
    w.wait_for()
    d.zoom_to_widget(w)

    d.click(w.locator(".btn-settings"))
    d.type(w.locator(".inp-url"), "https://classroom.google.com")
    d.click(w.locator(".btn-settings-done"))
    d.reset_camera()

def scenario_text(d):
    """Demonstrates Text widget: typing and styling."""
    d.page.evaluate("spawnWidget('text')")
    w = d.page.locator(".widget", has_text="Note")
    w.wait_for()
    d.zoom_to_widget(w)

    d.type(w.locator(".widget-content div[contenteditable]"), "Welcome to Class!")

    d.click(w.locator(".btn-settings"))
    d.click(w.locator(".bg-picker").nth(1))
    d.click(w.locator(".btn-settings-done"))
    d.reset_camera()

def scenario_checklist(d):
    """Demonstrates Checklist widget: adding items and checking."""
    d.page.evaluate("spawnWidget('checklist')")
    w = d.page.locator(".widget", has_text="Checklist")
    w.wait_for()
    d.zoom_to_widget(w)

    d.click(w.locator(".btn-settings"))
    d.type(w.locator(".inp-list"), "Turn in Homework")
    d.click(w.locator(".btn-update"))
    d.click(w.locator(".check-item input").first)
    d.reset_camera()

def scenario_timetable(d):
    """Demonstrates Timetable widget: data entry."""
    d.page.evaluate("spawnWidget('timetable')")
    w = d.page.locator(".widget", has_text="Timetable")
    w.wait_for()
    d.zoom_to_widget(w)

    d.click(w.locator(".btn-settings"))
    d.type(w.locator(".inp-data"), "09:00 | Mathematics")
    d.click(w.locator(".btn-apply"))
    d.reset_camera()

def scenario_embed(d):
    """Demonstrates Embed widget: loading URL."""
    d.page.evaluate("spawnWidget('embed')")
    w = d.page.locator(".widget", has_text="Embed")
    w.wait_for()
    d.zoom_to_widget(w)

    d.click(w.locator(".btn-settings"))
    d.type(w.locator(".inp-embed"), "https://example.com")
    d.click(w.locator(".btn-load"))
    d.reset_camera()

def scenario_random(d):
    """Demonstrates Name Picker: 2004 names and group mode."""
    d.page.evaluate("spawnWidget('random')")
    w = d.page.locator(".widget", has_text="Name Picker")
    w.wait_for()
    d.zoom_to_widget(w)

    d.click(w.locator(".btn-settings"))
    d.fill(w.locator(".inp-list"), "Emily\\nMichael\\nJacob\\nJoshua\\nMatthew")
    d.click(w.locator(".btn-settings-done"))
    d.click(w.locator(".btn-pick"))
    d.page.wait_for_timeout(2000)
    d.reset_camera()

def scenario_sound(d):
    """Demonstrates Sound widget: mocks mic visual."""
    d.page.evaluate("spawnWidget('sound')")
    w = d.page.locator(".widget", has_text="Noise Level")
    w.wait_for()
    d.zoom_to_widget(w)

    # Mock getUserMedia BEFORE clicking
    d.page.evaluate("navigator.mediaDevices.getUserMedia = () => Promise.resolve(new MediaStream())")

    d.click(w.locator(".btn-mic-start"))

    # Inject interval for visual
    d.page.evaluate("""
        const bar = document.querySelector('.mic-bar');
        if(bar) {
            window.__micBarInterval = setInterval(() => {
                let h = Math.random() * 80 + 10;
                bar.style.height = h + '%';
            }, 100);
        }
    """)

    d.page.wait_for_timeout(3000)

    # Clear interval
    d.page.evaluate("window.__micBarInterval && clearInterval(window.__micBarInterval)")
    d.reset_camera()

def scenario_drawing(d):
    """Demonstrates Drawing widget: custom mouse moves."""
    d.page.evaluate("spawnWidget('drawing')")
    w = d.page.locator(".widget", has_text="Sketch")
    w.wait_for()
    d.zoom_to_widget(w)

    canvas = w.locator("canvas")
    box = canvas.bounding_box()
    if not box:
        raise RuntimeError("Canvas bounding box not found")

    d.page.mouse.move(box["x"] + 100, box["y"] + 100)
    d.page.mouse.down()
    d.page.mouse.move(box["x"] + 200, box["y"] + 100, steps=20)
    d.page.mouse.up()

    d.move_to(w)
    d.click(w.locator(".btn-color[data-color='#ef4444']"))

    d.page.mouse.move(box["x"] + 50, box["y"] + 50)
    d.page.mouse.down()
    d.page.mouse.move(box["x"] + 300, box["y"] + 300, steps=20)
    d.page.mouse.up()
    d.reset_camera()

def scenario_poll(d):
    """Demonstrates Poll widget: voting."""
    d.page.evaluate("spawnWidget('poll')")
    w = d.page.locator(".widget", has_text="Quick Poll")
    w.wait_for()
    d.zoom_to_widget(w)

    d.click(w.locator(".btn-settings"))
    d.type(w.locator(".inp-opt-a"), "Yes")
    d.type(w.locator(".inp-opt-b"), "No")
    d.click(w.locator(".btn-settings-done"))

    d.click(w.locator(".btn-vote").first)
    d.click(w.locator(".btn-vote").last)
    d.click(w.locator(".btn-reset"))
    d.reset_camera()

def scenario_backgrounds(d):
    """Demonstrates switching backgrounds."""
    d.click(d.page.locator("#btn-bg-menu"))
    d.click(d.page.locator(".bg-opt").nth(1))
    d.click(d.page.locator("#btn-bg-menu"))
    d.click(d.page.locator(".bg-opt").nth(2))
    d.click(d.page.locator("#btn-bg-menu"))
    d.click(d.page.locator(".bg-opt").last)

def scenario_save_load(d):
    """Demonstrates Save/Load with Dialog handling."""
    d.page.evaluate("spawnWidget('clock')")
    d.page.once("dialog", lambda dialog: dialog.accept("Demo Dashboard"))
    d.click(d.page.locator("#btn-save"))
    d.page.wait_for_timeout(1000)
    d.click(d.page.locator("#btn-my-dashboards"))
    d.click(d.page.locator(".btn-edit").first)
    d.fill(d.page.locator(".dashboard-rename-input").first, "Renamed")
    d.press(d.page.locator(".dashboard-rename-input").first, "Enter")
    d.click(d.page.locator("#btn-my-dashboards"))

def scenario_teacher_session(d):
    """Demonstrates Live Session controls."""
    d.click(d.page.locator("#btn-start-session"))
    d.click(d.page.locator("#btn-menu-start-session"))
    d.page.wait_for_timeout(1000)
    d.click(d.page.locator("#btn-copy-link"))

    d.page.wait_for_timeout(1000)
    # Force open menu if toggle fails (robustness for demo recording)
    d.page.evaluate("document.getElementById('session-menu').classList.remove('hidden')")
    d.click(d.page.locator("#btn-menu-pause"))

    d.page.wait_for_timeout(1000)
    d.page.evaluate("document.getElementById('session-menu').classList.remove('hidden')")
    d.click(d.page.locator("#btn-menu-resume"))

    d.click(d.page.locator("#btn-end-session"))

def scenario_student_join(d):
    """Demonstrates Student View via simulated Join."""
    d.page.locator("#student-join-screen").evaluate("el => el.classList.remove('hidden')")
    d.page.locator("#toolbar-container").evaluate("el => el.classList.add('hidden')")
    d.type(d.page.locator("#join-code-input"), "DEMO12")
    d.click(d.page.locator("#btn-join-session"))
    d.page.wait_for_timeout(2000)
    d.click(d.page.locator("#btn-leave-session"))

def main():
    if not os.path.exists('index.html'):
        print("Error: index.html not found. Run from project root.")
        sys.exit(1)

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    scenarios = {
        "clock": scenario_clock,
        "timer": scenario_timer,
        "traffic": scenario_traffic,
        "dice": scenario_dice,
        "qr": scenario_qr,
        "text": scenario_text,
        "checklist": scenario_checklist,
        "timetable": scenario_timetable,
        "embed": scenario_embed,
        "random": scenario_random,
        "sound": scenario_sound,
        "drawing": scenario_drawing,
        "poll": scenario_poll,
        "backgrounds": scenario_backgrounds,
        "save_load": scenario_save_load,
        "teacher_session": scenario_teacher_session,
        "student_join": scenario_student_join
    }

    parser = argparse.ArgumentParser(description="Record demo videos for Classroom Dashboard.")
    parser.add_argument("names", nargs="*", help="Names of scenarios to run (default: all)")
    args = parser.parse_args()

    to_run = args.names if args.names else scenarios.keys()

    with sync_playwright() as p:
        for name in to_run:
            if name in scenarios:
                record_scenario(p, name, scenarios[name])
            else:
                print(f"Warning: Scenario '{name}' not found.")

if __name__ == "__main__":
    main()
