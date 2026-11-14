"""Interactive Visual Database Explorer for Knowledge Base Cruvels."""

import os
from fastapi import FastAPI, Query, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
import uvicorn
from sqlalchemy import text
from kb_cruvels.database.session import engine

app = FastAPI(title="Knowledge Base Cruvels - Visual Table Browser")

TABLES = [
    "court_judgments",
    "statutory_provisions",
    "legal_instruments",
    "legal_definitions",
    "cross_reference_links",
    "legal_doctrines",
    "legal_procedures",
    "legal_forms",
    "document_templates",
    "government_notifications"
]

@app.get("/api/tables")
def get_tables():
    with engine.connect() as conn:
        counts = {}
        for t in TABLES:
            cnt = conn.execute(text(f"SELECT count(*) FROM {t}")).scalar()
            counts[t] = cnt
    return counts

@app.get("/api/data/{table_name}")
def get_table_data(
    table_name: str,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    search: str = Query("")
):
    if table_name not in TABLES:
        raise HTTPException(status_code=404, detail="Table not found")
    
    offset = (page - 1) * limit
    with engine.connect() as conn:
        # Get columns
        col_res = conn.execute(text(
            f"SELECT column_name FROM information_schema.columns "
            f"WHERE table_name = '{table_name}' ORDER BY ordinal_position"
        ))
        all_cols = [r[0] for r in col_res.fetchall()]
        
        # Build query
        where_clause = ""
        params = {"limit": limit, "offset": offset}
        if search.strip():
            # Search in text columns
            text_cols = [c for c in all_cols if any(x in c for x in ["title", "name", "label", "citation", "term", "court", "status", "number"])]
            if not text_cols:
                text_cols = all_cols[:3]
            conds = [f"CAST({c} AS TEXT) ILIKE :search" for c in text_cols]
            where_clause = "WHERE " + " OR ".join(conds)
            params["search"] = f"%{search.strip()}%"

        count_sql = f"SELECT count(*) FROM {table_name} {where_clause}"
        total = conn.execute(text(count_sql), params).scalar()

        data_sql = f"SELECT * FROM {table_name} {where_clause} LIMIT :limit OFFSET :offset"
        rows_res = conn.execute(text(data_sql), params)
        
        rows = []
        for r in rows_res.fetchall():
            row_dict = {}
            for col, val in zip(all_cols, r):
                row_dict[col] = str(val) if val is not None else ""
            rows.append(row_dict)

    return {
        "table": table_name,
        "columns": all_cols,
        "rows": rows,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit if total > 0 else 1,
        "limit": limit
    }

