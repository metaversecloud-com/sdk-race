import { JWT } from "google-auth-library";
import sheets from "@googleapis/sheets";

// Configure the Google Sheets client
const privateKey = process.env.GOOGLESHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n");

const auth = new JWT({
  email: process.env.GOOGLESHEETS_CLIENT_EMAIL,
  key: privateKey,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheetsClient = sheets?.sheets({ version: "v4", auth });

/**
 * @summary
 * Insert a new row into a spreadsheet.
 * Currently this is being used for SpreadSheet in:
 * https://docs.google.com/spreadsheets/d/{SHEET_ID_EXAMPLE}/edit#gid=0
 *
 * @usage
 * ```js
 *   addNewRowToGoogleSheets({
 *         identityId: req?.query?.identityId,
 *         displayName: req?.query?.displayName,
 *         appName: "App Name Example",
 *         event: "starts example event name",
 *         urlSlug
 *       })
 *         .then()
 *         .catch(error => console.error(JSON.stringify(error)));
 * ```
 */
export const addNewRowToGoogleSheets = async ({ identityId, displayName, username, appName, event, urlSlug }) => {
  try {
    // Only execute this function if we have GOOGLESHEETS_SHEET_ID in the environment variables.
    if (!process.env.GOOGLESHEETS_SHEET_ID) {
      return;
    }

    const now = new Date();
    const formattedDate = now.toISOString().split("T")[0];
    const formattedTime = now.toISOString().split("T")[1].split(".")[0];

    const dataRowToBeInsertedInGoogleSheets = [
      formattedDate,
      formattedTime,
      sanitizeString(identityId),
      sanitizeString(displayName) || username,
      appName,
      event,
      urlSlug,
    ];

    await sheetsClient.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLESHEETS_SHEET_ID,
      range: "Sheet1",
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [dataRowToBeInsertedInGoogleSheets],
      },
    });
  } catch (error) {
    console.error(JSON.stringify(error));
  }
};

function sanitizeString(input) {
  return input && input !== "null" ? input : "";
}
