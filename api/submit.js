import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests allowed' });
  }

  const { team, finalAnswer } = req.body;

  // 1. The Secret Check
  const isCorrect = finalAnswer.toLowerCase().trim() === 'heyo';

  try {
    // 2. Authenticate with Google
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];

    // 3. Append the data to Google Sheets
    await sheet.addRow({
      'Timestamp': new Date().toLocaleString(),
      'Team Name': team,
      'Final Answer': finalAnswer,
      'Status': isCorrect ? 'SUCCESS' : 'WRONG'
    });

    // 4. Send response back to the website
    if (isCorrect) {
      return res.status(200).json({ success: true, message: "Victory! You have reached Ithaca." });
    } else {
      return res.status(200).json({ success: false, message: "Incorrect answer." });
    }
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ success: false, message: "Database Error" });
  }
}