import { NextRequest, NextResponse } from 'next/server'
import pdf from 'pdf-parse'

interface ProcessResult {
  success: boolean
  message: string
  filename?: string
  extractedDate?: string
  downloadUrl?: string
}

function extractStatementEndDate(text: string): string | null {
  // Look for "Statement Period" followed by date range
  const pattern = /Statement Period\s+(\d{2}\/\d{2}\/\d{4})\s*[-–—]\s*(\d{2}\/\d{2}\/\d{4})/i
  const match = text.match(pattern)
  
  if (match && match[2]) {
    const endDate = match[2]
    const [month, day, year] = endDate.split('/')
    return `${year} ${month.padStart(2, '0')} ${day.padStart(2, '0')}`
  }
  
  return null
}

function generateUniqueFilename(baseName: string, extension: string): string {
  // For now, just return the base name
  // In a real app, you'd check against existing files and add suffixes like -1, -2, etc.
  return `${baseName}${extension}`
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('pdf') as File
    
    if (!file) {
      return NextResponse.json<ProcessResult>({
        success: false,
        message: 'No PDF file provided'
      })
    }
    
    if (file.type !== 'application/pdf') {
      return NextResponse.json<ProcessResult>({
        success: false,
        message: 'File must be a PDF'
      })
    }
    
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Extract text from PDF
    let pdfData
    try {
      pdfData = await pdf(buffer)
    } catch (error) {
      return NextResponse.json<ProcessResult>({
        success: false,
        message: 'Failed to read PDF content. Please ensure the file is a valid PDF.'
      })
    }
    
    // Extract statement end date
    const extractedDate = extractStatementEndDate(pdfData.text)
    
    if (!extractedDate) {
      return NextResponse.json<ProcessResult>({
        success: false,
        message: 'Could not find "Statement Period" with valid date range in the PDF. Please ensure the PDF contains a statement period in the format "MM/DD/YYYY - MM/DD/YYYY".'
      })
    }
    
    // Generate new filename
    const newFilename = generateUniqueFilename(
      `Membership Statement - ${extractedDate}`,
      '.pdf'
    )
    
    // Create download URL (base64 encoded)
    const base64Data = buffer.toString('base64')
    const downloadUrl = `data:application/pdf;base64,${base64Data}`
    
    return NextResponse.json<ProcessResult>({
      success: true,
      message: 'PDF processed successfully!',
      filename: newFilename,
      extractedDate: extractedDate,
      downloadUrl: downloadUrl
    })
    
  } catch (error) {
    console.error('Error processing PDF:', error)
    return NextResponse.json<ProcessResult>({
      success: false,
      message: 'An unexpected error occurred while processing the PDF.'
    })
  }
} 