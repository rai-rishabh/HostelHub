const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt")
const { promisify } = require("util");
const path = require('path');

const nodemailer = require('nodemailer');

const mysql = require("mysql2");

const db = mysql.createConnection({
    host: process.env.HOST,
    user: process.env.DATABASE_USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE
});
db.connect((err) => {
    if (err) {
        console.log(err);
    }
});

let userSave; // Declare the variable outside the functions

//LOGIN
exports.studentlogin = async(req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).sendFile(path.resolve(__dirname, "../public/pages/studentLogin.html"), {
                message: "Please provide a username and password"
            });
        }
        db.query('SELECT * FROM students WHERE enrollment = ?', [username], async(err, results) => {
            if (!results || results.length === 0 || !await bcrypt.compare(password, results[0].password)) {
                return res.send("<script>alert('Username or password is incorrect'); window.location.href = '/studentLoginPage';</script>");
            } else {
                const username = results[0].enrollment;


                const token = jwt.sign({ username }, process.env.JWT_SECRET, {
                    expiresIn: 7776000
                });

                const cookieOptions = {
                    expires: new Date(
                        Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
                    ),
                    httpOnly: true
                };

                userSave = "student" + username; // Assign the value to the global variable
                res.cookie(userSave, token, cookieOptions);
                res.status(200).redirect("/student/home");
            }
        });
    } catch (err) {
        console.log(err);
    }
};

//LOGGEDIN
exports.studentisLoggedIn = async(req, res, next) => {
    if (req.cookies[userSave]) { // Access the global variable here
        try {
            const decoded = await promisify(jwt.verify)(req.cookies[userSave], process.env.JWT_SECRET);

            db.query('SELECT * FROM students WHERE enrollment = ?', [decoded.username], (err, results) => {
                if (!results || results.length === 0) {
                    return next();
                }
                req.user = results[0];
                return next();
            });
        } catch (err) {
            console.log(err);
            return next();
        }
    } else {
        next();
    }
};

