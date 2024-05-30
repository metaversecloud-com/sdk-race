import { google } from "googleapis";

// Configure the Google Sheets client
const privateKey = process.env.GOOGLESHEETS_PRIVATE_KEY.replace(/\\n/g, "\n");

const auth = new google.auth.JWT(process.env.GOOGLESHEETS_CLIENT_EMAIL, null, privateKey, [
  "https://www.googleapis.com/auth/spreadsheets",
]);

const sheets = google.sheets({ version: "v4", auth });

/**
 * @summary
 * Insert a new row into a spreadsheet.
 * Currently this is being used for Stride SpreadSheet in:
 * https://docs.google.com/spreadsheets/d/1BDUgJ1WJufqXlFqyfBO-vpDx0IfRk2VauMNZzLYohRU/edit#gid=0
 *
 * @usage
 * ```js
 *   const now = new Date();
 *     const formattedDate = now.toISOString().split("T")[0];
 *     const formattedTime = now.toISOString().split("T")[1].split(".")[0];
 *     const identityId = req?.query?.identityId;
 *     const displayName = req?.query?.displayName;
 *
 *     addNewRowToGoogleSheets({
 *       req,
 *       visitor,
 *       dataRowToBeInsertedInGoogleSheets: [formattedDate, formattedTime, identityId, displayName, "Race", "starts"],
 *     })
 *       .then()
 *       .catch();
 * ```
 */
export const addNewRowToGoogleSheets = async ({ dataRowToBeInsertedInGoogleSheets }) => {
  try {
    // Only execute this function if we have GOOGLESHEETS_SHEET_ID in the environment variables.
    if (!process.env.GOOGLESHEETS_SHEET_ID) {
      return;
    }
    sheets.spreadsheets.values.append(
      {
        spreadsheetId: process.env.GOOGLESHEETS_SHEET_ID,
        range: "Sheet1",
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        resource: {
          values: [dataRowToBeInsertedInGoogleSheets],
        },
      },
      (err, result) => {
        if (err) {
          console.error("Error inserting data in the SpreadSheet: ", JSON.stringify(err));
        }
      },
    );
  } catch (error) {
    console.error(JSON.stringify(error));
  }
};
