// ------------------ START: Manual Configuration ------------------

// TODO: Replace with your actual Google Sheet ID
const SPREADSHEET_ID = "1Saf2NQ2IkhgWV9ks-9q2dvgporkMixnrPcWB8jqZNDA";

// ------------------ END: Manual Configuration --------------------

/**
 * Serves the HTML file when the Web App URL is visited.
 */
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Classroom Dashboard')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL) // Allows embedding in Google Sites
    .addMetaTag('viewport', 'width=device-width, initial-scale=1'); // Ensures mobile responsiveness
}

/**
 * Gets the sheet where the dashboards are stored.
 * @returns {Sheet} The sheet object.
 */
function getSheet() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = spreadsheet.getSheetByName("Dashboards");
    if (!sheet) {
      sheet = spreadsheet.insertSheet("Dashboards");
      sheet.appendRow(["User Email", "Dashboard JSON", "Last Saved"]);
    }
    return sheet;
  } catch (e) {
    Logger.log("Error opening spreadsheet: " + e);
    // Return a more user-friendly error to the front-end
    throw new Error("Could not open the configuration spreadsheet. Please check the SPREADSHEET_ID in Code.js.");
  }
}

/**
 * Helper to get user row and data
 */
function getUserData(sheet, userEmail) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == userEmail) {
      let jsonData = data[i][1];
      let dashboards = {};
      try {
        if (jsonData) {
          const parsed = JSON.parse(jsonData);
          // Check if legacy format (direct dashboard object) or new format (map of dashboards)
          // Legacy format has 'widgets' array or 'bg' string.
          if ((parsed.widgets && Array.isArray(parsed.widgets)) || (parsed.bg && typeof parsed.bg === 'string')) {
            dashboards["Default"] = parsed;
          } else {
            dashboards = parsed;
          }
        }
      } catch (e) {
        Logger.log("Error parsing JSON: " + e);
      }
      return { row: i + 1, dashboards: dashboards };
    }
  }
  return { row: -1, dashboards: {} };
}

/**
 * Saves a dashboard by name.
 * @param {string} name The name of the dashboard.
 * @param {string} dashboardJson The JSON string of the dashboard configuration.
 */
function saveDashboard(name, dashboardJson) {
  try {
    const sheet = getSheet();
    const userEmail = Session.getActiveUser().getEmail();
    if (!userEmail) throw new Error("Could not identify user.");
    
    const { row, dashboards } = getUserData(sheet, userEmail);
    
    // Update or add the specific dashboard
    dashboards[name] = JSON.parse(dashboardJson);
    
    const timestamp = new Date();
    const newJsonData = JSON.stringify(dashboards);

    if (row != -1) {
      sheet.getRange(row, 2).setValue(newJsonData);
      sheet.getRange(row, 3).setValue(timestamp);
    } else {
      sheet.appendRow([userEmail, newJsonData, timestamp]);
    }
    
    return { success: true, message: "Dashboard saved successfully!" };
  } catch (e) {
    Logger.log("Error saving dashboard: " + e.toString());
    return { success: false, message: "Error saving dashboard: " + e.message };
  }
}

/**
 * Deletes a dashboard by name.
 * @param {string} name The name of the dashboard to delete.
 */
function deleteDashboard(name) {
  try {
    const sheet = getSheet();
    const userEmail = Session.getActiveUser().getEmail();
    if (!userEmail) throw new Error("Could not identify user.");

    const { row, dashboards } = getUserData(sheet, userEmail);

    if (dashboards[name] !== undefined) {
      delete dashboards[name];
      const timestamp = new Date();
      const newJsonData = JSON.stringify(dashboards);
      if (row != -1) {
        sheet.getRange(row, 2).setValue(newJsonData);
        sheet.getRange(row, 3).setValue(timestamp);
      }
      return { success: true, message: "Dashboard deleted." };
    } else {
      return { success: false, message: "Dashboard not found." };
    }
  } catch (e) {
    Logger.log("Error deleting dashboard: " + e.toString());
    return { success: false, message: "Error deleting dashboard: " + e.message };
  }
}

/**
 * Renames a dashboard.
 * @param {string} oldName The current name of the dashboard.
 * @param {string} newName The new name of the dashboard.
 */
