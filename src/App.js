import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import FileUpload from "./components/FileUpload";
import CertificateGenerator from "./components/CertificateGenerator";
import { db } from "./firebase"; // Ensure this is after Firebase initialization
import { doc, getDoc, setDoc, collection, addDoc } from "firebase/firestore";
// import WordToPdfConverter from "./components/wordToPdfConvertor";
import WordToPdfConverter from "./components/wordToPdfConvertor";  // Correct file casing



const App = () => {
  const [excelData, setExcelData] = useState([]);
  const [template, setTemplate] = useState(null);
  const [generatedCertificates, setGeneratedCertificates] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [projectNumber, setProjectNumber] = useState("");

  const handleDataExtracted = (data) => {
    setExcelData(data);
  };

  const handleTemplateUpload = (e) => {
    const uploadedTemplate = e.target.files[0];
    setTemplate(uploadedTemplate);
  };

  const formatDateToNumeric = (date) => {
    return date.toISOString().split("T")[0].replace(/-/g, "");
  };

  const parseExcelDate = (excelDate) => {
    if (typeof excelDate === "number") {
      const date = new Date((excelDate - 25569) * 86400 * 1000);
      return date;
    } else if (typeof excelDate === "string") {
      const [day, month, year] = excelDate.split("-").map(Number);
      return new Date(year, month - 1, day);
    } else {
      throw new Error("Invalid date format");
    }
  };

  const generateCertificateNumber = async (companyName) => {
    const docRef = doc(db, "certificates", "globalCounter");
    const docSnapshot = await getDoc(docRef);

    let currentCounter = 16000;
    if (docSnapshot.exists()) {
      currentCounter = docSnapshot.data().counter;
    }

    await setDoc(docRef, { counter: currentCounter + 1 });

    await addDoc(collection(db, "certificates"), {
      companyName,
      certificateNumber: currentCounter,
    });

    return currentCounter;
  };

  const handleGenerateCertificates = async () => {
    if (!template) {
      setErrorMessage("Please upload a Word template!");
      return;
    }
    if (!excelData || excelData.length === 0) {
      setErrorMessage("Please upload a valid Excel file with participant data!");
      return;
    }
    if (!projectNumber) {
      setErrorMessage("Please enter a valid project number!");
      return;
    }

    setErrorMessage("");

    const certificates = [];
    for (const record of excelData) {
      let dateOfTraining = record["Date of Training"];
      let formattedDate = "";

      try {
        const dateObj = parseExcelDate(dateOfTraining);
        if (isNaN(dateObj)) throw new Error("Invalid date");
        formattedDate = formatDateToNumeric(dateObj);
      } catch (error) {
        setErrorMessage(`Invalid date format for: ${record["Name"]}`);
        return;
      }

      const certificateNumber = await generateCertificateNumber(record["Company Name"]);

      const templateData = {
        name: record.Name,
        dateOfTraining: parseExcelDate(dateOfTraining).toLocaleDateString("en-GB"),
        title: record.Title,
        certificateNumber: `TSM${projectNumber}${formattedDate}${certificateNumber}`,
        companyName: record["Company Name"],
      };

      certificates.push({
        name: `${record.Name}_Certificate.docx`,
        data: templateData,
      });
    }

    setGeneratedCertificates(certificates);
  };

  return (
    <Router>
      <div className="main-container">
        <div className="container">
          <Routes>
            <Route
              path="/"
              element={
                generatedCertificates.length === 0 ? (
                  <>
                    <h1>Certificate Generator</h1>
                    <FileUpload onDataExtracted={handleDataExtracted} />
                    <div className="file-upload">
                      <h4>Select certificate template</h4>
                      <input
                        type="file"
                        accept=".docx"
                        onChange={handleTemplateUpload}
                        className="file-upload-input"
                      />
                      <button
                        className="Download-button"
                        onClick={() =>
                          alert("Certificate Template uploaded successfully!")
                        }
                      >
                        <span>Upload Template</span>
                      </button>
                    </div>

                    <div className="file-upload project-number-input">
                      <h4>Enter Project Number (TSM- is fixed)</h4>
                      <input
                        type="number"
                        value={projectNumber}
                        onChange={(e) => setProjectNumber(e.target.value)}
                        placeholder="TSM-Take from account department"
                      />
                    </div>

                    <button className="button" onClick={handleGenerateCertificates}>
                      Generate Certificates
                    </button>

                    {errorMessage && <div className="error-message">{errorMessage}</div>}
                  </>
                ) : (
                  <CertificateGenerator
                    template={template}
                    certificates={generatedCertificates}
                    onBack={() => setGeneratedCertificates([])}
                  />
                )
              }
            />
            {/* <Route path="/word-to-pdf" element={<WordToPdfConverter />} /> */}
            <Route path="/word-to-pdf" element={<WordToPdfConverter />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
