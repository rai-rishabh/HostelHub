
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt")
const { promisify } = require("util");
const path=require('path');

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
exports.wardenlogin = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).sendFile(path.resolve(__dirname, "../public/pages/wardenLogin.html"), {
                message: "Please provide a username and password"
            });
        }
        db.query('SELECT * FROM warden WHERE username = ?', [username], async (err, results) => {
            if (!results || results.length === 0 || !await bcrypt.compare(password, results[0].password)) {
                return res.send("<script>alert('Username or password is incorrect'); window.location.href = '/wardenLoginPage';</script>");
            } else {
                const username = results[0].username;

                const token = jwt.sign({ username }, process.env.JWT_SECRET, {
                    expiresIn: 7776000
                });

                const cookieOptions = {
                    expires: new Date(
                        Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
                    ),
                    httpOnly: true
                };

                userSave = "warden" + username; // Assign the value to the global variable
                res.cookie(userSave, token, cookieOptions);
                res.status(200).redirect("/warden/home");
            }
        });
    } catch (err) {
        console.log(err);
    }
};

//LOGGEDIN
exports.wardenisLoggedIn = async (req, res, next) => {
    if (req.cookies[userSave]) { // Access the global variable here
        try {
            const decoded = await promisify(jwt.verify)(req.cookies[userSave], process.env.JWT_SECRET);

            db.query('SELECT * FROM warden WHERE username = ?', [decoded.username], (err, results) => {
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

//PUBLISH NOTICE
const multer = require('multer');

// Configure multer for file uploads (images)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'public/uploads/notices'); // Store uploaded files in the 'uploads' directory
    },
    filename: (req, file, cb) => {
      cb(null, new Date().toISOString() + file.originalname);
    },
  });
  
exports.upload = multer({ storage });


exports.publishNotice = async (req, res, next) => {
    try {
      const { heading, body } = req.body;
      const imagePath = req.file ? req.file.path : null;
  
      const createdBy = req.user.username;

      const noticeData = {
        heading,
        body,
        picturePath: imagePath,
        created_by: createdBy, // Set the created_by field
        };
  
      const insertQuery = 'INSERT INTO notices SET ?';
  
      await new Promise((resolve, reject) => {
        db.query(insertQuery, noticeData, (err, result) => {
          if (err) {
            console.error('Error inserting notice into the database:', err);
            return reject(err);
          }
          resolve(result);
        });
      });
  
      next();
    } catch (error) {
      console.error('Error in publishNotice:', error);
      res.status(500).send('Internal Server Error');
    }
  };
  

//SHOW NOTICES
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
  exports.fetchNotices = (req, res, next) => {
    db.query('SELECT * FROM notices ORDER BY created_at DESC', (err, results) => {
        if (err) {
            console.error('Error in database query:', err);
            res.status(500).send('Internal Server Error');
            return;
        }

        // Check if there are no notices available
        if (!results || results.length === 0) {
            return res.send("<script>alert('No Notices To Show!'); window.location.href = '/warden/home';</script>");
        } else {
            req.notices = results; // Set the notices in the request object
        }
        
        next();
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
  exports.fetchLeaveApplications = async (req, res, next) => {
    try {
      if (!req.user) {
        console.log('Login Required!');
        return res.send("<script>alert('User not found!'); window.location.href = '/warden/home';</script>"); 
      }
  
      const [leaveApplications] = await db.promise().query(
        'SELECT * FROM leave_applications WHERE (status <> "approved") AND (remarks IS NOT NULL) ORDER BY appliedOn DESC'
      );

      console.log(leaveApplications);
      if (!leaveApplications || leaveApplications.length === 0) {
        // No leave applications found for the user
        res.send("<script>alert('No Applications found!'); window.location.href = '/warden/home';</script>"); 
      } else {
        req.leaveApplications = leaveApplications;
        next();
      }
    } catch (err) {
      console.error('Error in fetching leave applications:', err);
      res.status(500).send('Failed to fetch leave applications');
    }
  };
  
//DELETE NOTICES
exports.deleteNotice = (req, res, next) => {
    const noticeId = req.body.noticeId;

    // Perform a database query to delete the notice with the given ID
    db.query('DELETE FROM notices WHERE noticeId = ?', [noticeId], (err, result) => {
        if (err) {
            console.error('Error deleting notice:', err);
            res.status(500).send('Failed to delete notice');
            return;
        }

        // Continue to the next middleware or route after deletion
        next();
    });
};

//APPLICATION DECISION
exports.updateLeaveApplicationDecision = async (req, res) => {
  try {
    const { applicationId, approvalStatus, wardenRemarks } = req.body;

    // Retrieve existing remarks
    const [existingRemarksRows] = await db.promise().execute(
      'SELECT remarks FROM leave_applications WHERE id = ?',
      [applicationId]
    );

    if (existingRemarksRows.length === 1) {
      const existingRemarks = existingRemarksRows[0].remarks;

      // Concatenate remarks with the appropriate delimiter conditionally
      let updatedRemarks = '';

      if (existingRemarks && existingRemarks.trim() !== '') {
        updatedRemarks = existingRemarks;
        
        if (wardenRemarks && wardenRemarks.trim() !== '') {
          updatedRemarks += ` | ${wardenRemarks}`;
        }
      } else if (wardenRemarks && wardenRemarks.trim() !== '') {
        updatedRemarks = wardenRemarks;
      }

      // Update the leave application with the concatenated remarks
      const [updatedRows] = await db.promise().execute(
        'UPDATE leave_applications SET status = ?, remarks = ? WHERE id = ?',
        [approvalStatus, updatedRemarks, applicationId]
      );

      if (updatedRows.affectedRows === 1) {
        return res.send("<script>alert('Done'); window.location.href = '/warden/showLeaveApplications';</script>");
      } else {
        res.status(400).json({ message: 'Failed to update leave application' });
      }
    } else {
      res.status(404).json({ message: 'Leave application not found' });
    }
  } catch (err) {
    console.error('Error in updating leave application:', err);
    res.send("<script>alert('No Decision Made'); window.location.href = '/warden/showLeaveApplications';</script>");
  }
};

//STUDENT RECORDS
exports.fetchStudentRecords = async (req, res, next) => {
  try {
    const searchEnrollment = req.body.studentRecordEnrollment;

    // Fetch student details
    const [studentDetails] = await db.promise().query(
      'SELECT * FROM students WHERE enrollment = ?', [searchEnrollment]
    );

    if (!studentDetails || studentDetails.length === 0) {
      return res.send("<script>alert('Student records not found!'); window.location.href = '/warden/home';</script>");
    }

    // Fetch total leave applications for the student
    const [leaveApplications] = await db.promise().query(
      'SELECT * FROM leave_applications WHERE username = ? ORDER BY AppliedOn DESC', [searchEnrollment]
    );

    // Fetch total maintenance requests for the student
    const [maintenanceCount] = await db.promise().query(
      'SELECT COUNT(*) as totalMaintenances FROM maintenance WHERE enrollment = ?', [searchEnrollment]
    );

    const totalLeaves = leaveApplications.length || 0;
    const totalMaintenances = maintenanceCount[0].totalMaintenances || 0;

    req.studentDetails = studentDetails[0];
    req.leaveApplications = leaveApplications;
    req.totalLeaves = totalLeaves;
    req.totalMaintenances = totalMaintenances;

    next();
  } catch (err) {
    console.error('Error in fetchStudentRecords middleware:', err);
    res.status(500).send('Internal Server Error');
  }
};



//CHANGE PASSWORD
exports.wardenChangePass = async (req, res) => {
    try {
        const { currentPassword, newPassword} = req.body;
        

        // Retrieve the logged-in user's username from the JWT token
        const decoded = await promisify(jwt.verify)(req.cookies[userSave], process.env.JWT_SECRET);

        // Perform the password change in the database
        db.query('SELECT * FROM warden WHERE username = ?', [decoded.username], async (err, results) => {
            if (err) {
                console.log(err);
                return res.status(500).send("Internal Server Error");
            }

            if (results.length === 0) {
                return res.send("<script>alert('User not found!'); window.location.href = '/warden/home';</script>"); 
                
            }
            const user = results[0];
            // Check if the old password matches the stored password
            const passwordMatches = await bcrypt.compare(currentPassword, user.password);
            if (!passwordMatches) {
                return res.send("<script>alert('Incorrect Current password'); window.location.href = '/warden/home' ; </script>"); 
                
            }


            // Hash the new password
            const hashedPassword = await bcrypt.hash(newPassword, 8);
            

            // Update the password in the database
            db.query('UPDATE warden SET password = ? WHERE username = ?', [hashedPassword, decoded.username], (err, results) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send("Internal Server Error");
                }

                return res.send("<script>alert('Password changed successfully!'); window.location.href = '/warden/home';</script>"); 

                
            });
        });
    } catch (err) {
        console.log(err);
        return res.status(401).send("Unauthorized");
    }
};

//LOGOUT
exports.wardenlogout = (req, res) => {
    res.cookie(userSave, 'logout', {
        expires: new Date(Date.now() + 2 * 1000),
        httpOnly: true
    });
    res.status(200).redirect("/");
}


