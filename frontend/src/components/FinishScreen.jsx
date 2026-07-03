import { useState } from "react";
import { getCiCsvUrl, getPwfCsvUrl } from "../api/client";

export default function FinishScreen({ studentId }) {
  const [saving, setSaving] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const ciCsvUrl = getCiCsvUrl(studentId);
  const pwfCsvUrl = getPwfCsvUrl(studentId);

  function buildTimestamp() {
    const now = new Date();
    const pad = (value) => String(value).padStart(2, "0");
    return [
      now.getFullYear(),
      pad(now.getMonth() + 1),
      pad(now.getDate()),
      "_",
      pad(now.getHours()),
      pad(now.getMinutes()),
      pad(now.getSeconds()),
    ].join("");
  }

  async function fetchCsv(url) {
    const response = await fetch(url);
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || "CSVの取得に失敗しました");
    }
    return response.blob();
  }

  async function writeBlobToHandle(fileHandle, blob) {
    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();
  }

  async function saveCsvFiles() {
    const timestamp = buildTimestamp();
    const files = [
      {
        url: ciCsvUrl,
        name: `CI_${studentId}_${timestamp}.csv`,
      },
      {
        url: pwfCsvUrl,
        name: `PWF_${studentId}_${timestamp}.csv`,
      },
    ];

    if (typeof window.showDirectoryPicker === "function") {
      const directoryHandle = await window.showDirectoryPicker({ mode: "readwrite" });
      const blobs = await Promise.all(files.map((file) => fetchCsv(file.url)));
      await Promise.all(
        files.map(async (file, index) => {
          const fileHandle = await directoryHandle.getFileHandle(file.name, { create: true });
          await writeBlobToHandle(fileHandle, blobs[index]);
        }),
      );
      return;
    }

    if (typeof window.showSaveFilePicker === "function") {
      for (const file of files) {
        const fileHandle = await window.showSaveFilePicker({
          suggestedName: file.name,
          types: [
            {
              description: "CSV",
              accept: { "text/csv": [".csv"] },
            },
          ],
        });
        const blob = await fetchCsv(file.url);
        await writeBlobToHandle(fileHandle, blob);
      }
      return;
    }

    throw new Error(
      "このブラウザでは保存先の選択に対応していません。Chrome/Edgeで開くか、ブラウザ設定でダウンロード前に保存先を確認してください。",
    );
  }

  function formatSaveError(error) {
    const message = error?.message || "";
    const isPickerError =
      message.includes("showDirectoryPicker") ||
      message.includes("showSaveFilePicker") ||
      message.includes("file picker") ||
      message.includes("user gesture");

    if (isPickerError) {
      return "保存先の選択画面を開けませんでした。Chrome/Edgeで開いて、もう一度CSVを保存してください。";
    }

    return message || "CSVの保存に失敗しました";
  }

  async function handleDownloadAll() {
    setSaving(true);
    setDownloadError("");
    try {
      await saveCsvFiles();
    } catch (error) {
      if (error?.name !== "AbortError") {
        setDownloadError(formatSaveError(error));
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="screen finish-screen">
      <div className="finish-content">
        <h2>実験が終了しました</h2>
        <p>ご協力ありがとうございました。</p>
        <button
          type="button"
          className="btn-primary btn-download"
          onClick={handleDownloadAll}
          disabled={saving}
        >
          {saving ? "保存中..." : "CSVを保存"}
        </button>
        {downloadError && <p className="error">{downloadError}</p>}
      </div>
    </div>
  );
}
