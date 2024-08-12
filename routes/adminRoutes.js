const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.js")

//Route for the Welcome Text
router.get('/', (req, res) => {
    res.render("adminDashboard", {username:req.user.username});
});
router.get('/home', (req, res) => {
    res.render("adminDashboard", {username:req.user.username});
});

//Route for Change Password
router.get('/showChangePassword', (req, res) => {
    res.render("adminDashboard", { username:req.user.username, showChangePassword: true });
});

//Route for Register Staff
router.get('/showRegisterStaff', (req, res) => {
    res.render("adminDashboard", { username: req.user.username, showRegisterStaff: true });
});

//Route for Remove Staff
router.get('/showRemoveStaff', (req, res) => {
    res.render("adminDashboard", { username: req.user.username, showRemoveStaff: true });
});

//Route for Register Warden
router.get('/showRegisterWarden', (req, res) => {
    res.render("adminDashboard", { username: req.user.username, showRegisterWarden: true });
});

//Route for Remove Warden
router.get('/showRemoveWarden', (req, res) => {
    res.render("adminDashboard", { username: req.user.username, showRemoveWarden: true });
});

// Route for Add student
router.get('/showAddStudent', (req, res) => {
    res.render("adminDashboard", { username: req.user.username, showAddStudent: true });
});

// Route for Publish Notice
router.get('/showPublishNotice', (req, res) => {
    res.render("adminDashboard", { username: req.user.username, showPublishNotice: true });
});

// Route for Update student
router.get('/showUpdateStudent', (req, res) => {
    res.render("adminDashboard", { username: req.user.username, showUpdateStudent: true });
});

// Route for Add Admin
router.get('/showAddAdmin', (req, res) => {
    res.render("adminDashboard", { username:req.user.username, showAddAdmin: true });
});

//ADD ADMIN
router.post('/addAdmin', adminController.addAdmin);

//ADD STUDENT
router.use('/addStudent', adminController.addStudents);

//UPDATE STUDENT
//show details
router.use('/showStudentDetails', adminController.searchStudentDetails, (req, res) => {
    res.render("adminDashboard", { username:req.user.username, studentDetails:res.locals.studentDetails, showUpdateStudent: true });
});
//update
router.use('/updateStudentDetails', adminController.updateStudentDetails);

//REGISTER STAFF
router.post('/registerStaff', adminController.registerStaff);

//REMOVE STAFF
router.post('/removeStaff', adminController.removeStaff);

//REGISTER WARDEN
router.post('/registerWarden', adminController.registerWarden);

//REMOVE WARDEN
router.post('/removeWarden', adminController.removeWarden);

//CHANGE PASSWORD
router.post('/changePassword', adminController.adminChangePass);

//LOGOUT
router.use('/logout',adminController.adminlogout, (req, res) => {
    res.redirect('/home');
});

//PUBLISH NOTICE
 router.post('/publishNotice', adminController.upload.single('image'), adminController.publishNotice, (req, res) => {
    res.send("<script>alert('Notice published successfully!'); window.location.href = '/admin/home';</script>");
  });

module.exports = router;
