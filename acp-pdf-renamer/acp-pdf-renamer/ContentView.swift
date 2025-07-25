//
//  ContentView.swift
//  acp-pdf-renamer
//
//  Created by Bennett Williamson on 7/27/24.
//

import SwiftUI

struct ContentView: View {
    @StateObject private var processor = PDFProcessor()
    @State private var showingCompletionAlert = false
    @State private var completionStats: (renamed: Int, skipped: Int, failed: Int)?

    var body: some View {
        VStack {
            if processor.isProcessing {
                ProgressView("Processing...", value: processor.progress, total: 1.0)
                    .padding()
            }

            Table($processor.files) {
                TableColumn("Select") { $file in
                    Toggle("", isOn: $file.isSelected)
                }.width(40)
                
                TableColumn("Original Filename", value: \.originalFilename)
                
                TableColumn("Proposed Filename") { $file in
                    TextField("Proposed Filename", text: $file.proposedFilename)
                        .textFieldStyle(PlainTextFieldStyle())
                }
                
                TableColumn("Status") { file in
                    Text(statusText(for: file.status))
                        .foregroundColor(statusColor(for: file.status))
                }
            }
            .onDrop(of: [.fileURL], isTargeted: nil) { providers in
                handleDrop(providers: providers)
                return true
            }

            HStack {
                Button("Select Folder") {
                    selectFolder()
                }

                Spacer()

                Button("Rename Selected Files") {
                    Task {
                        completionStats = await processor.renameFiles()
                        showingCompletionAlert = true
                    }
                }
                .disabled(processor.files.isEmpty || processor.isProcessing)
            }
            .padding()
        }
        .frame(minWidth: 800, minHeight: 400)
        .alert("Renaming Complete", isPresented: $showingCompletionAlert, presenting: completionStats) { stats in
            Button("OK", role: .cancel) { }
        } message: { stats in
            Text("Renamed: \(stats.renamed)\nSkipped: \(stats.skipped)\nFailed: \(stats.failed)")
        }
    }

    private func statusText(for status: PDFFile.RenameStatus) -> String {
        switch status {
        case .pending: return "Pending"
        case .success: return "Success"
        case .failure: return "Failed"
        case .skipped: return "Skipped"
        }
    }
    
    private func statusColor(for status: PDFFile.RenameStatus) -> Color {
        switch status {
        case .pending: return .primary
        case .success: return .green
        case .failure: return .red
        case .skipped: return .orange
        }
    }

    private func selectFolder() {
        let openPanel = NSOpenPanel()
        openPanel.canChooseFiles = false
        openPanel.canChooseDirectories = true
        openPanel.allowsMultipleSelection = false

        if openPanel.runModal() == .OK {
            if let url = openPanel.url {
                loadPDFs(from: url)
            }
        }
    }
    
    private func handleDrop(providers: [NSItemProvider]) {
        if let item = providers.first {
            item.loadItem(forTypeIdentifier: "public.file-url", options: nil) { (urlData, error) in
                DispatchQueue.main.async {
                    if let urlData = urlData as? Data, let url = URL(dataRepresentation: urlData, relativeTo: nil) {
                        loadPDFs(from: url)
                    }
                }
            }
        }
    }

    private func loadPDFs(from directoryURL: URL) {
        Task {
            let fileManager = FileManager.default
            let enumerator = fileManager.enumerator(at: directoryURL, includingPropertiesForKeys: nil)
            var pdfURLs: [URL] = []
            while let file = enumerator?.nextObject() as? URL {
                if file.pathExtension.lowercased() == "pdf" {
                    pdfURLs.append(file)
                }
            }
            await processor.process(urls: pdfURLs)
        }
    }
}

#Preview {
    ContentView()
}
