const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 8000;

// Middleware
app.use(cors());
app.use(express.json()); // This allows the server to read the JSON your frontend sends

// Mock Database (This resets when you restart the server)
let userProfile = {
  id: 1,
  name: "New Student",
  email: "student@example.com",
  phone: "555-555-5555", 
  major: "Systems and Software",
  degree: "B.S. Computer Science",
  profile_image_url: null
};

// 1. GET route to load the profile when the page opens
app.get('/api/profile', (req, res) => {
  console.log("Frontend is fetching the profile...");
  res.json(userProfile);
});

// 2. PATCH route to save changes from the "Edit Profile" modal
app.patch('/api/profile', (req, res) => {
  const { name, email } = req.body;
  
  console.log(`Updating profile to: ${name} (${email})`);
  
  // Update our local variable
  userProfile.name = name || userProfile.name;
  userProfile.email = email || userProfile.email;

  // Send back the updated profile so the frontend can refresh its state
  res.json(userProfile);
});

app.listen(PORT, () => {
  console.log(`✅ Backend is live! Listening on http://localhost:${PORT}`);
  console.log(`The frontend proxy is now connected.`);
});