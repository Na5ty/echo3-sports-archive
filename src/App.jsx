import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import logo from "./assets/fuck-ill-intend.jpeg";

const STORAGE_KEY = "echo3_sports_archive_v1";

const TAGLINES = [
  "Discipline disguised as chaos.",
  "Engines don’t lie.",
  "Run. Log. Repeat.",
  "No witnesses. Only data.",
  "Victory is recovery after the spike.",
  "Dirty fuel. Clean output.",
  "You don’t stop. You adapt.",
  "A little obstacle. A little proof.",
  "Pain is feedback.",
  "Silence the doubt. Log the proof.",
  "Breath heavy. Mind clear.",
  "Data doesn’t gaslight you.",
  "You survived worse.",
  "Consistency beats emotion.",
  "Weak moments. Strong pattern.",
  "The hill doesn’t care. Neither do you.",
  "Heart rate rising. Ego lowering.",
  "Train like no one is watching. Because no one is.",
  "Systems don’t negotiate.",
  "Stress creates capacity.",
  "Fuel the furnace.",
  "Pressure builds engines.",
  "Output > excuses.",
  "Recovery is strategy.",
  "Numbers reveal truth.",
  "Calm is earned.",
  "Work the circuit.",
  "Endurance is identity.",
  "Chaos is just untrained energy.",
  "The body keeps receipts.",
  "Adapt or stall.",
  "You don’t need applause.",
  "The archive remembers.",
  "Proof over paranoia.",
  "Suffer quietly. Improve loudly.",
  "One more breath.",
  "The spike is the point.",
  "This is what discipline feels like.",
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function parseNumber(s) {
  if (s == null) return undefined;
  const t = String(s).trim();
  if (t === "") return undefined;
  const n = Number(t.replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}

// Compress an image file to a small preview dataURL (JPEG)
async function fileToPreviewDataUrl(
  file,
  { maxWidth = 900, quality = 0.75 } = {}
) {
  const imgUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = imgUrl;
    });

    const scale = Math.min(1, maxWidth / img.width);
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, w, h);

    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    URL.revokeObjectURL(imgUrl);
  }
}

