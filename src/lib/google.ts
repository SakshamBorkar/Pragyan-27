import * as jose from 'jose'

export async function getGoogleAccessToken(): Promise<string> {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const privateKeyPEM = process.env.GOOGLE_PRIVATE_KEY

  if (!email || !privateKeyPEM) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_PRIVATE_KEY is missing from environment variables')
  }

  // Handle newlines in private key
  const formattedKey = privateKeyPEM.replace(/\\n/g, '\n')

  try {
    const privateKey = await jose.importPKCS8(formattedKey, 'RS256')
    const now = Math.floor(Date.now() / 1000)
    const jwt = await new jose.SignJWT({
      iss: email,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    })
      .setProtectedHeader({ alg: 'RS256' })
      .sign(privateKey)

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
      next: { revalidate: 0 },
    })

    if (!tokenRes.ok) {
      const errorText = await tokenRes.text()
      throw new Error(`Google OAuth token request failed: ${tokenRes.status} ${errorText}`)
    }

    const tokenData = await tokenRes.json()
    return tokenData.access_token
  } catch (error: any) {
    console.error('Error getting Google access token:', error)
    throw new Error(`Failed to authenticate with Google: ${error.message}`)
  }
}

export function extractSpreadsheetId(url: string): string | null {
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/)
  return match ? match[1] : null
}

export async function getSpreadsheetFirstSheetTitle(spreadsheetId: string, accessToken: string): Promise<string> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    next: { revalidate: 0 },
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Failed to get spreadsheet metadata: ${res.status} ${errText}`)
  }

  const data = await res.json()
  const sheets = data.sheets || []
  if (sheets.length === 0) {
    throw new Error('Spreadsheet has no sheets')
  }

  return sheets[0].properties.title
}

export async function fetchSheetValues(spreadsheetId: string, sheetTitle: string, accessToken: string): Promise<string[][]> {
  // Fetch range A1:Z200
  const range = `${sheetTitle}!A1:Z200`
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    next: { revalidate: 0 },
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Failed to fetch sheet values: ${res.status} ${errText}`)
  }

  const data = await res.json()
  return data.values || []
}

// Convert 0-based column index to letter (A, B, ..., Z, AA, AB, ...)
export function colIndexToLabel(index: number): string {
  let label = ''
  let temp = index
  while (temp >= 0) {
    label = String.fromCharCode((temp % 26) + 65) + label
    temp = Math.floor(temp / 26) - 1
  }
  return label
}

export async function updateSheetCellValue(
  spreadsheetId: string,
  sheetTitle: string,
  rowIndex: number, // 0-based data row index (row 0 in data is row 2 in the sheet)
  colIndex: number, // 0-based column index
  value: string,
  accessToken: string
): Promise<void> {
  const colLabel = colIndexToLabel(colIndex)
  const cellRange = `${sheetTitle}!${colLabel}${rowIndex + 2}`
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(cellRange)}?valueInputOption=USER_ENTERED`

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [[value]],
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Failed to update sheet cell: ${res.status} ${errText}`)
  }
}

export async function updateSheetRowValues(
  spreadsheetId: string,
  sheetTitle: string,
  rowIndex: number, // 0-based data row index
  values: string[],
  accessToken: string
): Promise<void> {
  const startCol = colIndexToLabel(0)
  const endCol = colIndexToLabel(values.length - 1)
  const rowRange = `${sheetTitle}!${startCol}${rowIndex + 2}:${endCol}${rowIndex + 2}`
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(rowRange)}?valueInputOption=USER_ENTERED`

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [values],
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Failed to update sheet row: ${res.status} ${errText}`)
  }
}

