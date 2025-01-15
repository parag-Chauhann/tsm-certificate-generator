import React from "react";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import { Link } from "react-router-dom";

const CertificateGenerator = ({ template, certificates, onBack }) => {
  
  // Load the certificate template
  const loadTemplate = async () => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(new PizZip(e.target.result));
      reader.onerror = (error) => reject(error);
      reader.readAsBinaryString(template);
    });
  };

  // Generate a single certificate file for each entry
  const generateCertificateFile = async (data) => {
    const templateZip = await loadTemplate();
    const doc = new Docxtemplater(templateZip, { paragraphLoop: true, linebreaks: true });

    doc.setData(data);
    doc.render();

    return doc.getZip().generate({ type: "blob" });
  };

  // Download all certificates in a ZIP file
  const handleDownloadAllAsZip = async () => {
    const zip = new JSZip();
    for (const { name, data } of certificates) {
      try {
        const fileBlob = await generateCertificateFile(data);
        zip.file(name, fileBlob);
      } catch (error) {
        console.error("Error generating certificate:", error);
      }
    }
    zip.generateAsync({ type: "blob" }).then((content) => saveAs(content, "Certificates.zip"));
  };

  // Download a single certificate
  const handleDownloadSingleFile = async (file) => {
    try {
      const fileBlob = await generateCertificateFile(file.data);
      saveAs(fileBlob, file.name);
    } catch (error) {
      console.error("Error downloading single certificate:", error);
    }
  };

  return (
    <div className="certificates">
      <h3>Generated Certificates:</h3>
      <div className="back-download-button">
        <button className="back-button" onClick={onBack}>Back</button>
        <button className="button" onClick={handleDownloadAllAsZip}>Download All as ZIP</button>
        <Link to="/word-to-pdf">
        <button className="button" >Download as PDF</button>
        </Link>
      </div>
      <ul className="certificate-list">
        {certificates.map((file, index) => (
          <li key={index}>
            <button onClick={() => handleDownloadSingleFile(file)} className="certificate-list-button">
              Download {file.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CertificateGenerator;