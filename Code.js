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
 * Saves the user's dashboard configuration.
 * @param {string} dashboardJson The JSON string of the dashboard configuration.
 */
function saveDashboard(dashboardJson) {
  try {
    const sheet = getSheet();
    const userEmail = Session.getActiveUser().getEmail();
    if (!userEmail) {
      // This will happen if the user is not logged into a Google account,
      // or if the script is running under an anonymous context.
      // For domain-only web apps, this should generally not be an issue.
      throw new Error("Could not identify user. Please make sure you are logged in to your Google account.");
    }
    
    const data = sheet.getDataRange().getValues();
    let userRow = -1;
    
    // Start from 1 to skip header
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == userEmail) {
        userRow = i + 1; // 1-based index
        break;
      }
    }
    
    const timestamp = new Date();
    
    if (userRow != -1) {
      // User found, update the row
      sheet.getRange(userRow, 2).setValue(dashboardJson);
      sheet.getRange(userRow, 3).setValue(timestamp);
    } else {
      // User not found, append a new row
      sheet.appendRow([userEmail, dashboardJson, timestamp]);
    }
    
    return { success: true, message: "Dashboard saved successfully!" };
  } catch (e) {
    Logger.log("Error saving dashboard: " + e.toString());
    return { success: false, message: "Error saving dashboard: " + e.message };
  }
}

/**
 * Loads the user's dashboard configuration.
 * @returns {string|null} The JSON string of the dashboard configuration, or null if not found.
 */
function loadDashboard() {
  try {
    const sheet = getSheet();
    const userEmail = Session.getActiveUser().getEmail();
     if (!userEmail) {
      // No user, no saved dashboard. Return null to load the default.
      return null;
    }
    
    const data = sheet.getDataRange().getValues();
    
    // Start from 1 to skip header
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == userEmail) {
        return data[i][1]; // Return the dashboard JSON string
      }
    }
    
    return null; // No configuration found for this user
  } catch (e) {
    Logger.log("Error loading dashboard: " + e.toString());
    // Don't throw an error to the user, just return null and let the front-end handle a fresh start.
    return null; 
  }
}