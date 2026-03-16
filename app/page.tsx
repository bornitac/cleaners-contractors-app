"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type ContractorRow = {
  id: string;
  name: string | null;
  company_name: string | null;
  location: string | null;
  start_date: string | null;
  exp_date: string | null;
};

type ContractorInsertRow = {
  name: string;
  company_name: string;
  location: string;
  start_date: string;
  exp_date: string;
};

export default function Page() {
  const [rows, setRows] = useState<ContractorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("contractor_payment_view")
      .select("*")
      .order("start_date", { ascending: false })
      .limit(50);

    if (error) {
      setError(error.message);
      setRows([]);
    } else {
      setRows((data as ContractorRow[]) ?? []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  function parseCSV(text: string): ContractorInsertRow[] {
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

    const nameIndex = headers.indexOf("name");
    const companyIndex = headers.indexOf("company_name");
    const locationIndex = headers.indexOf("location");
    const startIndex = headers.indexOf("start_date");
    const expIndex = headers.indexOf("exp_date");

    if (
      nameIndex === -1 ||
      companyIndex === -1 ||
      locationIndex === -1 ||
      startIndex === -1 ||
      expIndex === -1
    ) {
      throw new Error(
        "CSV must include headers: name, company_name, location, start_date, exp_date"
      );
    }

    return lines.slice(1).map((line) => {
      const cols = line.split(",").map((c) => c.trim());

      return {
        name: cols[nameIndex] ?? "",
        company_name: cols[companyIndex] ?? "",
        location: cols[locationIndex] ?? "",
        start_date: cols[startIndex] ?? "",
        exp_date: cols[expIndex] ?? "",
      };
    });
  }

  async function handleUpload() {
    if (!file) {
      setUploadMessage("Please choose a CSV file first.");
      return;
    }

    setUploading(true);
    setUploadMessage(null);
    setError(null);

    try {
      const text = await file.text();
      const parsedRows = parseCSV(text);

      const validRows = parsedRows.filter(
        (row) =>
          row.name &&
          row.company_name &&
          row.location &&
          row.start_date &&
          row.exp_date
      );

      if (validRows.length === 0) {
        throw new Error("No valid rows found in the CSV.");
      }

      // Insert into contractors table
      const { error: insertError } = await supabase
        .from("contractors")
        .insert(validRows);

      if (insertError) {
        throw insertError;
      }

      // Optional: log the upload in the uploads table
      // Remove this block if you do not want upload logging.
      const { error: logError } = await supabase.from("uploads").insert([
        {
          file_name: file.name,
          file_path: `local-upload/${file.name}`,
          uploaded_by: "dashboard-user",
        },
      ]);

      if (logError) {
        console.warn("Upload log failed:", logError.message);
      }

      setUploadMessage(`Uploaded ${validRows.length} row(s) successfully.`);
      setFile(null);

      // Refresh dashboard automatically
      await loadData();
    } catch (err: any) {
      setUploadMessage(err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 26, fontWeight: 700 }}>
        Cleaners–Contractors Payment Dashboard
      </h1>

      <div
        style={{
          marginTop: 12,
          display: "flex",
          gap: 10,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={loadData}
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            border: "1px solid #333",
            cursor: "pointer",
          }}
        >
          Refresh data
        </button>

        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            border: "1px solid #333",
          }}
        />

        <button
          onClick={handleUpload}
          disabled={uploading}
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            border: "1px solid #333",
            cursor: uploading ? "not-allowed" : "pointer",
            opacity: uploading ? 0.7 : 1,
          }}
        >
          {uploading ? "Uploading..." : "Upload CSV"}
        </button>
      </div>

      {uploadMessage && (
        <p style={{ marginTop: 12, color: uploadMessage.includes("successfully") ? "green" : "#b26a00" }}>
          {uploadMessage}
        </p>
      )}

      <p style={{ marginTop: 8, fontSize: 13, color: "#666" }}>
        CSV headers should be: name, company_name, location, start_date, exp_date
      </p>

      {loading && <p style={{ marginTop: 16 }}>Loading…</p>}

      {error && (
        <p style={{ marginTop: 16, color: "crimson" }}>
          Error: {error}
        </p>
      )}

      {!loading && !error && (
        <div style={{ marginTop: 16, overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                {["Name", "Company", "Location", "Start", "End"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      borderBottom: "1px solid #ccc",
                      padding: "10px 8px",
                      fontSize: 14,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td style={{ padding: "10px 8px", borderBottom: "1px solid #eee" }}>
                    {r.name ?? "-"}
                  </td>
                  <td style={{ padding: "10px 8px", borderBottom: "1px solid #eee" }}>
                    {r.company_name ?? "-"}
                  </td>
                  <td style={{ padding: "10px 8px", borderBottom: "1px solid #eee" }}>
                    {r.location ?? "-"}
                  </td>
                  <td style={{ padding: "10px 8px", borderBottom: "1px solid #eee" }}>
                    {r.start_date ?? "-"}
                  </td>
                  <td style={{ padding: "10px 8px", borderBottom: "1px solid #eee" }}>
                    {r.exp_date ?? "-"}
                  </td>
                </tr>
              ))}

              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: "12px 8px" }}>
                    No rows found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
