'use client'

import { useState, useRef } from 'react'

interface ProcessResult {
  success: boolean
  message: string
  filename?: string
  extractedDate?: string
  downloadUrl?: string
}

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<ProcessResult | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (file: File) => {
    if (file.type !== 'application/pdf') {
      setResult({
        success: false,
        message: 'Please select a PDF file.'
      })
      return
    }
    
    setSelectedFile(file)
    setResult(null)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const processFile = async () => {
    if (!selectedFile) return

    setProcessing(true)
    setResult(null)

    const formData = new FormData()
    formData.append('pdf', selectedFile)

    try {
      const response = await fetch('/api/process-pdf', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        message: 'An error occurred while processing the file.'
      })
    } finally {
      setProcessing(false)
    }
  }

  const downloadFile = () => {
    if (result?.downloadUrl) {
      const link = document.createElement('a')
      link.href = result.downloadUrl
      link.download = result.filename || 'renamed-file.pdf'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ACP PDF Renamer
          </h1>
          <p className="text-gray-600">
            Upload a membership statement PDF to rename it using the statement end date
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          {/* File Upload Area */}
          <div
            className={`upload-area ${dragOver ? 'dragover' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <div className="space-y-4">
              <div className="text-gray-400">
                <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <p className="text-gray-700 font-medium">
                  {selectedFile ? selectedFile.name : 'Click to select or drag and drop a PDF file'}
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  PDF files only
                </p>
              </div>
            </div>
          </div>

          {/* Process Button */}
          {selectedFile && (
            <div className="mt-6 text-center">
              <button
                onClick={processFile}
                disabled={processing}
                className={`btn-primary ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {processing ? 'Processing...' : 'Process PDF'}
              </button>
            </div>
          )}
        </div>

        {/* Results */}
        {result && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Results</h3>
            
            {result.success ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 font-medium">✅ Success!</p>
                  <p className="text-green-700 text-sm mt-1">{result.message}</p>
                </div>
                
                {result.extractedDate && (
                  <div>
                    <p className="text-sm text-gray-600">Extracted Date:</p>
                    <p className="font-mono text-gray-900">{result.extractedDate}</p>
                  </div>
                )}
                
                {result.filename && (
                  <div>
                    <p className="text-sm text-gray-600">New Filename:</p>
                    <p className="font-mono text-gray-900">{result.filename}</p>
                  </div>
                )}
                
                {result.downloadUrl && (
                  <button
                    onClick={downloadFile}
                    className="btn-primary w-full"
                  >
                    Download Renamed PDF
                  </button>
                )}
              </div>
            ) : (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 font-medium">❌ Error</p>
                <p className="text-red-700 text-sm mt-1">{result.message}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 