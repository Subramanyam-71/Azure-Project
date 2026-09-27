import { useEffect, useMemo, useState } from "react";
import "./App.css";

/*
  Local:
  React runs on localhost:5173
  Backend runs on localhost:5000

  Azure:
  React + backend run from the same App Service,
  so API calls use relative /api/... paths.
*/
const API_BASE =
  window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "";

const MONTHS = [
  { value: "2026-01", label: "January 2026" },
  { value: "2026-02", label: "February 2026" },
  { value: "2026-03", label: "March 2026" },
  { value: "2026-04", label: "April 2026" },
  { value: "2026-05", label: "May 2026" },
  { value: "2026-06", label: "June 2026" },
  { value: "2026-07", label: "July 2026" },
  { value: "2026-08", label: "August 2026" },
  { value: "2026-09", label: "September 2026" },
  { value: "2026-10", label: "October 2026" },
  { value: "2026-11", label: "November 2026" },
  { value: "2026-12", label: "December 2026" },
];

const MONTH_TOTALS = {
  "2026-01": 98000,
  "2026-02": 95000,
  "2026-03": 79000,
  "2026-04": 36500,
  "2026-05": 82000,
  "2026-06": 92000,
  "2026-07": 7000,
  "2026-08": 90000,
  "2026-09": 86000,
  "2026-10": 38500,
  "2026-11": 91000,
  "2026-12": 102000,
};

const MONTH_TRANSACTIONS = {
  "2026-01": 3,
  "2026-02": 3,
  "2026-03": 2,
  "2026-04": 2,
  "2026-05": 2,
  "2026-06": 2,
  "2026-07": 1,
  "2026-08": 2,
  "2026-09": 2,
  "2026-10": 2,
  "2026-11": 2,
  "2026-12": 2,
};

function formatCurrency(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "—";
  }

  return `₹${Number(value).toLocaleString("en-IN")}`;
}

