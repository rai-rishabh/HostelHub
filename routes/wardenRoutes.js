const express = require("express");
const router = express.Router();
const wardenController = require("../controllers/warden.js")

//Route for the Welcome Text
router.get('/', (req, res) => {
    res.render("wardenDashboard", {username:req.user.username});
});
router.get('/home', (req, res) => {
    res.render("wardenDashboard", {username:req.user.username});
});
//Route for Change Password
router.get('/showChangePassword', (req, res) => {
    res.render("wardenDashboard", { username:req.user.username, showChangePassword: true });
});
// Route for Publish Notice
router.get('/showPublishNotice', (req, res) => {
    res.render("wardenDashboard", { username: req.user.username, showPublishNotice: true });
});
//Route for Student Records
router.get('/showStudentRecords', (req, res) => {
    res.render("wardenDashboard", { username:req.user.username, showStudentRecords: true });
});


//PUBLISH NOTICE
router.post('/publishNotice', wardenController.upload.single('image'), wardenController.publishNotice, (req, res) => {
    res.send("<script>alert('Notice published successfully!'); window.location.href = '/warden/home';</script>");
  });

//SHOW NOTICES
router.get('/showNotices', wardenController.fetchNotices, (req, res) => {
    res.render('wardenDashboard', {
        username: req.user.username,
        showNotice: true,
        notices: req.notices,
        formatDate: wardenController.formatDate,
        trimPublicFromPath: wardenController.trimPublicFromPath
    });
});

//DELETE NOTICE
router.post('/deleteNotice', wardenController.deleteNotice, (req, res) => {
    res.render("wardenDashboard", { username: req.user.username});
});

//LEAVE APPLICATIONS
router.get('/showLeaveApplications', wardenController.fetchLeaveApplications, (req, res) => {
    try {
        if (!req.user) {
            console.log('Login Required!');
            return res.send("<script>alert('User not found!'); window.location.href = '/warden/home';</script>"); 
        }

        return res.render("wardenDashboard", {
            
            username: req.user.username,
            leaveApplications: req.leaveApplications,
            showLeaveApplications: true,
            formatDate: wardenController.formatDate,
            trimPublicFromPath: wardenController.trimPublicFromPath
        });
    } catch (err) {
        console.error('Error in rendering leave status:', err);
        return res.status(500).send('Failed to render leave status');
    }
});

//APPLICATION DECISION
router.post('/applicationDecision', wardenController.updateLeaveApplicationDecision, (req, res) => {
    res.render("wardenDashboard", { username: req.user.username});
  });

  // RECORD SEARCH
router.post('/studentRecords', wardenController.fetchStudentRecords, (req, res) => {
    try {
      res.render('studentRecords', {
        studentDetails: req.studentDetails,
        totalLeaves: req.totalLeaves,
        totalMaintenances: req.totalMaintenances,
        formatDate: wardenController.formatDate,
        leaveApplications: req.leaveApplications
      });
    } catch (err) {
      console.error('Error in /studentRecords route:', err);
      res.status(500).send('Internal Server Error');
    }
  });
  
//CHANGE PASSWORD
router.post('/changePassword', wardenController.wardenChangePass);

//LOGOUT
router.use('/logout',wardenController.wardenlogout, (req, res) => {
    res.redirect('/home');
});


module.exports = router;
