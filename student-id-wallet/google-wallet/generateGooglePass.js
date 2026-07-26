// Generates a signed "Add to Google Wallet" link for a student.
// Requires: GOOGLE_SERVICE_ACCOUNT_PATH (JSON key) and GOOGLE_ISSUER_ID — see README.

const fs = require("fs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

function getServiceAccount() {
  const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_PATH;
  if (!fs.existsSync(keyPath)) {
    throw new Error(
      "Google service account JSON nahi mili. README ke mutabiq google-service-account.json config/certs/ mein rakhein."
    );
  }
  return JSON.parse(fs.readFileSync(keyPath, "utf8"));
}

// One-time setup call: defines what a "student ID" pass looks like (fields, colors).
// Run this once via /setup-google-class route before issuing passes to students.
function buildGenericClass() {
  const issuerId = process.env.GOOGLE_ISSUER_ID;
  const classId = `${issuerId}.${process.env.GOOGLE_CLASS_ID}`;
  return {
    id: classId,
    classTemplateInfo: {
      cardTemplateOverride: {
        cardRowTemplateInfos: [
          {
            twoItems: {
              startItem: {
                firstValue: { fields: [{ fieldPath: "object.textModulesData['rollNumber']" }] },
              },
              endItem: {
                firstValue: { fields: [{ fieldPath: "object.textModulesData['department']" }] },
              },
            },
          },
        ],
      },
    },
  };
}

// Builds one student's pass object + signs a JWT "Save to Google Wallet" link.
async function generateGooglePassLink(student) {
  // student = { id, name, rollNumber, department, validUntil }
  const serviceAccount = getServiceAccount();
  const issuerId = process.env.GOOGLE_ISSUER_ID;
  const classId = `${issuerId}.${process.env.GOOGLE_CLASS_ID}`;
  const objectId = `${issuerId}.student-${student.id}`;

  const genericObject = {
    id: objectId,
    classId,
    logo: {
      sourceUri: { uri: "https://example.com/college-logo.png" }, // replace with real hosted logo
    },
    cardTitle: { defaultValue: { language: "en", value: process.env.COLLEGE_NAME || "Your College" } },
    header: { defaultValue: { language: "en", value: student.name } },
    textModulesData: [
      { id: "rollNumber", header: "ROLL NO", body: student.rollNumber },
      { id: "department", header: "DEPARTMENT", body: student.department },
      { id: "validUntil", header: "VALID UNTIL", body: student.validUntil },
    ],
    barcode: { type: "QR_CODE", value: `STUDENT:${student.id}` },
    hexBackgroundColor: "#1F2A24",
  };

  const claims = {
    iss: serviceAccount.client_email,
    aud: "google",
    origins: [],
    typ: "savetowallet",
    payload: { genericObjects: [genericObject] },
  };

  // Sign with the service account's private key (RS256) — this proves to
  // Google that the request really comes from your registered issuer account.
  const token = jwt.sign(claims, serviceAccount.private_key, { algorithm: "RS256" });

  return `https://pay.google.com/gp/v/save/${token}`;
}

module.exports = { generateGooglePassLink, buildGenericClass };