function renameDashboard(oldName, newName) {
  try {
    const sheet = getSheet();
    const userEmail = Session.getActiveUser().getEmail();
    if (!userEmail) throw new Error("Could not identify user.");

    const { row, dashboards } = getUserData(sheet, userEmail);

    if (dashboards[oldName] === undefined) {
      return { success: false, message: "Dashboard not found." };
    }

    if (dashboards[newName] !== undefined) {
        return { success: false, message: "Dashboard with this name already exists." };
    }

    if (!newName || newName.trim() === "") {
        return { success: false, message: "Name cannot be empty." };
    }

    dashboards[newName] = dashboards[oldName];
    delete dashboards[oldName];

    const timestamp = new Date();
    const newJsonData = JSON.stringify(dashboards);
    if (row != -1) {
      sheet.getRange(row, 2).setValue(newJsonData);
      sheet.getRange(row, 3).setValue(timestamp);
    }

    return { success: true, message: "Dashboard renamed." };
  } catch (e) {
    Logger.log("Error renaming dashboard: " + e.toString());
    return { success: false, message: "Error renaming dashboard: " + e.message };
  }
}

/**
 * Loads all dashboards for the user.
 * @returns {string} JSON string of the map of dashboards.
 */
function getDashboards() {
  try {
    const sheet = getSheet();
    const userEmail = Session.getActiveUser().getEmail();
    if (!userEmail) return JSON.stringify({});
    
    const { dashboards } = getUserData(sheet, userEmail);
    return JSON.stringify(dashboards);
  } catch (e) {
    Logger.log("Error loading dashboards: " + e.toString());
    return JSON.stringify({});
  }
}

/**
 * Legacy support - redirected to getDashboards.
 */
function loadDashboard() {
   return getDashboards();
}

// ==================== LIVE SESSION FUNCTIONS ====================

/**
 * Gets or creates the Sessions sheet.
 * @returns {Sheet} The sessions sheet object.
 */
function getSessionSheet() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = spreadsheet.getSheetByName("Sessions");
    if (!sheet) {
      sheet = spreadsheet.insertSheet("Sessions");
      sheet.appendRow(["Session Code", "Teacher Email", "Session Data", "Created At", "Active"]);
    }
    return sheet;
  } catch (e) {
    Logger.log("Error opening sessions sheet: " + e);
    throw new Error("Could not open sessions sheet.");
  }
}

/**
 * Generates a random 6-character session code.
 */
function generateSessionCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding confusing chars
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Returns the published web app URL.
 * @returns {string} The script URL.
 */
function getScriptUrl() {
  return ScriptApp.getService().getUrl();
}

/**
 * Creates a new live session.
 * @param {string} dashboardJson The current dashboard state to share.
 * @returns {object} Result with session code.
 */
function createSession(dashboardJson) {
  try {
    const sheet = getSessionSheet();
    const userEmail = Session.getActiveUser().getEmail();
    if (!userEmail) throw new Error("Could not identify user.");

    // End any existing sessions for this teacher
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === userEmail && data[i][4] === true) {
        sheet.getRange(i + 1, 5).setValue(false);
      }
    }

    // Generate unique code
    let code = generateSessionCode();
    let attempts = 0;
    while (attempts < 10) {
      let exists = false;
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === code && data[i][4] === true) {
          exists = true;
          break;
        }
      }
      if (!exists) break;
      code = generateSessionCode();
      attempts++;
    }

    // Parse and prepare session data
    const dashboardData = JSON.parse(dashboardJson);
    const sessionData = {
      widgets: dashboardData.widgets || [],
      bg: dashboardData.bg || 'bg-slate-900',
      polls: {},  // Will store poll responses: { widgetId: { optionA: count, optionB: count } }
      studentCount: 0
    };

    // Create session row
    sheet.appendRow([
      code,
      userEmail,
      JSON.stringify(sessionData),
      new Date(),
      true
    ]);

    return { success: true, code: code };
  } catch (e) {
    Logger.log("Error creating session: " + e.toString());
    return { success: false, message: "Error creating session: " + e.message };
  }
}

/**
 * Joins an existing session.
 * @param {string} code The session code.
 * @returns {object} Session data or error.
 */
