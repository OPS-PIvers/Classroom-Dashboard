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
                    },
                    getScriptUrl: function() {
                         if (this.successCallback) this.successCallback("https://script.google.com/macros/s/...");
                    }
                }
            }
        };
        window.spawnWidget = window.spawnWidget || function() { console.log("Real spawnWidget not ready yet"); };
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

            // Calculate translation to center (x,y) on screen
            // T = (ScreenCenter - Point) * Scale
            // But wait, we want to zoom INTO (x,y).
            // transform-origin is default center.
            // Let's set transform-origin to 0 0 to be simple.
            container.style.transformOrigin = '0 0';
            container.style.transition = 'transform 1.2s cubic-bezier(0.25, 1, 0.5, 1)';

            if (scale === 1) {
                container.style.transform = 'translate(0, 0) scale(1)';
            } else {
                // We want (x,y) of the content to be at center of screen (w/2, h/2)
                // tx = w/2 - x*scale
                // ty = h/2 - y*scale
                const tx = (w/2) - (x * scale);
                const ty = (h/2) - (y * scale);
                container.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
            }
        };
    """)

class Director:
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
        self.move_to(locator)
        self.page.wait_for_timeout(100)
        locator.click()
        self.page.wait_for_timeout(300)

    def type(self, locator, text):
        self.click(locator)
        locator.type(text, delay=100) # Slow typing
        self.page.wait_for_timeout(500)

    def zoom_to_widget(self, locator):
        # Wait for widget animation/rendering
        self.page.wait_for_timeout(500)
        box = locator.bounding_box()
        if box:
            cx = box['x'] + box['width'] / 2
            cy = box['y'] + box['height'] / 2

            # Calculate needed scale
            # Target height is 60% of screen height
            target_h = 720 * 0.6
            scale = target_h / box['height']
            if scale < 1.2: scale = 1.2 # Minimum zoom
            if scale > 2.5: scale = 2.5 # Max zoom

            self.page.evaluate(f"window.setCamera({cx}, {cy}, {scale})")
            self.page.wait_for_timeout(1200) # Wait for zoom

    def reset_camera(self):
        self.page.evaluate("window.setCamera(0, 0, 1)")
        self.page.wait_for_timeout(1200)

def record_scenario(playwright, name, action_callback):
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

    context.close()
    browser.close()

    video_path = page.video.path()
    if video_path and os.path.exists(video_path):
        new_path = os.path.join(OUTPUT_DIR, f"{name}.webm")
        if os.path.exists(new_path):
            os.remove(new_path)
        os.rename(video_path, new_path)
        print(f"Saved video: {new_path}")

# --- Scenarios ---

def scenario_clock(d):
    d.page.evaluate("spawnWidget('clock')")
    w = d.page.locator(".widget", has_text="Clock")
    w.wait_for()
    d.zoom_to_widget(w)

    d.click(w.locator(".btn-settings"))
    d.click(w.locator(".inp-24h"))
    d.click(w.locator(".btn-settings-done"))
    d.reset_camera()

def scenario_timer(d):
    d.page.evaluate("spawnWidget('timer')")
    w = d.page.locator(".widget", has_text="Timer")
    w.wait_for()
    d.zoom_to_widget(w)

    d.click(w.locator(".btn-start"))
    d.page.wait_for_timeout(2000)
    d.click(w.locator(".btn-pause"))
    d.click(w.locator(".btn-reset"))

    d.click(w.locator(".btn-settings"))
    d.page.locator(".inp-min").fill("1") # Direct fill for inputs without click sometimes better
    d.click(w.locator(".btn-settings-done"))
    d.reset_camera()

def scenario_traffic(d):
    d.page.evaluate("spawnWidget('traffic')")
    w = d.page.locator(".widget", has_text="Signal")
    w.wait_for()
    d.zoom_to_widget(w)

    d.click(w.locator(".traffic-light[data-color='red']"))
    d.click(w.locator(".traffic-light[data-color='yellow']"))
    d.click(w.locator(".traffic-light[data-color='green']"))
    d.reset_camera()

def scenario_dice(d):
    d.page.evaluate("spawnWidget('dice')")
    w = d.page.locator(".widget", has_text="Dice")
    w.wait_for()
    d.zoom_to_widget(w)

    d.click(w.locator(".btn-roll"))
    d.page.wait_for_timeout(1000)

    d.click(w.locator(".btn-settings"))
    d.page.locator(".inp-count").select_option("3")
    d.click(w.locator(".btn-settings-done"))

    d.click(w.locator(".btn-roll"))
    d.page.wait_for_timeout(1000)
    d.reset_camera()

def scenario_qr(d):
    d.page.evaluate("spawnWidget('qr')")
    w = d.page.locator(".widget", has_text="QR Code")
    w.wait_for()
    d.zoom_to_widget(w)

    d.click(w.locator(".btn-settings"))
    d.type(w.locator(".inp-url"), "https://classroom.google.com")
    d.click(w.locator(".btn-settings-done"))
    d.reset_camera()

def scenario_text(d):
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
    d.page.evaluate("spawnWidget('checklist')")
    w = d.page.locator(".widget", has_text="Checklist")
    w.wait_for()
    d.zoom_to_widget(w)

    d.click(w.locator(".btn-settings"))
    d.type(w.locator(".inp-list"), "Turn in Homework") # Simplified for smooth typing
    d.click(w.locator(".btn-update"))
    d.click(w.locator(".check-item input").first)
    d.reset_camera()

def scenario_timetable(d):
    d.page.evaluate("spawnWidget('timetable')")
    w = d.page.locator(".widget", has_text="Timetable")
    w.wait_for()
    d.zoom_to_widget(w)

    d.click(w.locator(".btn-settings"))
    d.type(w.locator(".inp-data"), "09:00 | Mathematics")
    d.click(w.locator(".btn-apply"))
    d.reset_camera()

def scenario_embed(d):
    d.page.evaluate("spawnWidget('embed')")
    w = d.page.locator(".widget", has_text="Embed")
    w.wait_for()
    d.zoom_to_widget(w)

    d.click(w.locator(".btn-settings"))
    d.type(w.locator(".inp-embed"), "https://example.com")
    d.click(w.locator(".btn-load"))
    d.reset_camera()

def scenario_random(d):
    d.page.evaluate("spawnWidget('random')")
    w = d.page.locator(".widget", has_text="Name Picker")
    w.wait_for()
    d.zoom_to_widget(w)

    d.click(w.locator(".btn-settings"))
    # Use fill for long text to save time, typing animation too long here
    d.page.locator(".inp-list").fill("Emily\\nMichael\\nJacob\\nJoshua\\nMatthew")
    d.click(w.locator(".btn-settings-done"))
    d.click(w.locator(".btn-pick"))
    d.page.wait_for_timeout(2000)
    d.reset_camera()

def scenario_sound(d):
    d.page.evaluate("spawnWidget('sound')")
    w = d.page.locator(".widget", has_text="Noise Level")
    w.wait_for()
    d.zoom_to_widget(w)

    d.page.evaluate("""
        const bar = document.querySelector('.mic-bar');
        if(bar) {
            let h = 10;
            setInterval(() => { h = Math.random() * 80 + 10; bar.style.height = h + '%'; }, 100);
        }
    """)
    d.page.evaluate("navigator.mediaDevices.getUserMedia = () => Promise.resolve(new MediaStream())")
    d.click(w.locator(".btn-mic-start"))
    d.page.wait_for_timeout(3000)
    d.reset_camera()

def scenario_drawing(d):
    d.page.evaluate("spawnWidget('drawing')")
    w = d.page.locator(".widget", has_text="Sketch")
    w.wait_for()
    d.zoom_to_widget(w)

    canvas = w.locator("canvas")
    box = canvas.bounding_box()

    # Custom draw implementation via mouse moves
    d.page.mouse.move(box["x"] + 100, box["y"] + 100)
    d.page.mouse.down()
    d.page.mouse.move(box["x"] + 200, box["y"] + 100, steps=20)
    d.page.mouse.up()

    d.move_to(w) # Hover to show tools
    d.click(w.locator(".btn-color[data-color='#ef4444']"))

    d.page.mouse.move(box["x"] + 50, box["y"] + 50)
    d.page.mouse.down()
    d.page.mouse.move(box["x"] + 300, box["y"] + 300, steps=20)
    d.page.mouse.up()
    d.reset_camera()

def scenario_poll(d):
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
    d.click(d.page.locator("#btn-bg-menu"))
    d.click(d.page.locator(".bg-opt").nth(1))
    d.click(d.page.locator("#btn-bg-menu"))
    d.click(d.page.locator(".bg-opt").nth(2))
    d.click(d.page.locator("#btn-bg-menu"))
    d.click(d.page.locator(".bg-opt").last)

def scenario_save_load(d):
    d.page.evaluate("spawnWidget('clock')")
    d.page.on("dialog", lambda dialog: dialog.accept("Demo Dashboard"))
    d.click(d.page.locator("#btn-save"))
    d.page.wait_for_timeout(1000)
    d.click(d.page.locator("#btn-my-dashboards"))
    d.click(d.page.locator(".btn-edit").first)
    d.type(d.page.locator(".dashboard-rename-input").first, "Renamed")
    d.page.locator(".dashboard-rename-input").first.press("Enter")
    d.click(d.page.locator("#btn-my-dashboards"))

def scenario_teacher_session(d):
    d.click(d.page.locator("#btn-start-session"))
    d.click(d.page.locator("#btn-menu-start-session"))
    d.page.wait_for_timeout(1000)
    d.click(d.page.locator("#btn-copy-link"))

    d.page.wait_for_timeout(1000)
    d.page.evaluate("document.getElementById('session-menu').classList.remove('hidden')")
    d.click(d.page.locator("#btn-menu-pause"))

    d.page.wait_for_timeout(1000)
    d.page.evaluate("document.getElementById('session-menu').classList.remove('hidden')")
    d.click(d.page.locator("#btn-menu-resume"))

    d.click(d.page.locator("#btn-end-session"))

def scenario_student_join(d):
    d.page.locator("#student-join-screen").evaluate("el => el.classList.remove('hidden')")
    d.page.locator("#toolbar-container").evaluate("el => el.classList.add('hidden')")
    d.type(d.page.locator("#join-code-input"), "DEMO12")
    d.click(d.page.locator("#btn-join-session"))
    d.page.wait_for_timeout(2000)
    d.click(d.page.locator("#btn-leave-session"))

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
