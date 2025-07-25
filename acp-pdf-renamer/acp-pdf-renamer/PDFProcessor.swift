//
//  PDFProcessor.swift
//  acp-pdf-renamer
//
//  Created by Bennett Williamson on 7/27/24.
//

import Foundation
import PDFKit

@MainActor
class PDFProcessor: ObservableObject {
    @Published var files: [PDFFile] = []
    @Published var progress: Double = 0.0
    @Published var isProcessing = false

    private let docTypeMapping: [String: String] = [
        "Noteholder Statement of Account": "LT_NoteHolderStatement",
        "Member Statement": "MemberStatement",
        "Temp Noteholder Statement": "Temp_NoteHolderStatement"
    ]

    func process(urls: [URL]) async {
        isProcessing = true
        progress = 0.0
        files = urls.map { url in
            PDFFile(url: url, originalFilename: url.lastPathComponent, proposedFilename: "")
        }

        for i in 0..<files.count {
            let url = files[i].url
            guard let pdfDocument = PDFDocument(url: url),
                  let page = pdfDocument.page(at: 0),
                  let text = page.string else {
                files[i].status = .failure
                continue
            }

            let parsedInfo = parse(text: text)
            files[i].investorName = parsedInfo.name
            files[i].investorID = parsedInfo.id
            files[i].date = parsedInfo.date
            files[i].docType = parsedInfo.docType

            if let name = parsedInfo.name, let id = parsedInfo.id, let date = parsedInfo.date, let docType = parsedInfo.docType {
                files[i].proposedFilename = "\(name)_\(id)_\(date)_\(docType).pdf"
            } else {
                files[i].proposedFilename = files[i].originalFilename
                files[i].status = .failure
            }
            progress = Double(i + 1) / Double(files.count)
        }
        isProcessing = false
    }

    private func parse(text: String) -> (name: String?, id: String?, date: String?, docType: String?) {
        let nameAndIdRegex = #/(?<name>[A-Za-z.\s]+)\s+(?<id>i\d+)/#
        let dateRegex = #/Statement Period\s+\d{2}/\d{2}/\d{4}\s+–\s+(?<month>\d{2})/(?<day>\d{2})/(?<year>\d{4})/#

        var investorName: String?
        var investorID: String?
        var statementDate: String?
        var documentType: String?

        if let match = text.firstMatch(of: nameAndIdRegex) {
            investorName = String(match.name).trimmingCharacters(in: .whitespacesAndNewlines)
            investorID = String(match.id)
        }

        if let match = text.firstMatch(of: dateRegex) {
            statementDate = "\(match.year)-\(match.month)-\(match.day)"
        }
        
        for (keyword, type) in docTypeMapping {
            if text.contains(keyword) {
                documentType = type
                break
            }
        }
        
        if documentType == nil {
            documentType = "Unknown"
        }

        return (investorName, investorID, statementDate, documentType)
    }

    func renameFiles() async -> (renamed: Int, skipped: Int, failed: Int) {
        var renamedCount = 0
        var skippedCount = 0
        var failedCount = 0

        for i in 0..<files.count {
            guard files[i].isSelected, files[i].status != .failure else {
                if files[i].status == .failure {
                    failedCount += 1
                }
                continue
            }

            let originalURL = files[i].url
            let newURL = originalURL.deletingLastPathComponent().appendingPathComponent(files[i].proposedFilename)

            if FileManager.default.fileExists(atPath: newURL.path) {
                files[i].status = .skipped
                skippedCount += 1
                continue
            }

            do {
                try FileManager.default.moveItem(at: originalURL, to: newURL)
                files[i].status = .success
                renamedCount += 1
            } catch {
                files[i].status = .failure
                failedCount += 1
            }
        }
        return (renamedCount, skippedCount, failedCount)
    }
}
