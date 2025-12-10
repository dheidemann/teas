"use client";

import Link from "next/link";
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
    <div className="min-h-screen bg-gray-100 flex flex-col space-y-4 items-center justify-center p-6">
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
      <footer className="text-gray-400 text-sm flex flex-row items-center space-x-4">
        <p>v{process.env.NEXT_PUBLIC_APP_VERSION}</p>
        <Link href="https://github.com/dheidemann/teas">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="size-4"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
        </Link>
      </footer>
    </div>
  );
}
