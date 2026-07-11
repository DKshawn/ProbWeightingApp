import { useState } from "react";
import { getCiCsvUrl, getPwfComprehensionCsvUrl, getPwfCsvUrl } from "../api/client";

const crc32Table = Array.from({ length: 256 }, (_, index) => {
  let crc = index;
  for (let bit = 0; bit < 8; bit += 1) {
    crc = (crc & 1) ? (0xedb88320 ^ (crc >>> 1)) : (crc >>> 1);
  }
  return crc >>> 0;
});

export default function FinishScreen({ studentId, includePwfComprehension = true }) {
  const [saving, setSaving] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const ciCsvUrl = getCiCsvUrl(studentId);
  const pwfCsvUrl = getPwfCsvUrl(studentId);
  const pwfComprehensionCsvUrl = getPwfComprehensionCsvUrl(studentId);

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
      ...(includePwfComprehension ? [{
        url: pwfComprehensionCsvUrl,
        name: `PWF_Comprehension_${studentId}_${timestamp}.csv`,
      }] : []),
    ];

    const blobs = await Promise.all(files.map((file) => fetchCsv(file.url)));
    const zipBlob = await createZipBlob(files.map((file, index) => ({
      name: file.name,
      blob: blobs[index],
    })));
    triggerDownload(`PWF_CI_${studentId}_${timestamp}.zip`, zipBlob);
  }

  async function createZipBlob(files) {
    const entries = await Promise.all(files.map(async (file) => ({
      name: file.name,
      data: new Uint8Array(await file.blob.arrayBuffer()),
    })));
    return new Blob([buildStoredZip(entries)], { type: "application/zip" });
  }

  function buildStoredZip(entries) {
    const encoder = new TextEncoder();
    const localParts = [];
    const centralParts = [];
    let offset = 0;
    const timestamp = zipTimestamp(new Date());

    entries.forEach((entry) => {
      const nameBytes = encoder.encode(entry.name);
      const crc = crc32(entry.data);
      const localHeader = new Uint8Array(30 + nameBytes.length);
      const localView = new DataView(localHeader.buffer);
      writeZipHeader(localView, {
        signature: 0x04034b50,
        versionNeeded: 20,
        flags: 0,
        method: 0,
        time: timestamp.time,
        date: timestamp.date,
        crc,
        compressedSize: entry.data.length,
        uncompressedSize: entry.data.length,
        filenameLength: nameBytes.length,
        extraLength: 0,
      });
      localHeader.set(nameBytes, 30);
      localParts.push(localHeader, entry.data);

      const centralHeader = new Uint8Array(46 + nameBytes.length);
      const centralView = new DataView(centralHeader.buffer);
      writeCentralDirectoryHeader(centralView, {
        signature: 0x02014b50,
        versionMadeBy: 20,
        versionNeeded: 20,
        flags: 0,
        method: 0,
        time: timestamp.time,
        date: timestamp.date,
        crc,
        compressedSize: entry.data.length,
        uncompressedSize: entry.data.length,
        filenameLength: nameBytes.length,
        extraLength: 0,
        commentLength: 0,
        diskNumber: 0,
        internalAttributes: 0,
        externalAttributes: 0,
        localHeaderOffset: offset,
      });
      centralHeader.set(nameBytes, 46);
      centralParts.push(centralHeader);

      offset += localHeader.length + entry.data.length;
    });

    const centralDirectoryOffset = offset;
    const centralDirectorySize = centralParts.reduce((sum, part) => sum + part.length, 0);
    const endRecord = new Uint8Array(22);
    const endView = new DataView(endRecord.buffer);
    endView.setUint32(0, 0x06054b50, true);
    endView.setUint16(4, 0, true);
    endView.setUint16(6, 0, true);
    endView.setUint16(8, entries.length, true);
    endView.setUint16(10, entries.length, true);
    endView.setUint32(12, centralDirectorySize, true);
    endView.setUint32(16, centralDirectoryOffset, true);
    endView.setUint16(20, 0, true);

    return concatUint8Arrays([...localParts, ...centralParts, endRecord]);
  }

  function writeZipHeader(view, header) {
    view.setUint32(0, header.signature, true);
    view.setUint16(4, header.versionNeeded, true);
    view.setUint16(6, header.flags, true);
    view.setUint16(8, header.method, true);
    view.setUint16(10, header.time, true);
    view.setUint16(12, header.date, true);
    view.setUint32(14, header.crc, true);
    view.setUint32(18, header.compressedSize, true);
    view.setUint32(22, header.uncompressedSize, true);
    view.setUint16(26, header.filenameLength, true);
    view.setUint16(28, header.extraLength, true);
  }

  function writeCentralDirectoryHeader(view, header) {
    view.setUint32(0, header.signature, true);
    view.setUint16(4, header.versionMadeBy, true);
    view.setUint16(6, header.versionNeeded, true);
    view.setUint16(8, header.flags, true);
    view.setUint16(10, header.method, true);
    view.setUint16(12, header.time, true);
    view.setUint16(14, header.date, true);
    view.setUint32(16, header.crc, true);
    view.setUint32(20, header.compressedSize, true);
    view.setUint32(24, header.uncompressedSize, true);
    view.setUint16(28, header.filenameLength, true);
    view.setUint16(30, header.extraLength, true);
    view.setUint16(32, header.commentLength, true);
    view.setUint16(34, header.diskNumber, true);
    view.setUint16(36, header.internalAttributes, true);
    view.setUint32(38, header.externalAttributes, true);
    view.setUint32(42, header.localHeaderOffset, true);
  }

  function zipTimestamp(date) {
    return {
      time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
      date: ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
    };
  }

  function crc32(data) {
    let crc = 0xffffffff;
    data.forEach((byte) => {
      crc = (crc >>> 8) ^ crc32Table[(crc ^ byte) & 0xff];
    });
    return (crc ^ 0xffffffff) >>> 0;
  }

  function concatUint8Arrays(parts) {
    const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
    const output = new Uint8Array(totalLength);
    let offset = 0;
    parts.forEach((part) => {
      output.set(part, offset);
      offset += part.length;
    });
    return output;
  }

  function triggerDownload(filename, blob) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function handleDownloadAll() {
    setSaving(true);
    setDownloadError("");
    try {
      await saveCsvFiles();
    } catch (error) {
      if (error?.name !== "AbortError") {
        setDownloadError(error?.message || "ZIPの保存に失敗しました");
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
          {saving ? "作成中..." : "ZIPをダウンロード"}
        </button>
        {downloadError && <p className="error">{downloadError}</p>}
      </div>
    </div>
  );
}
