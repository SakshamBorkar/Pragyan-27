import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabase } from '@/lib/db'
import {
  getGoogleAccessToken,
  extractSpreadsheetId,
  getSpreadsheetFirstSheetTitle,
  fetchSheetValues,
  updateSheetCellValue,
  updateSheetRowValues,
} from '@/lib/google'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  // 1. Fetch spreadsheet link from settings
  const { data, error: dbError } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'induction_sheet_link')
    .maybeSingle()

  if (dbError) {
    console.error(dbError)
    return NextResponse.json({ error: 'Database error fetching settings.' }, { status: 500 })
  }

  const link = data?.value || ''
  if (!link) {
    return NextResponse.json({ configured: false })
  }

  // 2. Extract spreadsheet ID
  const spreadsheetId = extractSpreadsheetId(link)
  if (!spreadsheetId) {
    return NextResponse.json({
      configured: true,
      error: 'Invalid Google Sheet URL. Could not extract spreadsheet ID.',
    })
  }

  // 3. Verify service account credentials in environment
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const key = process.env.GOOGLE_PRIVATE_KEY
  if (!email || !key) {
    return NextResponse.json({
      configured: true,
      credentialsError: true,
      link,
    })
  }

  try {
    const accessToken = await getGoogleAccessToken()
    const sheetTitle = await getSpreadsheetFirstSheetTitle(spreadsheetId, accessToken)
    const values = await fetchSheetValues(spreadsheetId, sheetTitle, accessToken)

    if (values && values.length > 0) {
      const headers = values[0]
      const hasColorCol = headers.some(h => /mark\s*as|color/i.test(h))
      if (!hasColorCol) {
        headers.push('Mark As')
        for (let i = 1; i < values.length; i++) {
          if (!values[i]) {
            values[i] = []
          }
          while (values[i].length < headers.length) {
            values[i].push('')
          }
        }
      }
    }

    return NextResponse.json({
      configured: true,
      values,
      sheetTitle,
      link,
    })
  } catch (err: any) {
    console.error('Google Sheets API Error:', err)
    return NextResponse.json({
      configured: true,
      apiError: err.message || 'Failed to fetch spreadsheet data.',
      link,
    })
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const { rowIndex, colIndex, value, rowValues } = (await req.json()) as {
    rowIndex?: number
    colIndex?: number
    value?: string
    rowValues?: string[]
  }

  if (rowIndex === undefined) {
    return NextResponse.json({ error: 'Missing required parameter (rowIndex).' }, { status: 400 })
  }

  if (rowValues === undefined && (colIndex === undefined || value === undefined)) {
    return NextResponse.json({ error: 'Missing required parameters (rowValues, or colIndex and value).' }, { status: 400 })
  }

  // 1. Fetch sheet link
  const { data, error: dbError } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'induction_sheet_link')
    .maybeSingle()

  if (dbError || !data?.value) {
    return NextResponse.json({ error: 'Spreadsheet link is not configured.' }, { status: 400 })
  }

  const link = data.value
  const spreadsheetId = extractSpreadsheetId(link)
  if (!spreadsheetId) {
    return NextResponse.json({ error: 'Invalid spreadsheet URL.' }, { status: 400 })
  }

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const key = process.env.GOOGLE_PRIVATE_KEY
  if (!email || !key) {
    return NextResponse.json({ error: 'Google Service Account credentials are not configured on the server.' }, { status: 500 })
  }

  try {
    const accessToken = await getGoogleAccessToken()
    const sheetTitle = await getSpreadsheetFirstSheetTitle(spreadsheetId, accessToken)
    if (rowValues) {
      // Check if color column header exists in the sheet. If not, write it at column 25 (Z)
      const values = await fetchSheetValues(spreadsheetId, sheetTitle, accessToken)
      const headers = values[0] || []
      const hasColorCol = headers.some(h => /mark\s*as|color/i.test(h))
      if (!hasColorCol && headers.length <= 25) {
        await updateSheetCellValue(spreadsheetId, sheetTitle, -1, 25, 'Mark As', accessToken)
      }
      await updateSheetRowValues(spreadsheetId, sheetTitle, rowIndex, rowValues, accessToken)
    } else {
      await updateSheetCellValue(spreadsheetId, sheetTitle, rowIndex, colIndex!, value!, accessToken)
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('Google Sheets Write Error:', err)
    return NextResponse.json({ error: err.message || 'Failed to write to Google Sheet.' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const { rowIndex, phone, date, time, venue } = (await req.json()) as {
    rowIndex?: number
    phone: string
    date: string
    time: string
    venue: string
  }

  // 1. Fetch sheet link
  const { data, error: dbError } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'induction_sheet_link')
    .maybeSingle()

  if (dbError || !data?.value) {
    return NextResponse.json({ error: 'Spreadsheet link is not configured.' }, { status: 400 })
  }

  const link = data.value
  const spreadsheetId = extractSpreadsheetId(link)
  if (!spreadsheetId) {
    return NextResponse.json({ error: 'Invalid spreadsheet URL.' }, { status: 400 })
  }

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const key = process.env.GOOGLE_PRIVATE_KEY
  if (!email || !key) {
    return NextResponse.json({ error: 'Google Service Account credentials are not configured on the server.' }, { status: 500 })
  }

  try {
    const accessToken = await getGoogleAccessToken()
    const sheetTitle = await getSpreadsheetFirstSheetTitle(spreadsheetId, accessToken)
    const values = await fetchSheetValues(spreadsheetId, sheetTitle, accessToken)

    let targetRowIndex = rowIndex

    // If rowIndex is not provided or out of range, search by phone number
    if (targetRowIndex === undefined || targetRowIndex < 0 || targetRowIndex >= values.length - 1) {
      const headers = values[0] || []
      const mobileColIdx = headers.findIndex(h => /mobile|phone/i.test(h))
      if (mobileColIdx !== -1) {
        const cleanSearchPhone = phone.replace(/\D/g, '')
        for (let i = 1; i < values.length; i++) {
          const rowVal = values[i] || []
          const rowPhone = (rowVal[mobileColIdx] || '').replace(/\D/g, '')
          if (rowPhone && (rowPhone.endsWith(cleanSearchPhone) || cleanSearchPhone.endsWith(rowPhone))) {
            targetRowIndex = i - 1
            break
          }
        }
      }
    }

    if (targetRowIndex === undefined || targetRowIndex < 0) {
      return NextResponse.json({ error: 'Candidate row could not be identified.' }, { status: 404 })
    }

    const originalRowValues = values[targetRowIndex + 1] || []
    const headers = values[0] || []
    const updatedRowValues = [...originalRowValues]
    while (updatedRowValues.length < headers.length) {
      updatedRowValues.push('')
    }

    updatedRowValues[9] = date

    const [h, m] = time.split(':')
    const hr = parseInt(h)
    const ampm = hr >= 12 ? 'PM' : 'AM'
    const h12 = hr % 12 || 12
    const formattedTime = `${h12}:${m} ${ampm}`
    updatedRowValues[11] = formattedTime

    updatedRowValues[13] = venue

    await updateSheetRowValues(spreadsheetId, sheetTitle, targetRowIndex, updatedRowValues, accessToken)

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('Google Sheets Update Error:', err)
    return NextResponse.json({ error: err.message || 'Failed to update candidate details.' }, { status: 500 })
  }
}
