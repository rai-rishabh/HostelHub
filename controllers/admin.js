
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



let userSave; // Declare the variable outside the functions

//LOGIN
exports.adminlogin = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).sendFile(path.resolve(__dirname, "../public/pages/adminLogin.html"), {
                message: "Please provide a username and password"
            });
        }
        db.query('SELECT * FROM adminlog WHERE username = ?', [username], async (err, results) => {
            if (!results || results.length === 0 || !await bcrypt.compare(password, results[0].password)) {
                return res.send("<script>alert('Username or password is incorrect'); window.location.href = '/adminLoginPage';</script>");
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

                userSave = "admin" + username; // Assign the value to the global variable
                res.cookie(userSave, token, cookieOptions);
                res.status(200).redirect("/admin/home");
            }
        });
    } catch (err) {
        console.log(err);
    }
};

//LOGGEDIN
exports.adminisLoggedIn = async (req, res, next) => {
    if (req.cookies[userSave]) { // Access the global variable here
        try {
            const decoded = await promisify(jwt.verify)(req.cookies[userSave], process.env.JWT_SECRET);

            db.query('SELECT * FROM adminlog WHERE username = ?', [decoded.username], (err, results) => {
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
  
  
  

  
//ADD STUDENTS
exports.addStudents = async (req, res) => {

    try {
        
        const { enrollment, name, phone, parentphone, room, bed, zipcode, city, state, address } = req.body;
        // Check if the student with the given enrollment number already exists
        const enrollmentExists = await checkEnrollmentExistence(enrollment);
        if (enrollmentExists) {
            return res.send("<script>alert('Student with this enrollment number already exists'); window.location.href = '/admin';</script>");
        }

        // Use the parent phone as the password and store the hashed password
        const password = parentphone;
        const hashedPassword = await bcrypt.hash(password, 8);

        // Insert the new student into the "students" table
        await insertStudent(enrollment, name, phone, parentphone, room, bed, zipcode, city, state, address, hashedPassword);

        // Insert enrollment and name into the "attendance" table
        await insertAttendance(enrollment, name, room);

        // Student added successfully
        res.send("<script>alert('Student Registered Successfully!'); window.location.href = '/admin';</script>");
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};

// Function to check if the student with the given enrollment number already exists
const checkEnrollmentExistence = async (enrollment) => {
    return new Promise((resolve, reject) => {
        db.query('SELECT enrollment FROM students WHERE enrollment = ?', [enrollment], (err, results) => {
            if (err) {
                console.error(err);
                reject(err);
            }
            resolve(results.length > 0);
        });
    });
};

// Function to insert a new student into the "students" table
const insertStudent = async (enrollment, name, phone, parentphone, room, bed, zipcode, city, state, address, password) => {
    return new Promise((resolve, reject) => {
        db.query('INSERT INTO students SET ?', {
            enrollment,
            name,
            phone,
            parentphone,
            room,
            bed,
            zipcode,
            city,
            state,
            address,
            password,
        }, (err, insertResults) => {
            if (err) {
                console.error(err);
                reject(err);
            }
            resolve();
        });
    });
};

// Function to insert enrollment and name into the "attendance" table
const insertAttendance = async (enrollment, name, room) => {
    return new Promise((resolve, reject) => {
        db.query('INSERT INTO attendance SET ?', {
            enrollment,
            name,
            room,
        }, (err, insertResults) => {
            if (err) {
                console.error(err);
                reject(err);
            }
            resolve();
        });
    });
};



//ADD ADMIN
exports.addAdmin = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check if the username already exists
        const usernameCheck = await promisify(db.query).bind(db)(
            'SELECT * FROM adminlog WHERE username = ?',
            [username]
        );

        if (usernameCheck.length > 0) {
            return res.send("<script>alert('Username already exists. Please choose a different one.'); window.location.href = '/admin/home';</script>");
        }

        const hashedPassword = await bcrypt.hash(password, 8);

        const insertQuery = 'INSERT INTO adminlog SET ?';
        const userData = { username, password: hashedPassword };

        // Use a promise-based version of the database query
        const insertAdmin = promisify(db.query).bind(db);
        const results = await insertAdmin(insertQuery, userData);

        // Check if the query was successful
        if (results.affectedRows === 1) {
            return res.send("<script>alert('Admin Added Successfully!'); window.location.href = '/admin/home';</script>");
        } else {
            // Handle any other possible errors
            throw new Error('Admin addition failed.');
        }
    } catch (err) {
        console.error(err);
        return res.status(500).send("Internal Server Error");
    }
};

//UPDATE STUDENT DETAILS
//search
exports.searchStudentDetails = async (req, res, next) => {
  const { enrollment } = req.body; // Assuming enrollment is sent in the request body

  try {
    // Use async/await and Promises with db.promise().query()
    const [results] = await db.promise().query('SELECT * FROM students WHERE enrollment = ?', [enrollment]);

    if (results.length === 0) {
      // No student found with the provided enrollment number
      return res.send("<script>alert('Student Not Found!'); window.location.href = '/admin/showUpdateStudent';</script>");
    }

    // Student details found, store them in the response locals
    res.locals.studentDetails = results[0]; // Assuming the query returns only one row

    // Continue to the next middleware or route
    next();
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal Server Error");
  }
};
//update
exports.updateStudentDetails = async (req, res) => {
    const { enrollment, name, phone, parentphone, room, bed, zipcode, city, state, address } = req.body;

    try {
        // Check room occupancy
        const roomOccupancyCheck = await checkRoomOccupancy(room, enrollment);
        if (roomOccupancyCheck >= 3) {
            return res.send("<script>alert('Room is already occupied by 3 students'); window.location.href = '/admin/home';</script>");
        }

        // Update student details
        await updateStudent('students', enrollment, name, phone, parentphone, room, bed, zipcode, city, state, address);
        // Update attendance details
        await updateAttendance('attendance', enrollment, name, room);

        res.send("<script>alert('Student details updated successfully!'); window.location.href = '/admin/home';</script>");
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
};

async function checkRoomOccupancy(room, enrollmentToExclude) {
    return new Promise((resolve, reject) => {
        db.query(
            'SELECT COUNT(*) AS roomOccupancy FROM students WHERE room = ? AND enrollment != ?',
            [room, enrollmentToExclude],
            (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(results[0].roomOccupancy);
                }
            }
        );
    });
}
async function updateStudent(table, enrollment, name, phone, parentphone, room, bed, zipcode, city, state, address) {
    return new Promise((resolve, reject) => {
        db.query(
            `UPDATE ${table} SET name = ?, phone = ?, parentphone = ?, bed=?, room = ?, zipcode = ?, city = ?, state = ?, address = ? WHERE enrollment = ?`,
            [name, phone, parentphone, bed, room, zipcode, city, state, address, enrollment],
            (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(results);
                }
            }
        );
    });
}
async function updateAttendance(table, enrollment, name, room) {
    return new Promise((resolve, reject) => {
        db.query(
            `UPDATE ${table} SET name = ? ,room = ? WHERE enrollment = ?`,
            [name, room, enrollment],
            (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(results);
                }
            }
        );
    });
}





//REGISTER STAFF
exports.registerStaff = async (req, res) => {
    try {
        const { username, name, phone } = req.body;
        const password = username + '@' + phone;

        // Check if the username already exists
        const usernameCheck = await promisify(db.query).bind(db)(
            'SELECT * FROM staff WHERE username = ?',
            [username]
        );

        if (usernameCheck.length > 0) {
            return res.send("<script>alert('Username already exists. Please choose a different one.'); window.location.href = '/admin/home';</script>");
        }

        const hashedPassword = await bcrypt.hash(password, 8);

        // Use a promise-based version of the database query
        const insertStaff = promisify(db.query).bind(db);
        const results = await insertStaff('INSERT INTO staff SET ?', {
            username: username,
            name: name,
            phone: phone,
            password: hashedPassword,
        });

        // Check if the query was successful
        if (results.affectedRows === 1) {
            return res.send("<script>alert('Staff Registered Successfully!'); window.location.href = '/admin/home';</script>");
        } else {
            // Handle any other possible errors
            throw new Error('Staff registration failed.');
        }
    } catch (err) {
        console.error(err);
        return res.status(500).send("Internal Server Error");
    }
};

//REMOVE STAFF
exports.removeStaff = async (req, res) => {
    const { username } = req.body;

    try {
        // Check if the staff member with the given username exists
        db.query('SELECT * FROM staff WHERE username = ?', [username], (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).send("Internal Server Error");
            }

            if (results.length === 0) {
                // Staff member not found
                return res.send("<script>alert('Staff member not found'); window.location.href = '/admin/home';</script>");
            }

            // If the staff member exists, delete them from the table
            db.query('DELETE FROM staff WHERE username = ?', [username], (err, deleteResults) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send("Internal Server Error");
                }

                // Staff member removed successfully
                res.send("<script>alert('Staff member removed successfully'); window.location.href = '/admin/home';</script>");
            });
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};

//REGISTER WARDEN
exports.registerWarden = async (req, res) => {
    try {
        const { username, name, phone } = req.body;
        const password = username + '@' + phone;

        // Check if the username already exists
        const usernameCheck = await promisify(db.query).bind(db)(
            'SELECT * FROM warden WHERE username = ?',
            [username]
        );

        if (usernameCheck.length > 0) {
            return res.send("<script>alert('Username already exists. Please choose a different one.'); window.location.href = '/admin/home';</script>");
        }

        const hashedPassword = await bcrypt.hash(password, 8);

        // Use a promise-based version of the database query
        const insertWarden = promisify(db.query).bind(db);
        const results = await insertWarden('INSERT INTO warden SET ?', {
            username: username,
            name: name,
            phone: phone,
            password: hashedPassword,
        });

        // Check if the query was successful
        if (results.affectedRows === 1) {
            return res.send("<script>alert('Warden Registered Successfully!'); window.location.href = '/admin/home';</script>");
        } else {
            // Handle any other possible errors
            throw new Error('Warden registration failed.');
        }
    } catch (err) {
        console.error(err);
        return res.status(500).send("Internal Server Error");
    }
};

//REMOVE WARDEN
exports.removeWarden = async (req, res) => {
    const { username } = req.body;

    try {
        // Check if the warden with the given username exists
        db.query('SELECT * FROM warden WHERE username = ?', [username], (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).send("Internal Server Error");
            }

            if (results.length === 0) {
                // Warden not found
                return res.send("<script>alert('Warden not found'); window.location.href = '/admin/home';</script>");
            }

            // If the Warden exists, delete them from the table
            db.query('DELETE FROM warden WHERE username = ?', [username], (err, deleteResults) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send("Internal Server Error");
                }

                // Staff member removed successfully
                res.send("<script>alert('Warden removed successfully'); window.location.href = '/admin/home';</script>");
            });
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};

