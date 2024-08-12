// Calculate number of days
function calculateDays() {
    var from_date = new Date(document.getElementById("from_date").value);
    var to_date = new Date(document.getElementById("to_date").value);
    var diff_in_time = to_date.getTime() - from_date.getTime();
    var diff_in_days = Math.ceil(diff_in_time / (1000 * 3600 * 24)) + 1;
    document.getElementById("no_of_days").value = diff_in_days;
}

// Set min attribute of date inputs to current date
document.getElementById("from_date").setAttribute("min", new Date().toISOString().slice(0,10));
document.getElementById("to_date").setAttribute("min", new Date().toISOString().slice(0,10));


// Calculate number of days initially
calculateDays();