function joinSession(code) {
  try {
    const sheet = getSessionSheet();
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === code.toUpperCase() && data[i][4] === true) {
        const sessionData = JSON.parse(data[i][2]);
        return {
          success: true,
          data: sessionData,
          teacherEmail: data[i][1]
        };
      }
    }

    return { success: false, message: "Session not found or has ended." };
  } catch (e) {
    Logger.log("Error joining session: " + e.toString());
    return { success: false, message: "Error joining session: " + e.message };
  }
}

/**
 * Gets current session data (for polling).
 * @param {string} code The session code.
 * @returns {object} Current session state.
 */
function getSessionData(code) {
  try {
    const sheet = getSessionSheet();
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === code.toUpperCase() && data[i][4] === true) {
        return {
          success: true,
          data: JSON.parse(data[i][2]),
          active: true
        };
      } else if (data[i][0] === code.toUpperCase() && data[i][4] === false) {
        return { success: false, active: false, message: "Session has ended." };
      }
    }

    return { success: false, message: "Session not found." };
  } catch (e) {
    Logger.log("Error getting session: " + e.toString());
    return { success: false, message: "Error getting session: " + e.message };
  }
}

/**
 * Updates session data (teacher only).
 * @param {string} code The session code.
 * @param {string} dashboardJson Updated dashboard state.
 */
function updateSession(code, dashboardJson) {
  try {
    const sheet = getSessionSheet();
    const userEmail = Session.getActiveUser().getEmail();
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === code && data[i][1] === userEmail && data[i][4] === true) {
        const existingData = JSON.parse(data[i][2]);
        const newData = JSON.parse(dashboardJson);

        // Preserve poll responses when updating
        existingData.widgets = newData.widgets || [];
        existingData.bg = newData.bg || existingData.bg;

        sheet.getRange(i + 1, 3).setValue(JSON.stringify(existingData));
        return { success: true };
      }
    }

    return { success: false, message: "Session not found or not authorized." };
  } catch (e) {
    Logger.log("Error updating session: " + e.toString());
    return { success: false, message: "Error updating session: " + e.message };
  }
}

/**
 * Submits a poll response from a student.
 * @param {string} code The session code.
 * @param {string} widgetId The poll widget ID.
 * @param {string} option The selected option ('A' or 'B').
 */
function submitPollResponse(code, widgetId, option) {
  try {
    const sheet = getSessionSheet();
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === code.toUpperCase() && data[i][4] === true) {
        const sessionData = JSON.parse(data[i][2]);

        // Initialize poll data if needed
        if (!sessionData.polls) sessionData.polls = {};
        if (!sessionData.polls[widgetId]) {
          sessionData.polls[widgetId] = { A: 0, B: 0 };
        }

        // Increment the selected option
        if (option === 'A' || option === 'B') {
          sessionData.polls[widgetId][option]++;
        }

        sheet.getRange(i + 1, 3).setValue(JSON.stringify(sessionData));
        return { success: true, polls: sessionData.polls[widgetId] };
      }
    }

    return { success: false, message: "Session not found." };
  } catch (e) {
    Logger.log("Error submitting poll: " + e.toString());
    return { success: false, message: "Error submitting poll: " + e.message };
  }
}

/**
 * Ends a live session.
 * @param {string} code The session code.
 */
function endSession(code) {
  try {
    const sheet = getSessionSheet();
    const userEmail = Session.getActiveUser().getEmail();
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === code && data[i][1] === userEmail && data[i][4] === true) {
        sheet.getRange(i + 1, 5).setValue(false);
        return { success: true, message: "Session ended." };
      }
    }

    return { success: false, message: "Session not found or not authorized." };
  } catch (e) {
    Logger.log("Error ending session: " + e.toString());
    return { success: false, message: "Error ending session: " + e.message };
  }
}

/**
 * Gets teacher's active session code (if any).
 */
function getActiveSession() {
  try {
    const sheet = getSessionSheet();
    const userEmail = Session.getActiveUser().getEmail();
    if (!userEmail) return { success: false };

    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === userEmail && data[i][4] === true) {
        return {
          success: true,
          code: data[i][0],
          data: JSON.parse(data[i][2])
        };
      }
    }

    return { success: false };
  } catch (e) {
    Logger.log("Error getting active session: " + e.toString());
    return { success: false };
  }
}
