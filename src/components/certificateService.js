import { collection, addDoc, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase";

const generateCertificateNumber = async (companyName) => {
  const projectPrefix = "TSM123"; // Fixed project prefix
  const certificatesCollection = collection(db, "certificates");

  // Fetch the latest certificate number for any company
  const q = query(certificatesCollection, orderBy("certificateNumber", "desc"), limit(1));
  const querySnapshot = await getDocs(q);

  let lastCertificateNumber = 16000; // Default starting number
  if (!querySnapshot.empty) {
    lastCertificateNumber = querySnapshot.docs[0].data().certificateNumber + 1;
  }

  // Save new certificate info to Firestore
  await addDoc(certificatesCollection, {
    companyName,
    certificateNumber: lastCertificateNumber,
    createdAt: new Date(),
  });

  // Return the full certificate number
  return `${projectPrefix}${lastCertificateNumber}`;
};

export default generateCertificateNumber;