export default function App() {
  const [entries, setEntries] = useState(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  });

  // EDIT MODE
  const [editingId, setEditingId] = useState(null);

  const [tagline, setTagline] = useState(() => pickRandom(TAGLINES));

  useEffect(() => {
    const ROTATE_MS = 9000;
    if (!ROTATE_MS) return;

    const id = setInterval(() => {
      if (editingId) return;

      setTagline((prev) => {
        let next = pickRandom(TAGLINES);
        let guard = 0;
        while (next === prev && guard < 10) {
          next = pickRandom(TAGLINES);
          guard++;
        }
        return next;
      });
    }, ROTATE_MS);

    return () => clearInterval(id);
  }, [editingId]);

  function nextTagline() {
    setTagline((prev) => {
      let next = pickRandom(TAGLINES);
      let guard = 0;
      while (next === prev && guard < 10) {
        next = pickRandom(TAGLINES);
        guard++;
      }
      return next;
    });
  }

  // Form state
  const [date, setDate] = useState(todayISO());
  const [type, setType] = useState("run");
  const [duration, setDuration] = useState("");

  const [distanceKm, setDistanceKm] = useState("");
  const [calories, setCalories] = useState("");
  const [avgHr, setAvgHr] = useState("");
  const [maxHr, setMaxHr] = useState("");

  const [note, setNote] = useState("");

  // Chart image preview for form
  const [chartPreview, setChartPreview] = useState(undefined);
  const [chartBusy, setChartBusy] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  async function onPickChartFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setChartBusy(true);
    try {
      const preview = await fileToPreviewDataUrl(file, {
        maxWidth: 900,
        quality: 0.75,
      });
      setChartPreview(preview);
    } finally {
      setChartBusy(false);
      e.target.value = "";
    }
  }

  function clearChart() {
    setChartPreview(undefined);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function resetForm(keepDateType = true) {
    if (!keepDateType) {
      setDate(todayISO());
      setType("run");
    }
    setDuration("");
    setDistanceKm("");
    setCalories("");
    setAvgHr("");
    setMaxHr("");
    setNote("");
    clearChart();
  }

  function addOrSaveEntry() {
    if (editingId) {
      setEntries((prev) =>
        prev.map((e) => {
          if (e.id !== editingId) return e;
          return {
            ...e,
            date,
            type,
            duration: duration.trim() || undefined,
            distanceKm: parseNumber(distanceKm),
            calories: parseNumber(calories),
            avgHr: parseNumber(avgHr),
            maxHr: parseNumber(maxHr),
            note: note.trim() || undefined,
            chartImage: chartPreview ?? e.chartImage,
            updatedAt: new Date().toISOString(),
          };
        })
      );

      setEditingId(null);
      resetForm(false);
      return;
    }

    const newEntry = {
      id: crypto.randomUUID(),
      date,
      type,
      duration: duration.trim() || undefined,
      distanceKm: parseNumber(distanceKm),
      calories: parseNumber(calories),
      avgHr: parseNumber(avgHr),
      maxHr: parseNumber(maxHr),
      note: note.trim() || undefined,
      chartImage: chartPreview || undefined,
      createdAt: new Date().toISOString(),
    };

    setEntries([newEntry, ...entries]);
    resetForm(true);
  }

  function removeEntry(id) {
    setEntries(entries.filter((e) => e.id !== id));
    if (editingId === id) {
      setEditingId(null);
      resetForm(false);
    }
  }

  function startEdit(entry) {
    setEditingId(entry.id);

    setDate(entry.date || todayISO());
    setType(entry.type || "run");
    setDuration(entry.duration || "");

    setDistanceKm(entry.distanceKm != null ? String(entry.distanceKm) : "");
    setCalories(entry.calories != null ? String(entry.calories) : "");
    setAvgHr(entry.avgHr != null ? String(entry.avgHr) : "");
    setMaxHr(entry.maxHr != null ? String(entry.maxHr) : "");

    setNote(entry.note || "");
    setChartPreview(entry.chartImage || undefined);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    resetForm(false);
  }

  function removeChartFromEntry(id) {
    setEntries(
      entries.map((e) => (e.id === id ? { ...e, chartImage: undefined } : e))
    );
    if (editingId === id) clearChart();
  }

  function formatDate(isoDate) {
    if (!isoDate) return "";
    return new Date(isoDate).toLocaleDateString("de-DE");
  }

  function exportJson() {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      entries,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `echo3-sports-archive-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function isoDateToDate(iso) {
    // expects "YYYY-MM-DD"
    const [y, m, d] = (iso || "").split("-").map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  }

  function startOfISOWeek(date) {
    // Monday as start
    const d = new Date(date);
    const day = d.getDay(); // 0 Sun .. 6 Sat
    const diff = (day === 0 ? -6 : 1) - day; // shift to Monday
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function dateToISO(d) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  // DD.MM.YYYY display
  function formatDE(iso) {
    const d = isoDateToDate(iso);
    if (!d) return iso || "—";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  }

  function isSameISOWeek(isoA, isoB) {
    const a = isoDateToDate(isoA);
    const b = isoDateToDate(isoB);
    if (!a || !b) return false;
    return dateToISO(startOfISOWeek(a)) === dateToISO(startOfISOWeek(b));
  }

  function summarize(entries) {
    const sessions = entries.length;

    const km = entries.reduce((sum, e) => sum + (Number(e.distanceKm) || 0), 0);
    const kcal = entries.reduce((sum, e) => sum + (Number(e.calories) || 0), 0);

    // avg HR: average of provided avgHr values (not weighted by duration)
    const avgHrValues = entries
      .map((e) => Number(e.avgHr))
      .filter((n) => Number.isFinite(n));
    const avgHr = avgHrValues.length
      ? Math.round(avgHrValues.reduce((a, b) => a + b, 0) / avgHrValues.length)
      : null;

    const maxHrValues = entries
      .map((e) => Number(e.maxHr))
      .filter((n) => Number.isFinite(n));
    const maxHr = maxHrValues.length ? Math.max(...maxHrValues) : null;

    return {
      sessions,
      km: km ? Number(km.toFixed(2)) : 0,
      kcal: kcal ? Math.round(kcal) : 0,
      avgHr,
      maxHr,
    };
  }

  const thisWeekEntries = useMemo(() => {
    const today = todayISO();
    return entries.filter((e) => e.date && isSameISOWeek(e.date, today));
  }, [entries]);

  const thisWeek = useMemo(() => summarize(thisWeekEntries), [thisWeekEntries]);

  function copyBackupToClipboard() {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      entries,
    };

    const text = JSON.stringify(payload, null, 2);

    navigator.clipboard
      .writeText(text)
      .then(() => alert("Backup copied to clipboard."))
      .catch(() => alert("Clipboard copy failed."));
  }

  function importFromText(text) {
    try {
      const parsed = JSON.parse(text);

      const importedEntries = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.entries)
        ? parsed.entries
        : null;

      if (!importedEntries) {
        alert("Import failed: invalid format.");
        return;
      }

      const byId = new Map(entries.map((e) => [e.id, e]));
      for (const en of importedEntries) {
        if (en && en.id) byId.set(en.id, en);
      }

      setEntries(
        Array.from(byId.values()).sort((a, b) =>
          (b.createdAt || "").localeCompare(a.createdAt || "")
        )
      );
      alert(`Imported ${importedEntries.length} entries.`);
    } catch (err) {
      alert("Import failed: invalid JSON.");
    }
  }

  async function importJson(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      const importedEntries = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.entries)
        ? parsed.entries
        : null;

      if (!importedEntries) {
        alert("Import failed: file format not recognized.");
        return;
      }

      // super light validation: must have id + date
      const cleaned = importedEntries
        .filter((x) => x && typeof x === "object")
        .map((x) => ({
          ...x,
          id: x.id || crypto.randomUUID(),
          date: x.date || todayISO(),
        }));

      // merge by id (import overrides)
      const byId = new Map(entries.map((en) => [en.id, en]));
      for (const en of cleaned) byId.set(en.id, en);

      setEntries(
        Array.from(byId.values()).sort((a, b) =>
          (b.createdAt || "").localeCompare(a.createdAt || "")
        )
      );
      alert(`Imported ${cleaned.length} entries.`);
    } catch (err) {
      console.error(err);
      alert("Import failed: invalid JSON.");
    } finally {
      e.target.value = "";
    }
  }

  return (
    <div className="container">
      <div className="header">
        <div className="brand">
          <img className="logo" src={logo} alt="FUCK ILL INTEND" />
          <div>
            <h1>Echo-3 Sports Archive</h1>
            <p
              className="sub"
              onClick={nextTagline}
              style={{ cursor: "pointer" }}
            >
              {tagline}
            </p>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >
          <div className="pill">
            {editingId
              ? "Editing mode: rewrite the memory."
              : "Local log (for now)."}
          </div>

          <button
            className="button secondary"
            onClick={exportJson}
            style={{ width: "auto" }}
          >
            Export JSON
          </button>

          <label
            className="button secondary"
            style={{ width: "auto", cursor: "pointer" }}
          >
            Import JSON
            <input
              type="file"
              accept="application/json"
              onChange={importJson}
              style={{ display: "none" }}
            />
          </label>

          <button
            className="button secondary"
            onClick={copyBackupToClipboard}
            style={{ width: "auto" }}
          >
            Copy Backup
          </button>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <div className="sectionTitle">This Week</div>

        <div className="statsline" style={{ marginTop: 8 }}>
          🗓️ {thisWeek.sessions} sessions
          {"  "}🏁 {thisWeek.km} km
          {"  "}🔥 {thisWeek.kcal} kcal
          {"  "}❤️ {thisWeek.avgHr != null ? `${thisWeek.avgHr} avg` : "— avg"}
          {"  "}💥 {thisWeek.maxHr != null ? `${thisWeek.maxHr} max` : "— max"}
        </div>

        <div className="small" style={{ marginTop: 8, opacity: 0.8 }}>
          Sorted by entry date (not when you typed it). The archive judges by
          truth, not by timestamps.
        </div>
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <div className="sectionTitle">Import from Text</div>

        <textarea
          className="input"
          rows={6}
          placeholder="Paste backup JSON here..."
          id="pasteArea"
        />

        <div
          style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}
        >
          <button
            className="button"
            onClick={() => {
              const text = document.getElementById("pasteArea").value;
              importFromText(text);
            }}
            style={{ width: "auto" }}
          >
            Import From Text
          </button>

          <button
            className="button secondary"
            onClick={() => {
              const el = document.getElementById("pasteArea");
              if (el) el.value = "";
            }}
            style={{ width: "auto" }}
          >
            Clear
          </button>
        </div>

        <p className="small" style={{ marginTop: 10 }}>
          Tip: Copy Backup → paste into WhatsApp/Notes → paste here on the other
          device.
        </p>
      </div>

      {editingId ? (
        <div className="panel">
          <strong>Editing mode:</strong> updating an existing entry.{" "}
          <span style={{ opacity: 0.8 }}>Save changes when ready.</span>
        </div>
      ) : null}

      <div className="panel">
        <div className="grid">
          <div className="field">
            <label>Date</label>
            <input
              className="input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Type</label>
            <select
              className="select"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="run">Run</option>
              <option value="bike">Bike</option>
              <option value="row">Rower</option>
              <option value="upper">Upper Body</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="field">
            <label>Duration</label>
            <input
              className="input"
              placeholder="01:19:54"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>

          <div
            className="field"
            style={{ display: "flex", gap: 10, alignItems: "end" }}
          >
            <button className="button" onClick={addOrSaveEntry}>
              {editingId ? "Save Changes" : "Add Entry"}
            </button>

            {editingId ? (
              <button
                className="button secondary"
                onClick={cancelEdit}
                style={{ width: "auto" }}
              >
                Cancel
              </button>
            ) : null}
          </div>

          <div className="field">
            <label>Distance (km)</label>
            <input
              className="input"
              placeholder="7.93"
              value={distanceKm}
              onChange={(e) => setDistanceKm(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Calories</label>
            <input
              className="input"
              placeholder="551"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Avg HR</label>
            <input
              className="input"
              placeholder="119"
              value={avgHr}
              onChange={(e) => setAvgHr(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Max HR</label>
            <input
              className="input"
              placeholder="180"
              value={maxHr}
              onChange={(e) => setMaxHr(e.target.value)}
            />
          </div>

          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label>Note (optional)</label>
            <input
              className="input"
              placeholder="e.g. Hill spike, pride, shoulder ok…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label>Attach chart screenshot (optional)</label>

            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={onPickChartFile}
              />

              {chartBusy ? <span className="small">Processing…</span> : null}

              {chartPreview ? (
                <button
                  className="button secondary"
                  onClick={clearChart}
                  style={{ width: "auto" }}
                >
                  Remove Image
                </button>
              ) : (
                <span className="small">
                  Tip: screenshot your HR chart and attach it here.
                </span>
              )}
            </div>

            {chartPreview ? (
              <img className="chart" src={chartPreview} alt="Chart preview" />
            ) : null}
          </div>
        </div>
      </div>

      <div className="sectionTitle">Log</div>

      {entries.length === 0 ? (
        <p>No entries yet. Add your first ritual.</p>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {[...entries]
            .sort((a, b) => {
              const byDate = (b.date || "").localeCompare(a.date || "");
              if (byDate !== 0) return byDate;
              return (b.createdAt || "").localeCompare(a.createdAt || "");
            })
            .map((e) => (
              <div key={e.id} className="card">
                <div style={{ flex: 1 }}>
                  <div className="meta">
                    {formatDate(e.date)} — {String(e.type || "").toUpperCase()}{" "}
                    — {e.duration || "—"}
                  </div>

                  <div className="statsline">
                    {e.distanceKm != null ? <>🏁 {e.distanceKm} km</> : null}
                    {e.calories != null ? (
                      <>
                        {"  "}🔥 {e.calories} kcal
                      </>
                    ) : null}
                    {e.avgHr != null ? (
                      <>
                        {"  "}❤️ {e.avgHr} avg
                      </>
                    ) : null}
                    {e.maxHr != null ? (
                      <>
                        {"  "}💥 {e.maxHr} max
                      </>
                    ) : null}
                  </div>

                  {e.note ? <div className="note">{e.note}</div> : null}

                  {e.chartImage ? (
                    <div>
                      <img
                        className="chart"
                        src={e.chartImage}
                        alt="Saved chart"
                      />
                      <div style={{ marginTop: 10 }}>
                        <button
                          className="button secondary"
                          onClick={() => removeChartFromEntry(e.id)}
                          style={{ width: "auto" }}
                        >
                          Remove chart
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {e.updatedAt ? (
                    <div className="small">
                      Edited: {new Date(e.updatedAt).toLocaleString()}
                    </div>
                  ) : null}
                </div>

                <div className="actions">
                  <button
                    className="button secondary"
                    onClick={() => startEdit(e)}
                  >
                    Edit
                  </button>
                  <button
                    className="button secondary"
                    onClick={() => removeEntry(e.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}

      <p className="small" style={{ marginTop: 14 }}>
        Note: images are stored in localStorage too (space is limited). If you
        attach a lot of screenshots, we’ll add Export/Import next.
      </p>
    </div>
  );
}
