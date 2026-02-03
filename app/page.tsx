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

export default function Page() {
  const [rows, setRows] = useState<ContractorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 26, fontWeight: 700 }}>
        Cleaners–Contractors Payment Dashboard
      </h1>

      <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
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
      </div>

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
