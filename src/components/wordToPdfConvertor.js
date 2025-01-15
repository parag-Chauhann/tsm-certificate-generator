import React, { useState } from "react";
import axios from "axios";
import "./wordToPdfConvertor.css";

const WordToPdfConverter = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloadLink, setDownloadLink] = useState("");

  const handleFileChange = (e) => {
    setFiles(e.target.files);
  };

  const handleConvert = async () => {
    if (files.length === 0) {
      alert("Please upload files.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("files", file));

    try {
      const response = await axios.post(
        "http://127.0.0.1:5000/api/convert", // Ensure backend URL is correct
        formData,
        {
          responseType: "blob",
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      const url = URL.createObjectURL(new Blob([response.data]));
      setDownloadLink(url);
    } catch (error) {
      alert("Error converting files. Please check server logs for details.");
      console.error("Error:", error.message); // Log the exact error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h2>Word to PDF Converter</h2>
      <input
        type="file"
        multiple
        accept=".doc,.docx"
        onChange={handleFileChange}
      />
      <button onClick={handleConvert} disabled={loading}>
        {loading ? "Converting..." : "Convert"}
      </button>
      {downloadLink && (
        <div>
          <a href={downloadLink} download="converted-files.zip">
            Download PDFs
          </a>
        </div>
      )}
    </div>
  );
};

export default WordToPdfConverter;
