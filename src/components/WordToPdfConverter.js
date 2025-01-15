import React, { useState } from "react";
import axios from "axios";
import "./WordToPdfConvertor.css";

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
      // Update the backend URL to match your deployed backend on Render
      const response = await axios.post(
        // "https://certificate-generator-backend-452o.onrender.com/api/convert", // Your Render API URL
        "http://localhost:5000/api/convert",
       
        formData,
        {
          responseType: "blob", // This ensures you get the ZIP file
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      // Creating a download link for the response data (ZIP file)
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
