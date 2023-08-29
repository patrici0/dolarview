// Function to fetch data from the API
function fetchData() {
    const loadingMessage = document.getElementById('loading-message');
    loadingMessage.style.display = 'block';

    fetch('https://mercados.ambito.com/mercados/monedas') // Replace with your API URL
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        populateTable(data);
    })
    .catch(error => {
        console.error('Error fetching data:', error);
        // Display an error message to the user
        // You can update a message element in your HTML to show the error
        const errorMessage = document.getElementById('error-message');
        errorMessage.textContent = 'An error occurred while fetching data. Please try again later.';
    })
    .finally(() => {
        loadingMessage.style.display = 'none';
    });
}

function fetchAdditionalData() {
    fetch('https://mercados.ambito.com/dolar/oficial/variacion') // Replace with your second API URL
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        addRowToTable(data);
    })
    .catch(error => {
        console.error('Error fetching additional data:', error);
        // Display an error message to the user
        // You can update a message element in your HTML to show the error
        const errorMessage = document.getElementById('error-message');
        errorMessage.textContent = 'An error occurred while fetching data. Please try again later.';
    });
}

// Function to populate the table with fetched data
function populateTable(data) {
    const table = document.getElementById('data-table');
    
    // Clear existing table rows
    table.innerHTML = '';
    
    // Create the header row
    const headerRow = table.insertRow();
    const headerCell1 = headerRow.insertCell(0);
    const headerCell2 = headerRow.insertCell(1);
    const headerCell3 = headerRow.insertCell(2);
    const headerCell4 = headerRow.insertCell(3);
    const headerCell5 = headerRow.insertCell(4);
    headerCell1.textContent = 'Tipo';
    headerCell2.textContent = 'Valor Compra';
    headerCell3.textContent = 'Valor Venta';
    headerCell4.textContent = 'Fecha';
    headerCell5.textContent = "Variación";
    headerCell1.className = 'header'; // Apply the header class
    headerCell2.className = 'header'; // Apply the header class
    headerCell3.className = 'header'; // Apply the header class
    headerCell4.className = 'header'; // Apply the header class
    headerCell5.className = 'header'; // Apply the header class

    // Populate the table with data
    data.forEach(item => {
        const row = table.insertRow();
        const cell1 = row.insertCell(0);
        const cell2 = row.insertCell(1);
        const cell3 = row.insertCell(2);
        const cell4 = row.insertCell(3);
        const cell5 = row.insertCell(4);

        cell1.textContent = item.nombre; // Replace with your data properties
        cell2.textContent = item.compra; // Replace with your data properties
        cell3.textContent = item.venta; // Replace with your data properties
        cell4.textContent = item.fecha; // Replace with your data properties
        //cell5.textContent = item.variacion; // Replace with your data properties
        
        // Check if 'variacion' starts with a dash or a number
        if (item.variacion.startsWith('-')) {
            cell5.textContent = item.variacion;
            cell5.classList.add('negative'); // Apply the negative class
        } else if (!isNaN(parseFloat(item.variacion))) {
            cell5.textContent = "+" + item.variacion;
            cell5.classList.add('positive'); // Apply the positive class
        }
    });
}

function addRowToTable(data) {
    const table = document.getElementById('data-table');
    const newRow = table.insertRow(1); // Add a new row after the header row
    
    const cell1 = newRow.insertCell(0);
    const cell2 = newRow.insertCell(1);
    const cell3 = newRow.insertCell(2);
    const cell4 = newRow.insertCell(3);
    const cell5 = newRow.insertCell(4);

    cell1.textContent = "Dólar Oficial"; // Replace with the actual property name
    cell2.textContent = data.compra; // Replace with the actual property name
    cell3.textContent = data.venta; // Replace with the actual property name
    cell4.textContent = data.fecha; // Replace with the actual property name
    //cell5.textContent = data.variacion; // Replace with the actual property name

    // Check if 'variacion' starts with a dash or a number
    if (data.variacion.startsWith('-')) {
        cell5.textContent = data.variacion;
        cell5.classList.add('negative'); // Apply the negative class
    } else if (!isNaN(parseFloat(data.variacion))) {
        cell5.textContent = "+" + data.variacion;
        cell5.classList.add('positive'); // Apply the positive class
    }
}

// Fetch data on page load
window.onload = function() {
    fetchData();
    fetchAdditionalData(); // Fetch additional data and add a row
    setInterval(fetchData, 60000*15); // 60000 milliseconds = 1 minute
    setInterval(fetchAdditionalData, 60000*15); // 60000 milliseconds = 1 minute
};