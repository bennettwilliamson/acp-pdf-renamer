//
//  PDFFile.swift
//  acp-pdf-renamer
//
//  Created by Bennett Williamson on 7/27/24.
//

import Foundation

struct PDFFile: Identifiable, Equatable {
    let id = UUID()
    let url: URL
    var originalFilename: String
    var proposedFilename: String
    var investorName: String?
    var investorID: String?
    var date: String?
    var docType: String?
    var isSelected = true
    var status: RenameStatus = .pending

    enum RenameStatus {
        case pending, success, failure, skipped
    }
}