//LEAVE APPLICATION
const multer = require('multer');
// Configure multer for file uploads (images)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/StudentLeave'); // Store uploaded files in the 'uploads' directory
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString() + file.originalname);
    },
});
exports.upload = multer({ storage });
exports.processLeave = async(req, res) => {
    try {
        const userToken = req.cookies[userSave];

        if (!userToken) {
            console.log("Unauthorized access");
            return res.status(401).send("Unauthorized access");
        }

        const { from_date, to_date, zipcode, city, state, address, reason, no_of_days } = req.body;

        const imagePath = req.file ? req.file.path : null;

        let decoded;
        try {
            decoded = jwt.verify(userToken, process.env.JWT_SECRET);
        } catch (jwtError) {
            console.error("JWT Decoding Error:", jwtError);
            return res.status(401).send("Invalid token");
        }

        const username = decoded.username;


        db.query('SELECT room, name FROM students WHERE enrollment = ?', [username], (err, userData) => {
            if (err) {
                console.error("Database Error:", err);
                return res.status(500).send("Database error");
            }


            if (!userData || userData.length === 0) {
                console.log("User not found");
                return res.status(401).send("<script>alert('User not found!'); window.location.href = '/student/home';</script>");
            }

            const { room, name } = userData[0];

            const insertQuery = `
          INSERT INTO leave_applications
          (username, name, room_no, from_date, to_date, no_of_days, zipcode, city, state, address, reason, image, AppliedOn, status, remarks)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;


            const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');

            const insertValues = [
                username,
                name,
                room,
                from_date,
                to_date,
                no_of_days,
                zipcode,
                city,
                state,
                address,
                reason,
                imagePath,
                currentDate,
                'pending', // Default status to 'pending'
                '', // Empty remarks initially
            ];

            db.query(insertQuery, insertValues, (insertErr) => {
                if (insertErr) {
                    console.error("Insert Error:", insertErr);
                    return res.status(500).send("<script>alert('Failed to process leave application'); window.location.href = '/student/home';</script>");
                }

                console.log("Leave applied successfully");
                return res.status(200).send("<script>alert('Leave applied successfully!'); window.location.href = '/student/home';</script>");
            });
        });
    } catch (err) {
        console.error(err);
        console.log("Failed to process leave application");
        return res.status(500).send("<script>alert('Failed to process leave application'); window.location.href = '/student/home';</script>");
    }
};

//MAINTENANCE REQUEST
exports.requestmaintenance = async(req, res, next) => {
    try {
        if (!req.cookies[userSave]) {
            return next();
        }

        const currentDate = new Date().toLocaleDateString('en-GB');
        const decoded = await promisify(jwt.verify)(req.cookies[userSave], process.env.JWT_SECRET);
        const { mreq } = req.body;

        const results = await getRoomByEnrollment(decoded.username);
        if (!results || results.length === 0) {
            console.error('No room found for the given enrollment');
            return res.status(500).send('Error in retrieving room details');
        }

        const room = results[0].room;
        await insertMaintenance(decoded.username, room, mreq);
        return res.send("<script>alert('Maintenance Requested!'); window.location.href = '/student';</script>");
    } catch (err) {
        console.error(err);
        return res.status(500).send('Internal Server Error');
    }
};
// Function to retrieve room details based on enrollment
const getRoomByEnrollment = (enrollment) => {
    return new Promise((resolve, reject) => {
        db.query('SELECT room FROM students WHERE enrollment = ?', [enrollment], (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
};
// Function to insert data into maintenance table
const insertMaintenance = (enrollment, room, requestFor) => {
    return new Promise((resolve, reject) => {
        db.query('INSERT INTO maintenance SET ?', {
            enrollment: enrollment,
            room: room,
            request_for: requestFor
        }, (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
};

//LEAVE STATUS
// Define formatDate and trimPublicFromPath functions
exports.formatDate = function(date) {
    const formattedDate = new Date(date).toDateString();
    return formattedDate;
};
exports.trimPublicFromPath = function(filePath) {
    // Define the directory to remove
    const directoryToRemove = 'public';
    // Use the string.replace method to remove the directory
    const trimmedPath = filePath.replace(directoryToRemove, '');
    // Remove any leading slash to ensure the path is valid
    return trimmedPath.startsWith('/') ? trimmedPath.slice(1) : trimmedPath;
};

// Middleware function to fetch leave applications for a specific user
exports.fetchLeaveApplications = async(req, res, next) => {
    try {
        if (!req.user) {
            console.log('Login Required!');
            return res.send("<script>alert('User not found!'); window.location.href = '/student/home';</script>");
        }

        const username = req.user.enrollment;

        const [leaveApplications] = await db.promise().query(
            'SELECT * FROM leave_applications WHERE username = ? ORDER BY appliedOn DESC', [username]
        );


        if (!leaveApplications || leaveApplications.length === 0) {
            // No leave applications found for the user
            res.send("<script>alert('No Applications found!'); window.location.href = '/student/home';</script>");

        } else {
            req.leaveApplications = leaveApplications;
            next();
        }
    } catch (err) {
        console.error('Error in fetching leave applications:', err);
        res.status(500).send('Failed to fetch leave applications');
    }
};


//CHANGE PASSWORD
exports.studentChangePass = async(req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;


        // Retrieve the logged-in user's username from the JWT token
        const decoded = await promisify(jwt.verify)(req.cookies[userSave], process.env.JWT_SECRET);

        // Perform the password change in the database
        db.query('SELECT * FROM students WHERE enrollment = ?', [decoded.username], async(err, results) => {
            if (err) {
                console.log(err);
                return res.status(500).send("Internal Server Error");
            }

            if (results.length === 0) {
                return res.send("<script>alert('User not found!'); window.location.href = '/student/home';</script>");

            }
            const user = results[0];
            // Check if the old password matches the stored password
            const passwordMatches = await bcrypt.compare(currentPassword, user.password);
            if (!passwordMatches) {
                return res.send("<script>alert('Incorrect Current password'); window.location.href = '/student/home' ; </script>");

            }


            // Hash the new password
            const hashedPassword = await bcrypt.hash(newPassword, 8);


            // Update the password in the database
            db.query('UPDATE students SET password = ? WHERE enrollment = ?', [hashedPassword, decoded.username], (err, results) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send("Internal Server Error");
                }

                return res.send("<script>alert('Password changed successfully!'); window.location.href = '/student/home';</script>");


            });
        });
    } catch (err) {
        console.log(err);
        return res.status(401).send("Unauthorized");
    }
};


// const puppeteer = require('puppeteer');


// Define a function to format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
}


exports.downloadLeaveApplicationPDF = async(req, res, next) => {
    try {
        // Get the application ID from the query parameters
        const applicationId = req.query.id;

        // Fetch leave application details from the database
        const [leaveApplications] = await db.promise().query(
            'SELECT * FROM leave_applications WHERE id = ?', [applicationId]
        );

        // Check if leave application exists
        if (leaveApplications.length === 0) {
            return res.status(404).send('Leave application not found');
        }

        // Extract leave application details
        const leaveApplication = leaveApplications[0];

        // Generate email address from username
        const emailAddress = `${leaveApplication.username}@juetguna.in`;

        // Generate HTML content for the PDF
        const htmlContent = `
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f2f2f2;
          margin: 0;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #fff;
        }
        h1 {
          text-align: center;
          color: #333;
          margin-bottom: 20px;
        }
        .details {
          margin-bottom: 20px;
        }
        .details p {
          margin: 8px 0;
          font-weight: bold;
          color: #555; /* Change label color to distinguish from data */
        }
        .data {
          color: #333; /* Change data color for better readability */
        }
        .status {
          text-align: center;
          text-transform: uppercase;
          color: #50C878; /* Change status color to a more noticeable one */
          font-size: 18px; /* Increase font size */
          margin-top: 30px; /* Add more space above status */
          border-top: 2px solid #ccc; /* Add a border above status */
          padding-top: 20px; /* Add padding above status */
        }
        .remarks {
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Leave OutPass</h1>
        <div class="details">
          <p><span class="data">Enrollment:</span> ${leaveApplication.username}</p>
          <p><span class="data">Name:</span> ${leaveApplication.name}</p>
          <p><span class="data">Room Number:</span> ${leaveApplication.room_no}</p>
          <p><span class="data">From Date:</span> ${formatDate(leaveApplication.from_date)}</p>
          <p><span class="data">To Date:</span> ${formatDate(leaveApplication.to_date)}</p>
          <p><span class="data">Number of Days:</span> ${leaveApplication.no_of_days}</p>
          <p><span class="data">Address on Leave:</span> ${leaveApplication.address}, ${leaveApplication.city}, ${leaveApplication.state}, ${leaveApplication.zipcode}</p>
          <p><span class="data">Reason for Leave:</span> ${leaveApplication.reason}</p>
        </div>
        <div class="status">
          <span class="data">Status:</span> ${leaveApplication.status}
        </div>
      </div>
    </body>
    </html>
    
    `;

        // Launch a headless Chrome browser
        // const browser = await puppeteer.launch();
        const page = await browser.newPage();

        // Set the HTML content and generate PDF
        await page.setContent(htmlContent);
        const pdfBuffer = await page.pdf();

        // Close the browser
        await browser.close();

        // Set response headers to trigger download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="leave_application.pdf"');

        // Send the PDF buffer as the response
        res.send(pdfBuffer);

        // Send the PDF via email
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

        const mailOptions = {
            from: 'Rohans17we@gmail.com', // Sender address
            to: emailAddress, // Use the generated email address
            subject: 'Leave Application',
            text: 'Please find attached the leave application PDF.',
            attachments: [{
                filename: 'leave_application.pdf',
                content: pdfBuffer
            }]
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
            } else {
                console.log('Email sent:', info.response);
                res.send("<script>alert('Leave Outpass also sent to your email!'); window.location.href = '/student/showLeaveStatus';</script>");
            }
        });

    } catch (error) {
        console.error('Error downloading PDF:', error);
        res.status(500).send('Error downloading PDF');
    }
};


//LOGOUT
exports.studentlogout = (req, res) => {
    res.cookie(userSave, 'logout', {
        expires: new Date(Date.now() + 2 * 1000),
        httpOnly: true
    });
    res.status(200).redirect("/");
}