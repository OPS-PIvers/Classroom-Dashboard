/**
 * Serves the HTML file when the Web App URL is visited.
 */
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Classroom Dashboard')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL) // Allows embedding in Google Sites
    .addMetaTag('viewport', 'width=device-width, initial-scale=1'); // Ensures mobile responsiveness
}