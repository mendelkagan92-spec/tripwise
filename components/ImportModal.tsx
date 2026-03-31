"use client";

import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { matchColumns, getAvailableFields } from "@/lib/column-matcher";
import Modal from "./ui/Modal";
import Button from "./ui/Button";

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
  tripId: string;
  onImported: () => void;
}

type Step = "upload" | "mapping" | "preview" | "done";

interface ParsedRow {
  [key: string]: string;
}

export default function ImportModal({ open, onClose, tripId, onImported }: ImportModalProps) {
  const [step, setStep] = useState<Step>("upload");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [mapping, setMapping] = useState<Record<string, string | null>>({});
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ count: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep("upload");
    setHeaders([]);
    setRows([]);
    setMapping({});
    setResult(null);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = new Uint8Array(ev.target?.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<ParsedRow>(ws, { defval: "" });

      if (json.length === 0) return;

      const hdrs = Object.keys(json[0]);
      setHeaders(hdrs);
      setRows(json.slice(0, 500)); // Limit to 500 rows
      setMapping(matchColumns(hdrs));
      setStep("mapping");
    };
    reader.readAsArrayBuffer(file);
  };

  const getMappedRows = () => {
    return rows.map((row) => {
      const mapped: Record<string, string> = {};
      for (const field of getAvailableFields()) {
        const col = mapping[field];
        if (col && row[col] !== undefined) {
          mapped[field] = String(row[col]);
        }
      }
      return mapped;
    });
  };

  const handleImport = async () => {
    setImporting(true);
    const mappedRows = getMappedRows();
    const res = await fetch("/api/events/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tripId, rows: mappedRows }),
    });
    if (res.ok) {
      const data = await res.json();
      setResult(data);
      setStep("done");
      onImported();
    }
    setImporting(false);
  };

  const fields = getAvailableFields();

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title={
        step === "upload" ? "Import Events" :
        step === "mapping" ? "Map Columns" :
        step === "preview" ? "Preview Import" :
        "Import Complete"
      }
    >
      {step === "upload" && (
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Upload an Excel (.xlsx) or CSV file with your itinerary events.
          </p>
          <div
            className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-accent/50 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <p className="text-3xl mb-2">📄</p>
            <p className="text-sm text-text-secondary">Click to upload .xlsx or .csv</p>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.csv,.xls"
              onChange={handleFile}
              className="hidden"
            />
          </div>
          <div className="text-center">
            <a
              href="/api/events/template"
              className="text-sm text-accent hover:underline"
            >
              Download blank template
            </a>
          </div>
        </div>
      )}

      {step === "mapping" && (
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            We detected {rows.length} rows. Adjust column mappings if needed:
          </p>
          <div className="space-y-3">
            {fields.map((field) => (
              <div key={field} className="flex items-center gap-3">
                <label className="text-sm text-text-primary w-32 capitalize shrink-0">
                  {field === "confirmationNumber" ? "Confirmation #" : field}
                </label>
                <select
                  value={mapping[field] || ""}
                  onChange={(e) =>
                    setMapping({ ...mapping, [field]: e.target.value || null })
                  }
                  className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary"
                >
                  <option value="">— skip —</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={reset} className="flex-1">
              Back
            </Button>
            <Button onClick={() => setStep("preview")} className="flex-1">
              Preview
            </Button>
          </div>
        </div>
      )}

      {step === "preview" && (
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            {rows.length} events will be imported:
          </p>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {getMappedRows().slice(0, 20).map((row, i) => (
              <div key={i} className="bg-background border border-border rounded-lg p-3 text-sm">
                <div className="font-medium">{row.name || "Unnamed"}</div>
                <div className="text-text-secondary text-xs mt-0.5">
                  {[row.type, row.date, row.time, row.location]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
              </div>
            ))}
            {rows.length > 20 && (
              <p className="text-xs text-text-secondary text-center">
                ...and {rows.length - 20} more
              </p>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setStep("mapping")} className="flex-1">
              Back
            </Button>
            <Button onClick={handleImport} disabled={importing} className="flex-1">
              {importing ? "Importing..." : `Import ${rows.length} events`}
            </Button>
          </div>
        </div>
      )}

      {step === "done" && (
        <div className="text-center py-4">
          <p className="text-4xl mb-3">✅</p>
          <p className="text-lg font-semibold mb-2">
            {result?.count} events imported!
          </p>
          <Button
            onClick={() => {
              reset();
              onClose();
            }}
          >
            Done
          </Button>
        </div>
      )}
    </Modal>
  );
}
