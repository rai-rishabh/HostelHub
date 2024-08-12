const express = require("express");
const router = express.Router();
const studentController = require("../controllers/student.js")

// Route for the Welcome Text
router.get('/', (req, res) => {
    res.render("studentDashboard", { username: req.user.enrollment });
});
router.get('/home', (req, res) => {
    res.render("studentDashboard", { username: req.user.enrollment });
});
//Route for Change Password
router.get('/showChangePassword', (req, res) => {
    res.render("studentDashboard", { username: req.user.enrollment, showChangePassword: true });
});
//Route for Leave Application
router.get('/showLeaveApplication', (req, res) => {
    res.render("studentDashboard", { username: req.user.enrollment, showLeaveApplication: true });
});
//Route for Maintenance Application
router.get('/showMaintenanceApplication', (req, res) => {
    res.render("studentDashboard", { username: req.user.enrollment, showMaintenanceApplication: true });
});


//DOWNLOAD APPLICATION
router.get('/downloadLeaveApplication', studentController.downloadLeaveApplicationPDF);

//LEAVE STATUS
router.get('/showLeaveStatus', studentController.fetchLeaveApplications, (req, res) => {
    try {
        if (!req.user) {
            console.log('Login Required!');
            return res.send("<script>alert('User not found!'); window.location.href = '/student/home';</script>"); 
        }

        return res.render("studentDashboard", {
            username: req.user.enrollment,
            leaveApplications: req.leaveApplications,
            showLeaveStatus: true,
            formatDate: studentController.formatDate,
            trimPublicFromPath: studentController.trimPublicFromPath
        });
    } catch (err) {
        console.error('Error in rendering leave status:', err);
        return res.status(500).send('Failed to render leave status');
    }
});


//LEAVE APPLICATION
router.post('/applyLeave', studentController.upload.single('image'), studentController.processLeave, (req, res) => {
    // Send a response or redirect to a success page
    res.send("<script>alert('Leave applied successfully!'); window.location.href = '/student/home';</script>");
  });  


//MAINTENANCE REQUEST
router.post('/requestMaintenance', studentController.requestmaintenance);

//CHANGE PASSWORD
router.post('/changePassword', studentController.studentChangePass);

//LOGOUT
router.use('/logout',studentController.studentlogout, (req, res) => {
    res.redirect('/home');
});


module.exports = router;
