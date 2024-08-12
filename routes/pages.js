const express = require("express");
const router = express.Router();

const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // Use `true` for port 465, `false` for all other ports
  auth: {
    user: 'Rohans17we@gmail.com', // Your email address
    pass: 'lqoo cuuf iiwr vfbv' // Your password
  },
  connectionTimeout: 300000,
  greetingTimeout: 300000,
  socketTimeout: 300000,
});

router.post('/contactForm', async (req, res) => {
    try {
      // Extract form data
      const { firstName, lastName, email, message } = req.body;
  
      // Compose email message
      const mailOptions = {
        from: 'Rohans17we@gmail.com', // Sender address
        to: 'Rohans17we@gmail.com', // List of recipients
        subject: 'New Contact Form Submission',
        text: `You have received a new contact form submission:\n\nFirst Name: ${firstName}\nLast Name: ${lastName}\nEmail: ${email}\nMessage: ${message}`,
      };
  
      // Send email
      await transporter.sendMail(mailOptions);
  
      // Respond to client
      res.send("<script>alert('Email sent successfully!'); window.location.href = '/contact';</script>"); 
    } catch (error) {
      console.error('Error sending email:', error);
      res.status(500).send('Error sending email');
    }
  });


// Define the route for the home page
router.get('/', (req, res) => {
    res.sendFile("home.html", { root: './public/pages/' });
});
router.get('/home', (req, res) => {
    res.sendFile("home.html", { root: './public/pages/' });
});

// Define the route for the about page
router.get('/about', (req, res) => {
    res.sendFile("about.html", { root: './public/pages/' });
});

// Define the route for the contact page
router.get('/contact', (req, res) => {
    res.sendFile("contact.html", { root: './public/pages/' });
});

//LOGIN PAGES
//Admin Login Page
router.get('/adminLoginPage', (req, res) => {
    res.sendFile("adminLogin.html", { root: './public/pages/' });
});
//Student Login Page
router.get('/studentLoginPage', (req, res) => {
    res.sendFile("studentLogin.html", { root: './public/pages/' });
});
//Staff Login Page
router.get('/staffLoginPage', (req, res) => {
    res.sendFile("StaffLogin.html", { root: './public/pages/' });
});
//Warden Login Page
router.get('/wardenLoginPage', (req, res) => {
    res.sendFile("wardenLogin.html", { root: './public/pages/' });
});



module.exports = router;
