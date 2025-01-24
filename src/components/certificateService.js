import { collection, addDoc, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase";

const generateCertificateNumber = async (companyName, projectNumber) => {
  const certificatesCollection = collection(db, "certificates");

  // Fetch the latest certificate number for any company
  const q = query(certificatesCollection, orderBy("certificateNumber", "desc"), limit(1));
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
    createdAt: new Date(),
  });

  // Return the full certificate number concatenated as required
  return `${projectNumber}${formattedDate}${lastCertificateNumber}`;
};

export default generateCertificateNumber;