function App() {
  const [summary, setSummary] = useState(null);
  const [apiError, setApiError] = useState(false);

  const [month, setMonth] = useState("2026-09");
  const [partition, setPartition] = useState("date");
  const [format, setFormat] = useState("CSV");

  const [queryResult, setQueryResult] = useState(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryError, setQueryError] = useState("");

  const currentMonth = MONTHS.find((item) => item.value === month);

  /*
    Load dashboard summary from Azure backend.
  */
  useEffect(() => {
    fetch(`${API_BASE}/api/summary`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("API request failed");
        }

        return res.json();
      })
      .then((data) => {
        console.log("Azure API data:", data);
        setSummary(data);
        setApiError(false);
      })
      .catch((error) => {
        console.error("API error:", error);
        setApiError(true);
      });
  }, []);

  /*
    Run real Synapse query through Node backend.
  */
  const runQuery = async () => {
    setQueryLoading(true);
    setQueryError("");
    setQueryResult(null);

    try {
      const url =
        `${API_BASE}/api/query` +
        `?month=${encodeURIComponent(month)}` +
        `&partition=${encodeURIComponent(partition)}`;

      const response = await fetch(url);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Query failed");
      }

      setQueryResult(data);
    } catch (error) {
      console.error("Query error:", error);
      setQueryError(error.message);
    } finally {
      setQueryLoading(false);
    }
  };

  /*
    Local information about the selected month.
    This is used only for the UI explanation.
    The actual result comes from Synapse.
  */
  const expectedMonthData = useMemo(() => {
    return {
      total: MONTH_TOTALS[month],
      transactions: MONTH_TRANSACTIONS[month],
    };
  }, [month]);

  /*
    Partition explanation.
  */
  const partitionInfo = useMemo(() => {
    if (partition === "date") {
      return {
        title: "Monthly date partition",
        description:
          "Synapse targets only the selected month's partition folder.",
        type: "Partitioned",
      };
    }

    if (partition === "none") {
      return {
        title: "No partition",
        description:
          "Synapse reads the original sales.csv and applies a date filter.",
        type: "Unpartitioned",
      };
    }

    return {
      title: "Region partition",
      description:
        "Region partitioning is not implemented for the current dataset.",
      type: "Not implemented",
    };
  }, [partition]);

  const today = new Date();

  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="app-shell">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">S</span>
          <span>SCANWISE</span>
        </div>

        <div className="workspace-label">WORKSPACE</div>

        <div className="workspace">
          <span className="workspace-dot" />
          Analytics Lab
          <span className="chevron">⌄</span>
        </div>

        <nav>
          <a className="nav-item active" href="#overview">
            <span>◈</span>
            Overview
          </a>

          <a className="nav-item" href="#query-lab">
            <span>⌁</span>
            Query Lab
          </a>

          <a className="nav-item" href="#datasets">
            <span>▦</span>
            Datasets
            <b>1</b>
          </a>

          <a className="nav-item" href="#recommendations">
            <span>✦</span>
            Recommendations
            <b className="alert-badge">2</b>
          </a>
        </nav>

        <div className="sidebar-bottom">
          <a className="nav-item" href="#settings">
            <span>⚙</span>
            Settings
          </a>

          <div className="user">
            <div className="avatar">SC</div>

            <div>
              <strong>SCANWISE</strong>
              <small>Analytics Lab</small>
            </div>

            <span>⋮</span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        {/* TOP BAR */}
        <header className="topbar">
          <div>
            <div className="eyebrow">{formattedDate.toUpperCase()}</div>

            <h1>
              SCANWISE <span>✦</span>
            </h1>
          </div>

          <div className="top-actions">
            <button className="icon-button" aria-label="Notifications">
              ♧
              <i />
            </button>

            <button className="help-button">
              ?
              <span>Azure Synapse</span>
            </button>
          </div>
        </header>

        {/* INTRO */}
        <section className="intro">
          <div>
            <p className="section-kicker">
              COST & PERFORMANCE CONTROL
            </p>

            <h2>Make every query count.</h2>

            <p className="subhead">
              See how data layout changes the query target,
              then use partitioning to reduce unnecessary reads.
            </p>
          </div>

          <button
            className="primary-button"
            onClick={() =>
              document
                .getElementById("query-lab")
                ?.scrollIntoView({
                  behavior: "smooth",
                })
            }
          >
            Open query lab
            <span>→</span>
          </button>
        </section>

        {/* KPI CARDS */}
        <section className="kpi-grid" id="overview">
          {/* TOTAL SALES */}
          <article className="kpi-card">
            <div className="kpi-top">
              <span>TOTAL SALES</span>

              <span className="trend up">
                LIVE
              </span>
            </div>

            <strong>
              {summary
                ? formatCurrency(summary.total_sales)
                : "Loading..."}
            </strong>

            <div className="cost-bar">
              <span />
            </div>

            <p>From Azure Synapse</p>
          </article>

          {/* AVERAGE SALE */}
          <article className="kpi-card">
            <div className="kpi-top">
              <span>AVERAGE SALE</span>

              <span className="trend up">
                LIVE
              </span>
            </div>

            <strong>
              {summary
                ? formatCurrency(
                    Number(summary.average_sale).toFixed(0)
                  )
                : "Loading..."}
            </strong>

            <div className="cost-bar">
              <span />
            </div>

            <p>Calculated from sales.csv</p>
          </article>

          {/* TRANSACTIONS */}
          <article className="kpi-card">
            <div className="kpi-top">
              <span>TRANSACTIONS</span>

              <span className="trend up">
                LIVE
              </span>
            </div>

            <strong>
              {summary
                ? Number(
                    summary.total_transactions
                  ).toLocaleString("en-IN")
                : "Loading..."}
            </strong>

            <div className="ring">
              <span>
                {summary ? "Live" : "..."}
              </span>
            </div>

            <p>Records in Azure Data Lake</p>
          </article>
        </section>

        {/* MAIN GRID */}
        <div className="content-grid">
          {/* QUERY LAB */}
          <section
            className="panel query-panel"
            id="query-lab"
          >
            <div className="panel-heading">
              <div>
                <p className="section-kicker">
                  QUERY LAB
                </p>

                <h3>
                  Test your data layout
                </h3>
              </div>

              <span className="live-pill">
                <i />
                Live Synapse query
              </span>
            </div>

            <div className="query-form">
              {/* MONTH */}
              <label>
                Month

                <select
                  value={month}
                  onChange={(e) => {
                    setMonth(e.target.value);
                    setQueryResult(null);
                    setQueryError("");
                  }}
                >
                  {MONTHS.map((item) => (
                    <option
                      key={item.value}
                      value={item.value}
                    >
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              {/* PARTITION */}
              <label>
                Partition

                <select
                  value={partition}
                  onChange={(e) => {
                    setPartition(e.target.value);
                    setQueryResult(null);
                    setQueryError("");
                  }}
                >
                  <option value="date">
                    Date / event_date
                  </option>

                  <option value="none">
                    No partition
                  </option>

                  <option value="region">
                    Region
                  </option>
                </select>
              </label>

              {/* FORMAT */}
              <label>
                File format

                <select
                  value={format}
                  onChange={(e) =>
                    setFormat(e.target.value)
                  }
                >
                  <option value="CSV">
                    CSV
                  </option>

                  <option value="Parquet">
                    Parquet
                  </option>

                  <option value="Delta">
                    Delta
                  </option>
                </select>
              </label>
            </div>

            {/* QUERY TARGET */}
            <div className="query-detail-card">
              <div>
                <span>QUERY TARGET</span>

                <strong>
                  {partition === "date"
                    ? `sales_partitioned/${month}/`
                    : "raw/sales.csv"}
                </strong>
              </div>

              <div>
                <span>DATA LAYOUT</span>

                <strong>
                  {partitionInfo.type}
                </strong>
              </div>

              <div>
                <span>FORMAT</span>

                <strong>{format}</strong>
              </div>
            </div>

            {/* EXPLANATION */}
            <div className="query-explanation">
              <div className="rec-icon blue">
                i
              </div>

              <div>
                <b>{partitionInfo.title}</b>

                <p>
                  {partitionInfo.description}
                </p>
              </div>
            </div>

            {/* EXPECTED DATA */}
            <div className="estimate-result">
              <div>
                <span>
                  SELECTED MONTH
                </span>

                <strong>
                  {currentMonth?.label}
                </strong>

                <p>
                  Expected data:{" "}
                  {formatCurrency(
                    expectedMonthData.total
                  )}{" "}
                  •{" "}
                  {expectedMonthData.transactions}{" "}
                  transactions
                </p>
              </div>

              <div className="score">
                <div className="score-circle">
                  <span>
                    {partition === "date"
                      ? "1"
                      : partition === "none"
                        ? "2"
                        : "—"}
                  </span>
                </div>

                <div>
                  <b>Query target</b>

                  <p>
                    {partition === "date"
                      ? "Monthly folder"
                      : partition === "none"
                        ? "Full CSV"
                        : "Not implemented"}
                  </p>
                </div>
              </div>
            </div>

            {/* RUN BUTTON */}
            <button
              className="run-button"
              onClick={runQuery}
              disabled={queryLoading}
            >
              {queryLoading
                ? "Running query..."
                : "Run in Synapse"}

              <span>
                {queryLoading ? "…" : "↗"}
              </span>
            </button>

            {/* QUERY ERROR */}
            {queryError && (
              <div
                className="query-detail-card"
                style={{
                  marginTop: "16px",
                  borderColor: "#ef4444",
                }}
              >
                <div>
                  <span>QUERY ERROR</span>

                  <strong>
                    {queryError}
                  </strong>
                </div>
              </div>
            )}

            {/* QUERY RESULT */}
            {queryResult && (
              <div
                className="query-detail-card"
                style={{
                  marginTop: "16px",
                }}
              >
                <div>
                  <span>RESULT</span>

                  <strong>
                    {formatCurrency(
                      queryResult.total_sales
                    )}
                  </strong>
                </div>

                <div>
                  <span>TRANSACTIONS</span>

                  <strong>
                    {Number(
                      queryResult.transactions
                    ).toLocaleString("en-IN")}
                  </strong>
                </div>

                <div>
                  <span>PARTITION</span>

                  <strong>
                    {queryResult.partition}
                  </strong>
                </div>

                <div
                  style={{
                    gridColumn: "1 / -1",
                  }}
                >
                  <span>FILE READ</span>

                  <strong
                    style={{
                      fontSize: "0.78rem",
                      wordBreak: "break-all",
                    }}
                  >
                    {queryResult.file}
                  </strong>
                </div>
              </div>
            )}
          </section>

          {/* RECOMMENDATIONS */}
          <section
            className="panel rec-panel"
            id="recommendations"
          >
            <div className="panel-heading">
              <div>
                <p className="section-kicker">
                  SMART RECOMMENDATIONS
                </p>

                <h3>Quick wins</h3>
              </div>

              <a href="#recommendations">
                View all
                <span>→</span>
              </a>
            </div>

            <div className="recommendation">
              <div className="rec-icon amber">
                !
              </div>

              <div>
                <b>
                  Partition by{" "}
                  <code>event_date</code>
                </b>

                <p>
                  Organizing data by month lets a
                  month-specific query target the
                  relevant partition instead of the
                  complete dataset.
                </p>

                <a href="#query-lab">
                  Test partitioning
                  <span>→</span>
                </a>
              </div>
            </div>

            <div className="recommendation">
              <div className="rec-icon teal">
                ↗
              </div>

              <div>
                <b>
                  Use columnar formats for larger
                  datasets
                </b>

                <p>
                  Parquet can reduce the amount of
                  data read for queries that select
                  only specific columns.
                </p>

                <a href="#query-lab">
                  Compare layouts
                  <span>→</span>
                </a>
              </div>
            </div>

            <div className="recommendation">
              <div className="rec-icon blue">
                i
              </div>

              <div>
                <b>
                  Avoid unnecessary full-file scans
                </b>

                <p>
                  The current demo proves the
                  difference in query targeting.
                  Actual scan savings depend on
                  dataset size and file layout.
                </p>

                <a href="#query-lab">
                  Run a comparison
                  <span>→</span>
                </a>
              </div>
            </div>
          </section>
        </div>

        {/* DATASETS */}
        <section
          className="panel datasets-panel"
          id="datasets"
        >
          <div className="panel-heading">
            <div>
              <p className="section-kicker">
                DATA LAKE HEALTH
              </p>

              <h3>SCANWISE dataset</h3>
            </div>

            <button className="text-button">
              ADLS Gen2
              <span>→</span>
            </button>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>DATASET</th>
                  <th>ROWS</th>
                  <th>PARTITION KEY</th>
                  <th>FORMAT</th>
                  <th>HEALTH</th>
                  <th>STORAGE</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td>
                    <span className="dataset-icon orange">
                      ▦
                    </span>

                    <b>sales_events</b>
                  </td>

                  <td>25</td>

                  <td>
                    <code>event_date</code>
                  </td>

                  <td>
                    <span className="format">
                      CSV
                    </span>
                  </td>

                  <td>
                    <span className="health good">
                      <i />
                      Connected
                    </span>
                  </td>

                  <td>ADLS Gen2</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* FOOTER */}
        <footer>
          <span>
            <i />

            {apiError
              ? "Backend connection error"
              : summary
                ? "Azure API connected"
                : "Connecting to Azure..."}
          </span>

          <span>
            Synapse Serverless SQL
          </span>
        </footer>
      </main>
    </div>
  );
}

export default App;