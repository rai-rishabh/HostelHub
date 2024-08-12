const express = require("express");
const router = express.Router();
const staffController = require("../controllers/staff.js")

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

//Route for the Welcome Text
router.get('/', (req, res) => {
    res.render("staffDashboard", {username:req.user.username});
});
router.get('/home', (req, res) => {
    res.render("staffDashboard", {username:req.user.username});
});
//Route for Change Password
router.get('/showChangePassword', (req, res) => {
    res.render("staffDashboard", { username:req.user.username, showChangePassword: true });
});
//Route for Student Records
router.get('/showStudentRecords', (req, res) => {
    res.render("staffDashboard", { username:req.user.username, showStudentRecords: true });
});
//Route for Mark Attendance
router.get('/showMarkAttendance', staffController.showMarkAttendance, (req, res) => {
  res.render('staffDashboard', req.attendanceData);
});
 

//MAINTENACE REQUEST
router.get('/showMaintenanceRequests', staffController.showMaintenanceRequests, (req, res) => {
  res.render('staffdashboard', { username: req.user.username, showMaintenanceRequests: true, maintenance: req.maintenance, formatDate: staffController.formatDate });
});


//MARK ATTENDANCE
router.post('/markAttendance', staffController.markAttendance, (req, res) => {
  return res.send("<script>alert('Attendance Marked!'); window.location.href = '/staff/home';</script>");
});


//MAINTENANCE UPDATE
router.post('/markCompleted', staffController.markCompleted, (req, res) => {
  return res.send("<script>alert('Request Marked Completed!'); window.location.href = '/staff/showMaintenanceRequests';</script>");
});
  

//LEAVE APPLICATIONS
router.get('/showLeaveApplications', staffController.fetchLeaveApplications, (req, res) => {
    try {
        if (!req.user) {
            console.log('Login Required!');
            return res.send("<script>alert('User not found!'); window.location.href = '/staff/home';</script>"); 
        }

        return res.render("staffDashboard", {
            
            username: req.user.username,
            leaveApplications: req.leaveApplications,
            showLeaveApplications: true,
            formatDate: staffController.formatDate,
            trimPublicFromPath: staffController.trimPublicFromPath
        });
    } catch (err) {
        console.error('Error in rendering leave status:', err);
        return res.status(500).send('Failed to render leave status');
    }
});

//LEAVE REMARKS
router.post('/applicationDecision', staffController.updateRemarks, async (req, res) => {
    try {
        res.send("<script>alert('Application Forwarded To The Warden!'); window.location.href = '/staff/showLeaveApplications';</script>"); 
    } catch (err) {
      console.error('Error in application decision:', err);
      res.status(500).send('Failed to update remarks');
    }
  });

// RECORD SEARCH
router.post('/studentRecords', staffController.fetchStudentRecords, (req, res) => {
    try {
      res.render('studentRecords', {
        studentDetails: req.studentDetails,
        totalLeaves: req.totalLeaves,
        totalMaintenances: req.totalMaintenances,
        formatDate: staffController.formatDate,
        leaveApplications: req.leaveApplications
      });
    } catch (err) {
      console.error('Error in /studentRecords route:', err);
      res.status(500).send('Internal Server Error');
    }
  });



//CHANGE PASSWORD
router.post('/changePassword', staffController.staffChangePass);

//LOGOUT
router.use('/logout',staffController.stafflogout, (req, res) => {
    res.redirect('/home');
});

module.exports = router;