@app.get("/", response_class=HTMLResponse)
def index():
    return """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Knowledge Base Cruvels — Visual Database Explorer</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { display: flex; height: 100vh; background: #090d16; color: #f1f5f9; overflow: hidden; }
    
    /* Sidebar */
    .sidebar { width: 300px; background: #0f172a; border-right: 1px solid #1e293b; display: flex; flex-direction: column; }
    .sidebar-header { padding: 20px 18px; border-bottom: 1px solid #1e293b; }
    .sidebar-header h2 { font-size: 17px; font-weight: 700; color: #38bdf8; display: flex; align-items: center; gap: 8px; }
    .sidebar-header p { font-size: 12px; color: #64748b; margin-top: 4px; }
    .table-list { flex: 1; overflow-y: auto; padding: 12px 8px; }
    .table-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; border-radius: 8px; color: #94a3b8; font-size: 13px; font-weight: 500; cursor: pointer; margin-bottom: 4px; transition: all 0.15s; }
    .table-item:hover { background: #1e293b; color: #f8fafc; }
    .table-item.active { background: #0284c7; color: #ffffff; font-weight: 600; }
    .badge { font-size: 11px; padding: 2px 7px; border-radius: 999px; background: rgba(255,255,255,0.1); font-family: monospace; }
    .table-item.active .badge { background: rgba(0,0,0,0.3); color: #fff; }

    /* Main Area */
    .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
    .topbar { padding: 14px 20px; background: #0b1120; border-bottom: 1px solid #1e293b; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
    .topbar-left { display: flex; align-items: center; gap: 16px; }
    .current-title { font-size: 18px; font-weight: 700; color: #f8fafc; }
    .search-input { width: 280px; padding: 8px 12px; border-radius: 6px; background: #1e293b; border: 1px solid #334155; color: #f8fafc; font-size: 13px; outline: none; }
    .search-input:focus { border-color: #38bdf8; }
    .pagination { display: flex; align-items: center; gap: 8px; }
    .btn { background: #1e293b; border: 1px solid #334155; color: #f8fafc; padding: 6px 12px; border-radius: 6px; font-size: 12px; cursor: pointer; transition: all 0.15s; font-weight: 500; }
    .btn:hover:not(:disabled) { background: #334155; }
    .btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .page-info { font-size: 12px; color: #94a3b8; font-family: monospace; }

    /* Grid Table */
    .grid-wrap { flex: 1; overflow: auto; padding: 0; background: #090d16; }
    table { width: 100%; border-collapse: collapse; text-align: left; font-size: 12px; }
    th { background: #0f172a; color: #94a3b8; padding: 10px 14px; font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.04em; border-bottom: 2px solid #38bdf8; border-right: 1px solid #1e293b; position: sticky; top: 0; z-index: 10; white-space: nowrap; }
    td { padding: 10px 14px; border-bottom: 1px solid #1e293b; border-right: 1px solid #1e293b; color: #cbd5e1; max-width: 420px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; vertical-align: top; }
    tr:nth-child(even) td { background: rgba(255, 255, 255, 0.015); }
    tr:hover td { background: #1e3a5f !important; color: #f8fafc; cursor: pointer; }
    
    /* Modal */
    .modal-backdrop { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 100; align-items: center; justify-content: center; padding: 24px; }
    .modal-backdrop.open { display: flex; }
    .modal { background: #0f172a; border: 1px solid #334155; border-radius: 12px; width: 100%; max-width: 850px; max-height: 85vh; display: flex; flex-direction: column; box-shadow: 0 20px 40px rgba(0,0,0,0.6); }
    .modal-head { padding: 16px 20px; border-bottom: 1px solid #1e293b; display: flex; justify-content: space-between; align-items: center; }
    .modal-head h3 { font-size: 16px; color: #38bdf8; }
    .modal-close { background: none; border: none; color: #94a3b8; font-size: 20px; cursor: pointer; }
    .modal-body { padding: 20px; overflow-y: auto; flex: 1; }
    .field-row { margin-bottom: 16px; }
    .field-key { font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b; margin-bottom: 4px; }
    .field-val { font-size: 13px; color: #f8fafc; line-height: 1.6; background: #090d16; padding: 10px 12px; border-radius: 6px; border: 1px solid #1e293b; white-space: pre-wrap; font-family: ui-monospace, SFMono-Regular, monospace; max-height: 250px; overflow-y: auto; }
  </style>
</head>
<body>
  <!-- Sidebar -->
  <div class="sidebar">
    <div class="sidebar-header">
      <h2>🏛️ KB Cruvels DB</h2>
      <p>PostgreSQL @ localhost:55440</p>
    </div>
    <div class="table-list" id="tableList"></div>
  </div>

  <!-- Main View -->
  <div class="main">
    <div class="topbar">
      <div class="topbar-left">
        <div class="current-title" id="currentTitle">Loading...</div>
        <input type="text" id="searchInput" class="search-input" placeholder="🔍 Search in this table...">
      </div>
      <div class="pagination">
        <button class="btn" id="prevBtn" onclick="changePage(-1)">← Prev</button>
        <span class="page-info" id="pageInfo">Page 1 of 1</span>
        <button class="btn" id="nextBtn" onclick="changePage(1)">Next →</button>
      </div>
    </div>
    <div class="grid-wrap">
      <table>
        <thead id="gridHead"></thead>
        <tbody id="gridBody"></tbody>
      </table>
    </div>
  </div>

  <!-- Detail Modal -->
  <div class="modal-backdrop" id="modalBackdrop" onclick="closeModal(event)">
    <div class="modal" onclick="event.stopPropagation()">
      <div class="modal-head">
        <h3 id="modalTitle">Row Details</h3>
        <button class="modal-close" onclick="closeModal()">✕</button>
      </div>
      <div class="modal-body" id="modalBody"></div>
    </div>
  </div>

  <script>
    let activeTable = "court_judgments";
    let currentPage = 1;
    let totalPages = 1;
    let searchDebounce = null;
    let currentRows = [];

    async function init() {
      const res = await fetch("/api/tables");
      const tables = await res.json();
      const list = document.getElementById("tableList");
      list.innerHTML = "";
      Object.entries(tables).forEach(([t, count]) => {
        const div = document.createElement("div");
        div.className = "table-item " + (t === activeTable ? "active" : "");
        div.innerHTML = `<span>${t}</span><span class="badge">${Number(count).toLocaleString()}</span>`;
        div.onclick = () => {
          activeTable = t;
          currentPage = 1;
          document.getElementById("searchInput").value = "";
          updateTableListActive();
          loadData();
        };
        list.appendChild(div);
      });
      loadData();
    }

    function updateTableListActive() {
      document.querySelectorAll(".table-item").forEach(el => {
        el.classList.toggle("active", el.querySelector("span").innerText === activeTable);
      });
    }

    async function loadData() {
      const search = document.getElementById("searchInput").value;
      document.getElementById("currentTitle").innerText = activeTable;
      const res = await fetch(`/api/data/${activeTable}?page=${currentPage}&limit=50&search=${encodeURIComponent(search)}`);
      const data = await res.json();
      
      totalPages = data.pages;
      currentRows = data.rows;
      document.getElementById("pageInfo").innerText = `Page ${data.page} of ${Number(data.pages).toLocaleString()} (${Number(data.total).toLocaleString()} rows)`;
      document.getElementById("prevBtn").disabled = data.page <= 1;
      document.getElementById("nextBtn").disabled = data.page >= data.pages;

      // Render columns
      const thead = document.getElementById("gridHead");
      thead.innerHTML = "<tr>" + data.columns.map(c => `<th>${c}</th>`).join("") + "</tr>";

      // Render rows
      const tbody = document.getElementById("gridBody");
      if (data.rows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${data.columns.length}" style="text-align: center; padding: 40px; color: #64748b;">No matching rows found.</td></tr>`;
        return;
      }
      tbody.innerHTML = data.rows.map((row, idx) => {
        return `<tr onclick="openModal(${idx})">` + data.columns.map(c => {
          let val = row[c] ?? "";
          return `<td title="${val.replace(/"/g, '&quot;')}">${val}</td>`;
        }).join("") + "</tr>";
      }).join("");
    }

    function changePage(delta) {
      if (currentPage + delta >= 1 && currentPage + delta <= totalPages) {
        currentPage += delta;
        loadData();
      }
    }

    document.getElementById("searchInput").addEventListener("input", () => {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        currentPage = 1;
        loadData();
      }, 300);
    });

    function openModal(idx) {
      const row = currentRows[idx];
      document.getElementById("modalTitle").innerText = `${activeTable} — Row ${idx + 1}`;
      const body = document.getElementById("modalBody");
      body.innerHTML = Object.entries(row).map(([k, v]) => {
        return `<div class="field-row">
          <div class="field-key">${k}</div>
          <div class="field-val">${v ? v.replace(/</g, "&lt;").replace(/>/g, "&gt;") : '<em style="color:#64748b">null</em>'}</div>
        </div>`;
      }).join("");
      document.getElementById("modalBackdrop").classList.add("open");
    }

    function closeModal() {
      document.getElementById("modalBackdrop").classList.remove("open");
    }

    init();
  </script>
</body>
</html>
"""

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8080, log_level="warning")