//CHANGE PASSWORD
exports.adminChangePass = async (req, res) => {
    try {
        const { currentPassword, newPassword} = req.body;

        // Retrieve the logged-in user's username from the JWT token
        const decoded = await promisify(jwt.verify)(req.cookies[userSave], process.env.JWT_SECRET);

        // Perform the password change in the database
        db.query('SELECT * FROM adminlog WHERE username = ?', [decoded.username], async (err, results) => {
            if (err) {
                console.log(err);
                return res.status(500).send("Internal Server Error");
            }

            if (results.length === 0) {
                return res.send("<script>alert('User not found!'); window.location.href = '/admin/home';</script>"); 
                
            }
            const user = results[0];
            // Check if the old password matches the stored password
            const passwordMatches = await bcrypt.compare(currentPassword, user.password);
            if (!passwordMatches) {
                return res.send("<script>alert('Incorrect Current password'); window.location.href = '/admin/home' ; </script>"); 
                
            }


            // Hash the new password
            const hashedPassword = await bcrypt.hash(newPassword, 8);
            console.log(hashedPassword);

            // Update the password in the database
            db.query('UPDATE adminlog SET password = ? WHERE username = ?', [hashedPassword, decoded.username], (err, results) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send("Internal Server Error");
                }

                return res.send("<script>alert('Password changed successfully!'); window.location.href = '/admin/home';</script>"); 

                
            });
        });
    } catch (err) {
        console.log(err);
        return res.status(401).send("Unauthorized");
    }
};

//LOGOUT
exports.adminlogout = (req, res) => {
    res.cookie(userSave, 'logout', {
        expires: new Date(Date.now() + 2 * 1000),
        httpOnly: true
    });
    res.status(200).redirect("/");
}


