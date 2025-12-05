"use client";

import React, { useEffect, useState } from "react";

export default function Home() {
  const [printers, setPrinters] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [printer, setPrinter] = useState("");
  const [duplex, setDuplex] = useState("two-sided-long-edge");
  const [color, setColor] = useState("grayscale");
  const [copies, setCopies] = useState(1);
  const [format, setFormat] = useState("a4");
  const [sending, setSending] = useState(false);
  const [log, setLog] = useState("");

  useEffect(() => {
    fetch("/api/printers")
      .then((r) => r.json())
      .then((data) => {
        setPrinters(data.printers || []);
        if (data.printers && data.printers[0]) setPrinter(data.printers[0]);
      })
      .catch((e) => setLog("Fehler beim laden der Drucker: " + e.message));
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return setLog("Bitte wähle eine PDF Datei");
    if (!printer) return setLog("Bitte wähle einen Drucker");

    const fd = new FormData();
    fd.append("file", file);
    fd.append("printer", printer);
    fd.append("duplex", duplex);
    fd.append("color", color);
    fd.append("copies", String(copies));
    fd.append("format", format);

    setSending(true);
    setLog("Senden...");
    try {
      const res = await fetch("/api/print", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || JSON.stringify(json));
      setLog("Druckauftrag gesendet. Job id: " + json.jobId);
    } catch (err: any) {
      setLog("Fehler: " + err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-white shadow-lg rounded-xl p-8 border border-gray-200">
        <h1 className="text-3xl font-bold mb-6 text-gray-800 text-center">
          Druckerservice
        </h1>

        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              PDF hochladen
            </label>
            <input
              accept="application/pdf"
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="mt-2 block w-full text-sm border border-gray-300 text-gray-700 rounded-lg p-2 bg-gray-50 focus:ring-2 focus:ring-blue-500"
            />
            {file && (
              <div className="text-xs mt-1 text-gray-800">
                {file.name} ({Math.round(file.size / 1024)} KB)
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Drucker
            </label>
            <select
              value={printer}
              onChange={(e) => setPrinter(e.target.value)}
              className="mt-2 w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-blue-500"
            >
              {printers.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Duplex
              </label>
              <select
                value={duplex}
                onChange={(e) => setDuplex(e.target.value)}
                className="mt-2 w-full p-2 border border-gray-300 text-gray-700 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="one-sided">Simplex (one-sided)</option>
                <option value="two-sided-long-edge">Duplex — long edge</option>
                <option value="two-sided-short-edge">
                  Duplex — short edge
                </option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Farbmodus
              </label>
              <select
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="mt-2 w-full p-2 border text-gray-700 border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="color">Farbe</option>
                <option value="grayscale">Graustufen</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Kopien
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={copies}
                onChange={(e) => setCopies(Number(e.target.value))}
                className="mt-2 p-[5px] border text-gray-700 border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Format
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="mt-2 w-full p-2 border text-gray-700 border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="a4">A4</option>
                <option value="a3">A3</option>
              </select>
            </div>
          </div>

          <button
            disabled={sending}
            className="w-full py-2.5 text-white bg-teal-500 hover:bg-teal-600 rounded-lg font-medium disabled:opacity-60 transition"
          >
            {sending ? "Sendet…" : "An Drucker senden"}
          </button>
        </form>

        {log && (
          <div className="mt-6 bg-gray-50 border border-gray-200 p-3 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">
            {log}
          </div>
        )}
      </div>
    </div>
  );
}
