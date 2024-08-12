        const addTableCheckbox = document.getElementById('addTableCheckbox');
        const tableInput = document.getElementById('tableInput');
        const generateTableButton = document.getElementById('generateTableButton');
        const tableContent = document.getElementById('tableContent');

        addTableCheckbox.addEventListener('change', function() {
            if (this.checked) {
                tableInput.style.display = 'block';
            } else {
                tableInput.style.display = 'none';
                tableContent.innerHTML = ''; // Clear the table content
            }
        });

        generateTableButton.addEventListener('click', function() {
            const numRows = document.getElementById('numRows').value;
            const numCols = document.getElementById('numCols').value;
            const tableHTML = generateTable(numRows, numCols);
            tableContent.innerHTML = tableHTML;
        });

        function generateTable(rows, cols) {
            let tableHTML = "<table>";
            
            // Table heading
            tableHTML += "<tr>";
            for (let j = 0; j < cols; j++) {
                tableHTML += `<th>Heading ${j + 1}</th>`;
            }
            tableHTML += "</tr>";

            // Table data
            for (let i = 0; i < rows; i++) {
                tableHTML += "<tr>";

                for (let j = 0; j < cols; j++) {
                    tableHTML += `<td contenteditable="true"></td>`;
                }

                tableHTML += "</tr>";
            }

            tableHTML += "</table>";
            return tableHTML;
        }



