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

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('pdf') as File
    
    if (!file) {
      return Response.json({
        success: false,
        message: 'No PDF file provided'
      })
    }
    
    if (file.type !== 'application/pdf') {
      return Response.json({
        success: false,
        message: 'File must be a PDF'
      })
    }
    
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    
    // Extract text from PDF using dynamic import
    let pdfData: any
    try {
      const pdf = (await import('pdf-parse')).default
      pdfData = await pdf(uint8Array)
    } catch (error) {
      console.error('PDF parsing error:', error)
      return Response.json({
        success: false,
        message: 'Failed to read PDF content. Please ensure the file is a valid PDF.'
      })
    }
    
    // Extract statement end date
    const extractedDate = extractStatementEndDate(pdfData.text)
    
    if (!extractedDate) {
      return Response.json({
        success: false,
        message: 'Could not find "Statement Period" with valid date range in the PDF. Please ensure the PDF contains a statement period in the format "MM/DD/YYYY - MM/DD/YYYY".'
      })
    }
    
    // Generate new filename
    const newFilename = `Membership Statement - ${extractedDate}.pdf`
    
    // Create download URL (base64 encoded)
    const base64Data = btoa(String.fromCharCode(...uint8Array))
    const downloadUrl = `data:application/pdf;base64,${base64Data}`
    
    return Response.json({
      success: true,
      message: 'PDF processed successfully!',
      filename: newFilename,
      extractedDate: extractedDate,
      downloadUrl: downloadUrl
    })
    
  } catch (error) {
    console.error('Error processing PDF:', error)
    return Response.json({
      success: false,
      message: 'An unexpected error occurred while processing the PDF.'
    })
  }
} 