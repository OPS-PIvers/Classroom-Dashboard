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
