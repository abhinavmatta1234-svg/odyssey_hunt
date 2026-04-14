import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests allowed' });
  }

  const { team, finalAnswer } = req.body;

  // 1. The Secret Check
  const isCorrect = finalAnswer && finalAnswer.toLowerCase().trim() === 'heyo';

  try {
    // 2. Safety Guard for the Private Key
    const rawKey = process.env.GOOGLE_PRIVATE_KEY;
    if (!rawKey) {
        throw new Error("GOOGLE_PRIVATE_KEY is missing from Vercel Environment Variables");
    }

    // This is the "Magic Fix" for the DECODER error
    const formattedKey = rawKey.replace(/\\n/g, '\n');

    // 3. Authenticate with Google
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: formattedKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];

    // 4. Append the data to Google Sheets
    await sheet.addRow({
      'Timestamp': new Date().toLocaleString(),
      'Team Name': team || 'Unknown Team',
      'Final Answer': finalAnswer || 'No Answer',
      'Status': isCorrect ? 'SUCCESS' : 'WRONG'
    });

    // 5. Send response back to the website
    return res.status(200).json({ 
        success: isCorrect, 
        message: isCorrect ? "Victory! You have reached Ithaca." : "Incorrect answer." 
    });

  } catch (error) {
    console.error('SERVER ERROR:', error.message);
    return res.status(500).json({ 
        success: false, 
        message: "The Oracle is silent (Database Error).",
        error: error.message // This helps you see the error in the browser console
    });
  }
}
