// Generates a signed .pkpass file for a student, ready to be added to Apple Wallet.
// Requires: APPLE_SIGNER_CERT_PATH (.p12) and APPLE_WWDR_PATH (.pem) — see README.

const fs = require("fs");
const path = require("path");
const { PKPass } = require("passkit-generator");
require("dotenv").config();

async function generateApplePass(student) {
  // student = { id, name, rollNumber, department, validUntil }

  const certPath = process.env.APPLE_SIGNER_CERT_PATH;
  const wwdrPath = process.env.APPLE_WWDR_PATH;

  if (!fs.existsSync(certPath) || !fs.existsSync(wwdrPath)) {
    throw new Error(
      "Apple certificates nahi milay. README ke mutabiq signerCert.p12 aur wwdr.pem config/certs/ mein rakhein."
    );
  }

  const pass = await PKPass.from(
    {
      model: path.join(__dirname, "passModel"),
      certificates: {
        wwdr: fs.readFileSync(wwdrPath),
        signerCert: fs.readFileSync(certPath),
        signerKeyPassphrase: process.env.APPLE_CERT_PASSWORD,
      },
    },
    {
      serialNumber: `student-${student.id}`,
      passTypeIdentifier: process.env.APPLE_PASS_TYPE_ID,
      teamIdentifier: process.env.APPLE_TEAM_ID,
      organizationName: process.env.COLLEGE_NAME || "Your College",
    }
  );

  // Fill in the actual student's data
  pass.primaryFields.push({ key: "name", label: "STUDENT", value: student.name });
  pass.secondaryFields.push(
    { key: "rollNumber", label: "ROLL NO", value: student.rollNumber },
    { key: "department", label: "DEPARTMENT", value: student.department }
  );
  pass.auxiliaryFields.push({
    key: "validUntil",
    label: "VALID UNTIL",
    value: student.validUntil,
  });
  pass.setBarcodes({
    message: `STUDENT:${student.id}`,
    format: "PKBarcodeFormatQR",
    messageEncoding: "iso-8859-1",
  });

  return pass.getAsBuffer(); // Buffer containing the .pkpass file
}

module.exports = { generateApplePass };
