// script.js

// Define an array of key-value pairs for the APIs
const apiUrls = [
    { key: 'Oficial', value: 'https://mercados.ambito.com/dolar/oficial/variacion' },
    { key: 'Blue', value: 'https://mercados.ambito.com/dolar/informal/variacion' },
    { key: 'MEP', value: 'https://mercados.ambito.com/dolarrava/mep/variacion' },
    { key: 'CCL', value: 'https://mercados.ambito.com/dolarrava/cl/variacion' },
    { key: 'Cripto', value: 'https://mercados.ambito.com/dolarcripto/variacion' },
    { key: 'Tarjeta', value: 'https://mercados.ambito.com/dolarturista/variacion' },
    { key: 'Qatar', value: 'https://mercados.ambito.com/dolarqatar/variacion' },
    { key: 'Lujo', value: 'https://mercados.ambito.com/dolardelujo/variacion' }
];

// Function to fetch data from an API and populate the table
async function fetchDataAndPopulateTable(apiInfo) {
    try {
        const response = await fetch(apiInfo.value);
        const data = await response.json();

        // Assuming the API returns an object with the desired keys
        const { compra, venta, fecha, variacion } = data;

        const tableBody = document.getElementById('table-body');
        const row = tableBody.insertRow();
        const cell1 = row.insertCell(0);
        const cell2 = row.insertCell(1);
        const cell3 = row.insertCell(2);
        const cell4 = row.insertCell(3);
        const cell5 = row.insertCell(4);

        cell1.textContent = apiInfo.key;
        cell2.textContent = (apiInfo.key == 'Oficial' || apiInfo.key == 'Blue' || apiInfo.key == 'Cripto') ? compra : '---';
        cell3.textContent = venta;
        cell4.textContent = fecha;

        // Set the text color based on the "Variación" value
        cell5.textContent = variacion;
        cell5.style.color = variacion.startsWith('-') ? 'red' : 'lightgreen';
    } catch (error) {
        console.error(`Error fetching data from API ${apiInfo.key}: ${error.message}`);
    }
}

// Function to fetch data from all APIs and populate the table in a specific order
async function fetchDataAndPopulateAll() {
    // Define the specific order in which you want to display the APIs
    const desiredOrder = ['Oficial', 'Blue', 'MEP', 'CCL', 'Cripto', 'Tarjeta', 'Qatar', 'Lujo'];

    // Clear existing table rows
    const tableBody = document.getElementById('table-body');
    tableBody.innerHTML = '';

    // Fetch data from each API in the desired order and populate the table
    for (const apiKey of desiredOrder) {
        const apiInfo = apiUrls.find(api => api.key === apiKey);
        if (apiInfo) {
            await fetchDataAndPopulateTable(apiInfo);
        }
    }
}

// Call the fetchDataAndPopulateAll function when the page loads
document.addEventListener('DOMContentLoaded', fetchDataAndPopulateAll);

// Refresh the data every 15 minutes (900000 milliseconds)
setInterval(fetchDataAndPopulateAll, 900000);
