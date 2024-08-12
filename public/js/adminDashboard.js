// Populate city and state fields using CSV file
fetch("../assets/csv/pincode-dataset.csv")
.then(response => {
  if (!response.ok) {
    throw new Error("Failed to fetch city data");
  }
  return response.text();
})
.then(csv => {
  const rows = csv.trim().split("\n").slice(1);
  const zipcodes = rows.map(row => row.split(",")[0].trim());
  const cities = rows.map(row => row.split(",")[1].trim());
  const states = rows.map(row => row.split(",")[2].trim());

  // Update city and state fields when zipcode is entered
  document.getElementById("zipcode").addEventListener("input", event => {
    const enteredZipcode = event.target.value;
    const index = zipcodes.indexOf(enteredZipcode);
    if (index !== -1) {
      const correspondingCity = cities[index];
      const correspondingState = states[index];
      document.getElementById("city").value = correspondingCity;
      document.getElementById("state").value = correspondingState;
    } else {
      document.getElementById("city").value = "";
      document.getElementById("state").value = "";
    }
  });

  })
.catch(error => {
console.error(error);
});

//PHONE NUMBER
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("register-form");
  form.addEventListener("submit", function (event) {
      const phoneInput = document.getElementById("phone");
      const phonePattern = /^\d{10}$/; // Change the regular expression pattern as needed

      if (!phonePattern.test(phoneInput.value)) {
          alert("Please enter a valid 10-digit phone number.");
          event.preventDefault(); // Prevent form submission
      }
  });
});

//Register Staff Phone Number
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("register-staff-form");
  form.addEventListener("submit", function (event) {
      const phoneInput = document.getElementById("phone");
      const phonePattern = /^\d{10}$/; // Change the regular expression pattern as needed

      if (!phonePattern.test(phoneInput.value)) {
          alert("Please enter a valid 10-digit phone number.");
          event.preventDefault(); // Prevent form submission
      }
  });
});

//Register Warden Phone Number
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("register-warden-form");
  form.addEventListener("submit", function (event) {
      const phoneInput = document.getElementById("phone");
      const phonePattern = /^\d{10}$/; // Change the regular expression pattern as needed

      if (!phonePattern.test(phoneInput.value)) {
          alert("Please enter a valid 10-digit phone number.");
          event.preventDefault(); // Prevent form submission
      }
  });
});

//REMOVE CONFIRMATION
//Remove Staff Member
document.addEventListener('DOMContentLoaded', function () {
  const removeForm = document.getElementById('remove-staff-form');

  // Add a click event listener to the submit button
  removeForm.addEventListener('submit', function (event) {
    event.preventDefault(); // Prevent the form submission

    // Ask for confirmation using the built-in `confirm` dialog
    const isConfirmed = confirm('Are you sure you want to remove this staff member?');

    if (isConfirmed) {
      // If confirmed, submit the form
      removeForm.submit();
    }
  });
});
//Remove Warden
document.addEventListener('DOMContentLoaded', function () {
  const removeForm = document.getElementById('remove-warden-form');

  // Add a click event listener to the submit button
  removeForm.addEventListener('submit', function (event) {
    event.preventDefault(); // Prevent the form submission

    // Ask for confirmation using the built-in `confirm` dialog
    const isConfirmed = confirm('Are you sure you want to remove this Warden?');

    if (isConfirmed) {
      // If confirmed, submit the form
      removeForm.submit();
    }
  });
});

//CONFIRM ADD ADMIN PASSWORDS
document.addEventListener('DOMContentLoaded', function () {
  const addAdminForm = document.getElementById('add-admin-form');
  const passwordField = document.getElementById('password');
  const confirmPasswordField = document.getElementById('confirmPassword');

  // Add a submit event listener to the form
  addAdminForm.addEventListener('submit', function (event) {
    event.preventDefault(); // Prevent the form submission

    const password = passwordField.value;
    const confirmPassword = confirmPasswordField.value;

    if (password !== confirmPassword) {
      // Passwords don't match, display an alert
      alert('Passwords do not match. Please try again.');
    } else {
      // Passwords match, submit the form
      addAdminForm.submit();
    }
  });
});

//CONFIRM CHANGE PASSWORDS
document.addEventListener('DOMContentLoaded', function () {
  const changePasswordForm = document.getElementById('change-password-form');
  const newPasswordField = document.getElementById('newPassword');
  const confirmNewPasswordField = document.getElementById('confirmNewPassword');

  // Add a submit event listener to the form
  changePasswordForm.addEventListener('submit', function (event) {
    event.preventDefault(); // Prevent the form submission

    const newPassword = newPasswordField.value;
    const confirmNewPassword = confirmNewPasswordField.value;

    if (newPassword !== confirmNewPassword) {
      // Passwords don't match, display an alert
      alert('New Passwords do not match. Please try again.');
    } else {
      // Passwords match, submit the form
      changePasswordForm.submit();
    }
  });
});


//ADD STUDENT
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("add-student-form");
  form.addEventListener("submit", function (event) {
      const phoneInput = document.getElementById("phone");
      const parentPhoneInput = document.getElementById("parentphone");
      const phonePattern = /^\d{10}$/; // Change the regular expression pattern as needed

      if (!(phonePattern.test(phoneInput.value) || phonePattern.test(parentPhoneInput.value))) {
          alert("Please enter a valid 10-digit phone number.");
          event.preventDefault(); // Prevent form submission
      }
  });
});
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("add-student-form");
  form.addEventListener("submit", function (event) {
      const enrollmentInput = document.getElementById("enrollment");
      const enrollmentPattern = /^\d{3}[A-Za-z]\d{3}$/;

      if (!enrollmentPattern.test(enrollmentInput.value) ) {
          alert("Please enter a valid enrollment number.");
          event.preventDefault(); // Prevent form submission
      }
  });
});

//UPDATE STUDENT
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("search-student-form");
  form.addEventListener("submit", function (event) {
      const enrollmentInput = document.getElementById("enrollment");
      const enrollmentPattern = /^\d{3}[A-Za-z]\d{3}$/;

      if (!enrollmentPattern.test(enrollmentInput.value) ) {
          alert("Please enter a valid enrollment number.");
          event.preventDefault(); // Prevent form submission
      }
  });
});
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("update-student-form");
  form.addEventListener("submit", function (event) {
      const phoneInput = document.getElementById("phone");
      const parentPhoneInput = document.getElementById("parentphone");
      const phonePattern = /^\d{10}$/; // Change the regular expression pattern as needed

      if (!(phonePattern.test(phoneInput.value) || phonePattern.test(parentPhoneInput.value))) {
          alert("Please enter a valid 10-digit phone number.");
          event.preventDefault(); // Prevent form submission
      }
  });
});


