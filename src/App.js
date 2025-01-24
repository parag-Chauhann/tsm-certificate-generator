import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import FileUpload from "./components/FileUpload";
import CertificateGenerator from "./components/CertificateGenerator";
import { db } from "./firebase"; 
import { collection, addDoc, query, getDocs, orderBy, where, limit } from "firebase/firestore";
import WordToPdfConverter from "./components/WordToPdfConverter";

// Loading spinner component
const LoadingSpinner = () => (
  <div className="loading-spinner">
    <div className="spinner"></div>
    <p>Generating certificates...</p>
  </div>
);

const App = () => {
  const [excelData, setExcelData] = useState([]);
  const [template, setTemplate] = useState(null);
  const [generatedCertificates, setGeneratedCertificates] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [projectNumber, setProjectNumber] = useState("");
  const [firstCertificateNumber, setFirstCertificateNumber] = useState(null);
  const [lastCertificateNumber, setLastCertificateNumber] = useState(null);
  const [showWarning, setShowWarning] = useState(false); // State to show/hide the warning
  const [isLoading, setIsLoading] = useState(false); // State to show/hide loading spinner

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

  // Generate certificate number based on company and topic
  const generateCertificateNumber = async (companyName, topic, projectNumber) => {
    const certificatesCollection = collection(db, "certificates");

    // Create a composite ID based on company name and topic for better future searches
    const certificateId = `${companyName}_${topic}`;

    // Fetch the latest certificate number for the specific company and topic
    const q = query(
      certificatesCollection,
      where("companyName", "==", companyName),
      where("topic", "==", topic),
      orderBy("certificateNumber", "desc"),
      limit(1)
    );
    
    try {
      const querySnapshot = await getDocs(q);

      let lastCertificateNumber = 16000; // Default starting number
      if (!querySnapshot.empty) {
        lastCertificateNumber = querySnapshot.docs[0].data().certificateNumber + 1;
      }

      // Get the current date in DDMMYYYY format
      const currentDate = new Date();
      const day = String(currentDate.getDate()).padStart(2, "0"); // Ensure 2 digits
      const month = String(currentDate.getMonth() + 1).padStart(2, "0"); // Month is 0-indexed, so add 1
      const year = currentDate.getFullYear();

      const formattedDate = `${day}${month}${year}`;

      // Save new certificate info to Firestore
      await addDoc(certificatesCollection, {
        companyName,
        certificateNumber: lastCertificateNumber,
        topic,
        createdAt: new Date(),
      });

      // Return the full certificate number concatenated as required
      return `${projectNumber}${formattedDate}${lastCertificateNumber}`;
    } catch (error) {
      setErrorMessage("Error fetching certificate number. Please try again.");
      throw new Error("Error fetching certificate number", error);
    }
  };

  const generateCertificates = async () => {
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
    setIsLoading(true); // Show loading spinner
  
    const certificates = [];
    let firstNumber = null;
    let lastNumber = null;
  
    for (const record of excelData) {
      let dateOfTraining = record["Date of Training"];
      let formattedDate = "";
  
      try {
        const dateObj = parseExcelDate(dateOfTraining);
        if (isNaN(dateObj)) throw new Error("Invalid date");
        formattedDate = formatDateToNumeric(dateObj);
      } catch (error) {
        setErrorMessage(`Invalid date format for: ${record["Name"]}`);
        setIsLoading(false); // Hide loading spinner if error occurs
        return;
      }
  
      // Generate the certificate number using the company name, topic, and project number
      const certificateNumber = await generateCertificateNumber(record["Company Name"], record["Title"], projectNumber);
  
      if (!firstNumber) {
        firstNumber = certificateNumber;
      }
      lastNumber = certificateNumber;
  
      // Prepend "TSM" to the certificate number
      const fullCertificateNumber = `TSM${certificateNumber}`;
  
      // Prepare template data with the correctly generated certificate number
      const templateData = {
        name: record.Name,
        dateOfTraining: parseExcelDate(dateOfTraining).toLocaleDateString("en-GB"),
        title: record.Title,
        certificateNumber: fullCertificateNumber, // Prepend TSM to certificate number
        companyName: record["Company Name"],
      };
  
      certificates.push({
        name: `${record.Name}_Certificate.docx`,
        data: templateData,
      });
    }
  
    setFirstCertificateNumber(firstNumber);
    setLastCertificateNumber(lastNumber);
  
    setGeneratedCertificates(certificates);
    setIsLoading(false); // Hide loading spinner after certificates are generated
  };
  
  

  const handleGenerateCertificates = () => {
    setShowWarning(true); // Show warning before generating certificates
  };

  const handleWarningAction = (action) => {
    if (action === "proceed") {
      setShowWarning(false); // Close the warning
      generateCertificates(); // Call the generateCertificates function
    } else {
      setShowWarning(false); // Close the warning
    }
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

                    {/* Warning Message Modal */}
                    {showWarning && (
                      <div className="warning-modal">
                        <div className="warning-message">
                          <h3>Important Warning</h3>
                          <p>
                            Once certificates are assigned a number, if you upload
                            the same list again, new numbers will be assigned, and
                            the old certificates numbers will be left blank.
                          </p>

                          <button onClick={() => handleWarningAction("proceed")}>Proceed</button>
                          <button onClick={() => handleWarningAction("cancel")}>Cancel</button>
                        </div>
                      </div>
                    )}

                    <button className="button" onClick={handleGenerateCertificates}>
                      Generate Certificates
                    </button>

                    {errorMessage && <div className="error-message">{errorMessage}</div>}
                  </>
                ) : (
                  <>
                    <div className="certificate-range">
                      <h4>Certificate Range:</h4>
                      <p>
                        {firstCertificateNumber} to {lastCertificateNumber}
                      </p>
                    </div>
                    <CertificateGenerator
                      template={template}
                      certificates={generatedCertificates}
                      onBack={() => setGeneratedCertificates([])}
                    />
                  </>
                )
              }
            />
            <Route path="/word-to-pdf" element={<WordToPdfConverter />} />
          </Routes>
        </div>

        {/* Loading Spinner */}
        {isLoading && <LoadingSpinner />}
      </div>
    </Router>
  );
};

export default App;
