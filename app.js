// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/payment-allocator-app/sw.js')
            .then(reg => console.log('ServiceWorker registration successful'))
            .catch(err => console.log('ServiceWorker registration failed: ', err));
    });
}

// Dark Mode Toggle
const themeToggleBtn = document.getElementById('theme-toggle');
const darkIcon = document.getElementById('theme-toggle-dark-icon');
const lightIcon = document.getElementById('theme-toggle-light-icon');

if (localStorage.getItem('color-theme') === 'dark' || (!('color-theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    lightIcon.classList.remove('hidden');
} else {
    darkIcon.classList.remove('hidden');
}

themeToggleBtn.addEventListener('click', function() {
    darkIcon.classList.toggle('hidden');
    lightIcon.classList.toggle('hidden');
    if (localStorage.getItem('color-theme')) {
        if (localStorage.getItem('color-theme') === 'light') {
            document.documentElement.classList.add('dark');
            localStorage.setItem('color-theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('color-theme', 'light');
        }
    } else {
        if (document.documentElement.classList.contains('dark')) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('color-theme', 'light');
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('color-theme', 'dark');
        }
    }
});

// Main App Logic
const grossPaymentInput = document.getElementById('grossPayment');
const boostPhaseSelect = document.getElementById('boostPhase');
const includeBonusCheckbox = document.getElementById('includeBonus');
const calculateBtn = document.getElementById('calculateBtn');
const outputSummary = document.getElementById('outputSummary');
const totalAllocationSummary = document.getElementById('totalAllocationSummary');
const logTableBody = document.querySelector('#logTable tbody');
const clearLogBtn = document.getElementById('clearLogBtn');
const exportCsvBtn = document.getElementById('exportCsvBtn');

let transactionLog = [];

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function calculateAllocation() {
    const gross = parseFloat(grossPaymentInput.value) || 0;
    if (gross <= 0) {
        grossPaymentInput.focus();
        return;
    }
    const boostPhase = boostPhaseSelect.value;
    const includeBonus = includeBonusCheckbox.checked;

    const tax = gross * 0.25;
    const bizChecking = gross * 0.30;
    const ownerBase = gross * 0.35;
    const subPool = gross * 0.10;
    const tithe = gross * 0.10;
    const titheBonus = includeBonus ? tithe * 0.5 : 0;
    const ownerPayTotal = ownerBase + titheBonus;

    let longTerm, reserve, innovationGear;
    switch (boostPhase) {
        case 'long-term': longTerm = subPool * 0.77; reserve = subPool * 0.115; innovationGear = subPool * 0.115; break;
        case 'reserve': reserve = subPool * 0.77; longTerm = subPool * 0.115; innovationGear = subPool * 0.115; break;
        case 'innovation-gear': innovationGear = subPool * 0.77; reserve = subPool * 0.115; longTerm = subPool * 0.115; break;
        case 'no-boost': longTerm = reserve = innovationGear = subPool / 3; break;
    }
    
    const results = { gross, boostPhase: boostPhaseSelect.options[boostPhaseSelect.selectedIndex].text, tithe, ownerPayTotal, tax, bizChecking, subPool, reserve, longTerm, innovationGear };
    displayResults(results);
    logTransaction(results);
}

function displayResults(data) {
    const ownerBase = data.ownerPayTotal - (includeBonusCheckbox.checked ? data.tithe * 0.5 : 0);
    const totalAllocations = data.tax + data.bizChecking + ownerBase + data.subPool;

    outputSummary.innerHTML = `
        <div class="output-item bg-gray-50 dark:bg-gray-700/50 border-l-4 border-red-500 p-4 rounded-r-lg"><h3>Tax Savings (25%)</h3><p class="text-xl font-bold">${formatCurrency(data.tax)}</p></div>
        <div class="output-item bg-gray-50 dark:bg-gray-700/50 border-l-4 border-blue-500 p-4 rounded-r-lg"><h3>Business Checking (30%)</h3><p class="text-xl font-bold">${formatCurrency(data.bizChecking)}</p></div>
        <div class="output-item bg-gray-50 dark:bg-gray-700/50 border-l-4 border-green-500 p-4 rounded-r-lg"><h3>Total Owner Pay</h3><p class="text-xl font-bold">${formatCurrency(data.ownerPayTotal)}</p></div>
        <div class="output-item bg-gray-50 dark:bg-gray-700/50 border-l-4 border-indigo-500 p-4 rounded-r-lg"><h3>Sub-Account Pool (10%)</h3><p class="text-xl font-bold">${formatCurrency(data.subPool)}</p></div>
        <div class="output-item bg-gray-50 dark:bg-gray-700/50 border-l-4 border-yellow-400 p-4 rounded-r-lg md:col-span-2"><h3>Tithe Reminder (10%)</h3><p class="text-xl font-bold">${formatCurrency(data.tithe)}</p></div>
        <div class="output-item bg-gray-50 dark:bg-gray-700/50 border-l-4 border-purple-500 p-4 rounded-r-lg"><h3>Reserve Savings</h3><p class="text-xl font-bold">${formatCurrency(data.reserve)}</p></div>
        <div class="output-item bg-gray-50 dark:bg-gray-700/50 border-l-4 border-pink-500 p-4 rounded-r-lg"><h3>Long-Term Savings</h3><p class="text-xl font-bold">${formatCurrency(data.longTerm)}</p></div>
        <div class="output-item bg-gray-50 dark:bg-gray-700/50 border-l-4 border-teal-500 p-4 rounded-r-lg"><h3>Innovation–Gear</h3><p class="text-xl font-bold">${formatCurrency(data.innovationGear)}</p></div>
    `;
    
    totalAllocationSummary.innerHTML = `
        <h3 class="text-lg font-bold">Total Distributed: ${formatCurrency(totalAllocations)}</h3>
        <p class="text-sm">This correctly represents 100% of the gross payment.</p>
    `;
}

function logTransaction(data) {
    transactionLog.unshift(data);
    renderLog();
}

function renderLog() {
    logTableBody.innerHTML = transactionLog.map(log => `
        <tr class="dark:border-gray-700">
            <td data-label="Gross" class="dark:border-gray-700">${formatCurrency(log.gross)}</td>
            <td data-label="Boost Phase" class="dark:border-gray-700">${log.boostPhase}</td>
            <td data-label="Owner Pay" class="dark:border-gray-700">${formatCurrency(log.ownerPayTotal)}</td>
            <td data-label="Tax" class="dark:border-gray-700">${formatCurrency(log.tax)}</td>
            <td data-label="Biz Checking" class="dark:border-gray-700">${formatCurrency(log.bizChecking)}</td>
            <td data-label="Sub-Pool" class="dark:border-gray-700">${formatCurrency(log.subPool)}</td>
            <td data-label="Long-Term" class="dark:border-gray-700">${formatCurrency(log.longTerm)}</td>
            <td data-label="Reserve" class="dark:border-gray-700">${formatCurrency(log.reserve)}</td>
            <td data-label="Innovation" class="dark:border-gray-700">${formatCurrency(log.innovationGear)}</td>
            <td data-label="Tithe Due" class="dark:border-gray-700">${formatCurrency(log.tithe)}</td>
        </tr>`).join('');
}

function clearLog() {
    if (window.confirm('Are you sure you want to clear the entire transaction log?')) {
        transactionLog = [];
        renderLog();
    }
}

function exportToCsv() {
    if (transactionLog.length === 0) { return; }
    const headers = ['Gross', 'Boost Phase', 'Total Owner Pay', 'Tax', 'Biz Checking', 'Sub-Pool', 'Long-Term', 'Reserve', 'Innovation', 'Tithe Due'];
    const rows = transactionLog.map(log => [log.gross, log.boostPhase, log.ownerPayTotal, log.tax, log.bizChecking, log.subPool, log.longTerm, log.reserve, log.innovationGear, log.tithe]);
    let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "payment_allocations.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

calculateBtn.addEventListener('click', calculateAllocation);
clearLogBtn.addEventListener('click', clearLog);
exportCsvBtn.addEventListener('click', exportToCsv);