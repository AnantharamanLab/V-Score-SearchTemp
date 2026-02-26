document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const dataTable = document.getElementById('dataTable').getElementsByTagName('tbody')[0];
    const pagination = document.getElementById('pagination');
    let tableData = [];
    let sortOrder = {}; // To keep track of sort order for each column
    let currentPage = 1;
    const rowsPerPage = 500;

    // =========================
    // Load CSV
    // =========================
    function loadCSV() {
        Papa.parse('VScoreData.csv', {
            download: true,
            header: true,
            complete: function(results) {
                console.log('Parsed CSV data:', results.data); // Log parsed data
                tableData = results.data.filter(row => Object.values(row).some(val => val !== "")); // remove empty rows
                displayData(tableData);
                renderPagination();
            },
            error: function(error) {
                console.error('Error parsing CSV:', error);
            }
        });
    }

    // =========================
    // Display Data
    // =========================
    function displayData(data) {
        const start = (currentPage - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        const paginatedData = data.slice(start, end);
        dataTable.innerHTML = ''; // Clear table

        paginatedData.forEach(row => {
            const tr = document.createElement('tr');
            for (const key in row) {
                const td = document.createElement('td');
                td.textContent = row[key];
                tr.appendChild(td);
            }
            dataTable.appendChild(tr);
        });
    }

    // =========================
    // Filter Data
    // =========================
    function filterData() {
        const filters = searchInput.value.toLowerCase().split(',').map(filter => filter.trim());
        const filteredData = tableData.filter(row => {
            return filters.every(filter => {
                return Object.values(row).some(value => value.toString().toLowerCase().includes(filter));
            });
        });
        displayData(filteredData);
        renderPagination();
    }

    // =========================
    // Sort Data
    // =========================
    function sortData(column) {
        const isAscending = sortOrder[column] !== 'asc';
        sortOrder[column] = isAscending ? 'asc' : 'desc';

        const filters = searchInput.value.toLowerCase().split(',').map(f => f.trim());
        const filteredData = tableData.filter(row => {
            return filters.every(filter => {
                return Object.values(row).some(value => value.toString().toLowerCase().includes(filter));
            });
        });

        const sortedData = [...filteredData].sort((a, b) => {
            const valueA = isNaN(parseFloat(a[column])) ? a[column] : parseFloat(a[column]);
            const valueB = isNaN(parseFloat(b[column])) ? b[column] : parseFloat(b[column]);

            if (valueA < valueB) return isAscending ? -1 : 1;
            if (valueA > valueB) return isAscending ? 1 : -1;
            return 0;
        });

        displayData(sortedData);
        renderPagination();
    }

    // =========================
    // Render Pagination
    // =========================
    function renderPagination() {
        const filters = searchInput.value.toLowerCase().split(',').map(f => f.trim());
        const filteredData = tableData.filter(row => {
            return filters.every(filter => {
                return Object.values(row).some(value => value.toString().toLowerCase().includes(filter));
            });
        });

        const totalPages = Math.ceil(filteredData.length / rowsPerPage);
        pagination.innerHTML = '';
        const maxButtons = 5;

        // Previous button
        const prevButton = document.createElement('button');
        prevButton.textContent = '«';
        prevButton.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                displayData(filteredData);
                renderPagination();
            }
        });
        pagination.appendChild(prevButton);

        // Page number buttons
        for (let i = Math.max(1, currentPage - Math.floor(maxButtons / 2)); i <= Math.min(currentPage + Math.floor(maxButtons / 2), totalPages); i++) {
            const pageButton = document.createElement('button');
            pageButton.textContent = i;
            pageButton.addEventListener('click', ((page) => {
                return () => {
                    currentPage = page;
                    displayData(filteredData);
                    renderPagination();
                };
            })(i));
            pagination.appendChild(pageButton);
        }

        // Next button
        const nextButton = document.createElement('button');
        nextButton.textContent = '»';
        nextButton.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                displayData(filteredData);
                renderPagination();
            }
        });
        pagination.appendChild(nextButton);

        // Page input
        const pageInput = document.createElement('input');
        pageInput.type = 'number';
        pageInput.min = 1;
        pageInput.max = totalPages;
        pageInput.value = currentPage;
        pageInput.addEventListener('change', () => {
            let pageNum = parseInt(pageInput.value);
            if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
                currentPage = pageNum;
                displayData(filteredData);
                renderPagination();
            } else {
                pageInput.value = currentPage;
            }
        });
        pagination.appendChild(pageInput);

        // Current page display
        const currentPageDisplay = document.createElement('span');
        currentPageDisplay.textContent = `Page ${currentPage} of ${totalPages}`;
        pagination.appendChild(currentPageDisplay);
    }

    // =========================
    // Go Button
    // =========================
    document.getElementById('goButton').addEventListener('click', () => {
        currentPage = 1;
        filterData();
    });

    // =========================
    // Enter triggers Go
    // =========================
    searchInput.addEventListener('keydown', function(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            currentPage = 1;
            filterData();
        }
    });

    // =========================
    // Example Button
    // =========================
    document.getElementById('exampleButton').addEventListener('click', () => {
        searchInput.value = "K04763";
        currentPage = 1;
        filterData();
    });

    // =========================
    // Export Filtered CSV
    // Export button triggers CSV download of filtered data
    document.getElementById('exportButton').addEventListener('click', () => {
        const filters = searchInput.value.toLowerCase().split(',').map(f => f.trim());

        // Filter tableData based on current search input
        const filteredData = tableData.filter(row => {
            return filters.every(filter => {
                return Object.values(row).some(value =>
                    value.toString().toLowerCase().includes(filter)
                );
            });
        });

        // Convert filtered data to CSV
        const csv = Papa.unparse(filteredData);

        // Create a blob and generate download link
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

        // Use search query in file name, replace spaces/illegal chars with underscores
        let queryName = searchInput.value.trim() || "All";
        queryName = queryName.replace(/[^a-zA-Z0-9_-]/g, "_"); // safe file name
        const fileName = `V-ScoreData_${queryName}.csv`;

        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // =========================
    // Table Sorting
    // =========================
    document.querySelectorAll('.sortable').forEach(header => {
        header.addEventListener('click', () => {
            const column = header.getAttribute('data-column');
            sortData(column);
        });
    });

    // =========================
    // Load CSV on page load
    // =========================
    loadCSV();
});

