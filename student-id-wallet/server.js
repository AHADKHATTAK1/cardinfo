const express = require("express");
const path = require("path");
require("dotenv").config();

const { generateApplePass } = require("./apple-wallet/generateApplePass");
const { generateGooglePassLink } = require("./google-wallet/generateGooglePass");
const demoStudents = require("./config/demoStudents");

const app = express();
app.use(express.static(path.join(__dirname, "public")));

// Preview page: shows both "Add to Wallet" buttons for one student
app.get("/preview/:studentId", (req, res) => {
  const student = demoStudents[req.params.studentId];
  if (!student) return res.status(404).send("Student nahi mila.");
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Returns student data as JSON, used by the frontend page
app.get("/api/student/:studentId", (req, res) => {
  const student = demoStudents[req.params.studentId];
  if (!student) return res.status(404).json({ error: "Student nahi mila." });
  res.json(student);
});

// Downloads the signed .pkpass file
app.get("/wallet/apple/:studentId", async (req, res) => {
  const student = demoStudents[req.params.studentId];
  if (!student) return res.status(404).send("Student nahi mila.");
  try {
    const buffer = await generateApplePass(student);
    res.set({
      "Content-Type": "application/vnd.apple.pkpass",
      "Content-Disposition": `attachment; filename=student-${student.id}.pkpass`,
    });
    res.send(buffer);
  } catch (err) {
    res.status(500).send("Apple pass generate nahi hui: " + err.message);
  }
});

// Redirects to the signed Google Wallet save link
app.get("/wallet/google/:studentId", async (req, res) => {
  const student = demoStudents[req.params.studentId];
  if (!student) return res.status(404).send("Student nahi mila.");
  try {
    const link = await generateGooglePassLink(student);
    res.redirect(link);
  } catch (err) {
    res.status(500).send("Google pass generate nahi hui: " + err.message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Student ID Wallet server chal raha hai: http://localhost:${PORT}`);
  console.log(`Demo dekhne ke liye: http://localhost:${PORT}/preview/12345`);
});
