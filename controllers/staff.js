
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
exports.stafflogin = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).sendFile(path.resolve(__dirname, "../public/pages/staffLogin.html"), {
                message: "Please provide a username and password"
            });
        }
        db.query('SELECT * FROM staff WHERE username = ?', [username], async (err, results) => {
            if (!results || results.length === 0 || !await bcrypt.compare(password, results[0].password)) {
                return res.send("<script>alert('Username or password is incorrect'); window.location.href = '/staffLoginPage';</script>");
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

                userSave = "staff" + username; // Assign the value to the global variable
                res.cookie(userSave, token, cookieOptions);
                res.status(200).redirect("/staff");
            }
        });
    } catch (err) {
        console.log(err);
    }
};

//LOGGEDIN
exports.staffisLoggedIn = async (req, res, next) => {
    if (req.cookies[userSave]) { // Access the global variable here
        try {
            const decoded = await promisify(jwt.verify)(req.cookies[userSave], process.env.JWT_SECRET);

            db.query('SELECT * FROM staff WHERE username = ?', [decoded.username], (err, results) => {
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
        return res.send("<script>alert('User not found!'); window.location.href = '/staff/home';</script>"); 
      }
      console.log("inside staff");
      const [leaveApplications] = await db.promise().query(
        'SELECT * FROM leave_applications WHERE ((status = "pending" OR status = "rejected") AND (remarks IS NOT NULL) ) ORDER BY appliedOn DESC'
      );

      console.log(leaveApplications);
  
      if (!leaveApplications || leaveApplications.length === 0) {
        // No leave applications found for the user
        res.send("<script>alert('No Applications found!'); window.location.href = '/staff/home';</script>"); 
      } else {
        req.leaveApplications = leaveApplications;
        next();
      }
    } catch (err) {
      console.error('Error in fetching leave applications:', err);
      res.status(500).send('Failed to fetch leave applications');
    }
  };

//LEAVE REMARKS
exports.updateRemarks = async (req, res, next) => {
    try {
      const { applicationId, presenceStatus } = req.body;

  
      const [leaveApplication] = await db.promise().query(
        'SELECT * FROM leave_applications WHERE id = ?',
        [applicationId]
      );
  
      if (!leaveApplication || leaveApplication.length === 0) {
        return res.status(404).send('Leave application not found or invalid status');
      }
  
      let remarksToUpdate = '';
      if (presenceStatus === 'present') {
        remarksToUpdate = 'Student is physically present';
      } else if (presenceStatus === 'absent') {
        remarksToUpdate = 'Student is not present';
      }
  
      // Update remarks based on the selected radio button value
      await db.promise().query(
        'UPDATE leave_applications SET remarks = ? WHERE id = ?',
        [remarksToUpdate, applicationId]
      );

  
      // Set the updated remarks in the request object for further processing if needed
      req.updatedRemarks = remarksToUpdate;
  
      next(); // Move to the next middleware or route handler
    } catch (err) {
      console.error('Error updating remarks:', err);
      res.status(500).send('Failed to update remarks');
    }
  };

//MAINTENACE REQUESTS
exports.showMaintenanceRequests = async (req, res, next) => {
  try {
    if (!req.user) {
      console.log('Login Required!');
      return res.send("<script>alert('User not found!'); window.location.href = '/staff/home';</script>");
    }

    // Fetch all maintenance requests from the database where complete IS NULL
    const [maintenance] = await db.promise().query('SELECT * FROM maintenance WHERE complete IS NULL ORDER BY id');

    if (!maintenance || maintenance.length === 0) {
      // No maintenance requests found
      return res.send("<script>alert('No Maintenance Requests found!'); window.location.href = '/staff/home';</script>");
    }

    // Attach maintenance data to the request object for later use
    req.maintenance = maintenance;

    // Continue to the next middleware or route handler
    next();
  } catch (error) {
    console.error('Error in showMaintenanceRequestsMiddleware:', error);
    res.status(500).send('Internal Server Error');
  }
};

//MAINTENANCE UPDATE
exports.markCompleted = async (req, res, next) => {
  try {
    if (!req.user) {
      console.log('Login Required!');
      return res.send("<script>alert('User not found!'); window.location.href = '/staff/home';</script>");
    }

    const requestId = req.body.requestId;

    // Update the maintenance request in the database to mark it as completed
    const [updateResult] = await db.promise().query('UPDATE maintenance SET complete = "Completed" WHERE id = ?', [requestId]);

    if (updateResult.affectedRows === 0) {
      // No rows were updated, indicating an issue with the request ID
      return res.status(404).send('Maintenance request not found.');
    }

    return next(); // Continue to the next middleware or route handler
  } catch (error) {
    console.error('Error in markCompletedMiddleware:', error);
    res.status(500).send('Internal Server Error');
  }
};


//MARK ATTENDANCE
//show mark attendance
exports.showMarkAttendance = async (req, res, next) => {
  try {
    if (!req.user) {
      console.log('Login Required!');
      return res.send("<script>alert('User not found!'); window.location.href = '/staff/home';</script>");
    }

    const currentDate = new Date().toLocaleDateString('en-GB'); // Get current date in DD-MM-YY format

    const oneDay = 24 * 60 * 60 * 1000; // One day in milliseconds
    const yesterday = new Date(Date.now() - oneDay).toLocaleDateString('en-GB');
    const dayBeforeYesterday = new Date(Date.now() - 2 * oneDay).toLocaleDateString('en-GB');

    const [results] = await db.promise().query('SELECT * FROM attendance ORDER BY room ASC');
    console.log(results);

    if (results.length === 0) {
      // Handle case where no records are found
      return res.status(404).send('No records found.');
    }

    // Attach data to request for later use in the route
    req.attendanceData = {
      username: req.user.username,
      showMarkAttendance: true,
      records: results,
      today: currentDate,
      yesterday,
      dayBeforeYesterday,
    };

    next(); // Move to the next middleware or route handler
  } catch (error) {
    console.error('Error fetching records:', error);
    res.status(500).send('Internal Server Error');
  }
};


//mark Attendance
exports.markAttendance = async (req, res) => {
  try {
    const currentDate = new Date().toLocaleDateString('en-GB'); // Get current date in DD-MM-YY format
    const attendanceData = req.body;

    console.log(attendanceData);

    // Step 1: Alter table to add column with current date heading and set 'A' as the default value
    const alterQuery = `ALTER TABLE attendance ADD COLUMN \`${currentDate}\` VARCHAR(255) DEFAULT 'A'`;

    db.query(alterQuery, (alterError) => {
      if (alterError) {
        console.error('Error altering table:', alterError);
        return res.send("<script>alert('Attendance Already Marked!'); window.location.href = '/staff';</script>");
      }

      // Step 2: Insert attendance values into the new column
      const insertQueries = [];
      
      for (const enrollmentId in attendanceData.attendance) {
        const isChecked = attendanceData.attendance[enrollmentId] === 'P' ? 'P' : 'A';
        const insertQuery = `UPDATE attendance SET \`${currentDate}\` = '${isChecked}' WHERE enrollment = '${enrollmentId}'`;
        insertQueries.push(insertQuery);
      }
      
      


      console.log(insertQueries);
// Execute all insert queries
insertQueries.forEach((query) => {
  db.query(query, (insertError) => {
    if (insertError) {
      console.error('Error inserting attendance:', insertError);
    }
  });
});

res.send("<script>alert('Attendance Marked!'); window.location.href = '/staff';</script>");
});
} catch (err) {
console.log(err);
return res.status(401).send('Unauthorized');
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
        return res.send("<script>alert('Student records not found!'); window.location.href = '/staff/home';</script>");
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
exports.staffChangePass = async (req, res) => {
    try {
        const { currentPassword, newPassword} = req.body;
        

        // Retrieve the logged-in user's username from the JWT token
        const decoded = await promisify(jwt.verify)(req.cookies[userSave], process.env.JWT_SECRET);

        // Perform the password change in the database
        db.query('SELECT * FROM staff WHERE username = ?', [decoded.username], async (err, results) => {
            if (err) {
                console.log(err);
                return res.status(500).send("Internal Server Error");
            }

            if (results.length === 0) {
                return res.send("<script>alert('User not found!'); window.location.href = '/staff/home';</script>"); 
                
            }
            const user = results[0];
            // Check if the old password matches the stored password
            const passwordMatches = await bcrypt.compare(currentPassword, user.password);
            if (!passwordMatches) {
                return res.send("<script>alert('Incorrect Current password'); window.location.href = '/staff/home' ; </script>"); 
                
            }


            // Hash the new password
            const hashedPassword = await bcrypt.hash(newPassword, 8);
            

            // Update the password in the database
            db.query('UPDATE staff SET password = ? WHERE username = ?', [hashedPassword, decoded.username], (err, results) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send("Internal Server Error");
                }

                return res.send("<script>alert('Password changed successfully!'); window.location.href = '/staff/home';</script>"); 

                
            });
        });
    } catch (err) {
        console.log(err);
        return res.status(401).send("Unauthorized");
    }
};

//LOGOUT
exports.stafflogout = (req, res) => {
    res.cookie(userSave, 'logout', {
        expires: new Date(Date.now() + 2 * 1000),
        httpOnly: true
    });
    res.status(200).redirect("/");
}


