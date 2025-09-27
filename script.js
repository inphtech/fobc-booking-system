// Booking system state
let bookingData = {
    'padel-1': { booked: [], reserve: [], maxCapacity: 12 },
    'padel-2': { booked: [], reserve: [], maxCapacity: 12 },
    'padel-3': { booked: [], reserve: [], maxCapacity: 12 },
    'fitness-1': { booked: [], reserve: [], maxCapacity: 20 }
};

let bookingStatus = {
    padel: true,
    fitness: true
};

// Admin password - change this for security
const ADMIN_PASSWORD = 'Fobc2024@Adm';
let isAdminAuthenticated = false;

// Load data from server API
async function loadBookingData() {
    try {
        console.log('Attempting to load data from server...');
        
        // Load bookings from server
        const bookingsResponse = await fetch('/api/bookings');
        if (bookingsResponse.ok) {
            bookingData = await bookingsResponse.json();
            console.log('✅ Successfully loaded bookings from server:', bookingData);
            
            // Show server status in UI
            updateServerStatus(true);
        } else {
            throw new Error(`Server responded with status: ${bookingsResponse.status}`);
        }
        
        // Load booking status from server
        const statusResponse = await fetch('/api/status');
        if (statusResponse.ok) {
            bookingStatus = await statusResponse.json();
            console.log('✅ Successfully loaded status from server:', bookingStatus);
        }
    } catch (error) {
        console.log('❌ Server not available, using localStorage fallback:', error.message);
        
        // Show server status in UI
        updateServerStatus(false);
        
        // Fallback to localStorage if server is not available
        const saved = localStorage.getItem('fobc-booking-data');
        if (saved) {
            bookingData = JSON.parse(saved);
            console.log('📱 Loaded data from localStorage:', bookingData);
        }
        
        const savedStatus = localStorage.getItem('fobc-booking-status');
        if (savedStatus !== null) {
            bookingStatus = JSON.parse(savedStatus);
        }
    }
    
    checkAutoClose();
    updateBookingStatus();
    updateAllSlots();
}

// Update server status indicator
function updateServerStatus(isConnected) {
    const statusElement = document.getElementById('server-status');
    if (statusElement) {
        if (isConnected) {
            statusElement.textContent = '🟢 Server Connected';
            statusElement.className = 'server-status connected';
        } else {
            statusElement.textContent = '🔴 Offline Mode';
            statusElement.className = 'server-status offline';
        }
    }
}

// Save data to server API
async function saveBookingData() {
    try {
        // Save to server
        await fetch('/api/status', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bookingStatus)
        });
    } catch (error) {
        console.log('Server not available, using localStorage fallback');
        // Fallback to localStorage if server is not available
        localStorage.setItem('fobc-booking-data', JSON.stringify(bookingData));
        localStorage.setItem('fobc-booking-status', JSON.stringify(bookingStatus));
    }
}

// Check for automatic booking closure and opening
function checkAutoClose() {
    const now = new Date();
    const gstOffset = 4 * 60; // GST is UTC+4
    const gstTime = new Date(now.getTime() + (gstOffset * 60 * 1000));
    
    const day = gstTime.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const hour = gstTime.getHours();
    
    // Fitness booking schedule
    if (day === 6 && hour >= 12) {
        // Open fitness booking on Saturday at 12pm GST
        bookingStatus.fitness = true;
    } else if (day === 3 && hour >= 18) {
        // Close fitness booking at 6pm GST on Wednesdays
        bookingStatus.fitness = false;
    } else if (day < 6 || (day === 6 && hour < 12)) {
        // Keep fitness closed until Saturday 12pm
        bookingStatus.fitness = false;
    }
    
    // Padel booking schedule
    if (day === 0 && hour >= 12) {
        // Open padel booking on Sunday at 12pm GST
        bookingStatus.padel = true;
    } else if (day === 4 && hour >= 18) {
        // Close padel booking at 6pm GST on Thursdays
        bookingStatus.padel = false;
    } else if (day === 0 && hour < 12) {
        // Keep padel closed until Sunday 12pm
        bookingStatus.padel = false;
    } else if (day === 5 || day === 6) {
        // Keep padel closed on Friday and Saturday
        bookingStatus.padel = false;
    }
    // Padel remains open Monday-Thursday until 6pm Thursday
}

// Update booking status display
function updateBookingStatus() {
    const padelSection = document.querySelector('.padel-section');
    const fitnessSection = document.querySelector('.fitness-section');
    
    // Update padel section status
    const padelStatusElement = document.getElementById('padel-status');
    if (bookingStatus.padel) {
        padelSection.classList.remove('booking-closed');
        padelStatusElement.textContent = 'Open';
        padelStatusElement.className = 'status-indicator';
    } else {
        padelSection.classList.add('booking-closed');
        padelStatusElement.textContent = 'Closed';
        padelStatusElement.className = 'status-indicator closed';
    }
    
    // Update fitness section status
    const fitnessStatusElement = document.getElementById('fitness-status');
    if (bookingStatus.fitness) {
        fitnessSection.classList.remove('booking-closed');
        fitnessStatusElement.textContent = 'Open';
        fitnessStatusElement.className = 'status-indicator';
    } else {
        fitnessSection.classList.add('booking-closed');
        fitnessStatusElement.textContent = 'Closed';
        fitnessStatusElement.className = 'status-indicator closed';
    }
    
    // Update main status display
    const statusElement = document.getElementById('booking-status');
    if (bookingStatus.padel && bookingStatus.fitness) {
        statusElement.textContent = 'Booking Open';
        statusElement.className = '';
    } else if (!bookingStatus.padel && !bookingStatus.fitness) {
        statusElement.textContent = 'Booking Closed';
        statusElement.className = 'closed';
    } else {
        statusElement.textContent = 'Partial Booking';
        statusElement.className = 'partial';
    }
}

// Add booking to a slot
async function addBooking(slotId) {
    const slotType = slotId.includes('padel') ? 'padel' : 'fitness';
    
    if (!bookingStatus[slotType]) {
        alert(`${slotType.charAt(0).toUpperCase() + slotType.slice(1)} booking is currently closed.`);
        return;
    }
    
    const slot = document.querySelector(`[data-slot="${slotId}"]`);
    const nameInput = slot.querySelector('.name-input');
    const name = nameInput.value.trim();
    
    if (!name) {
        alert('Please enter your name.');
        nameInput.focus();
        return;
    }
    
    try {
        // Try to add booking via server API
        const response = await fetch('/api/book', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ slot_id: slotId, name: name })
        });
        
        const result = await response.json();
        
        if (result.success) {
            nameInput.value = '';
            // Reload data from server to get updated state
            await loadBookingData();
            
            const listType = result.list_type === 'reserve' ? 'reserve list' : 'confirmed booking';
            alert(`${name} has been added to the ${listType} for ${slotType}.`);
        } else {
            alert(result.message || 'Failed to add booking.');
        }
    } catch (error) {
        console.log('Server not available, using localStorage fallback');
        // Fallback to localStorage logic
        
        // Check if name already exists in this slot
        if (bookingData[slotId].booked.includes(name) || bookingData[slotId].reserve.includes(name)) {
            alert('This name is already registered for this slot.');
            nameInput.value = '';
            return;
        }
        
        // Add to booked list or reserve list
        if (bookingData[slotId].booked.length < bookingData[slotId].maxCapacity) {
            bookingData[slotId].booked.push(name);
        } else {
            bookingData[slotId].reserve.push(name);
        }
        
        nameInput.value = '';
        updateSlot(slotId);
        saveBookingData();
        
        // Show success message
        const isReserve = bookingData[slotId].booked.length > bookingData[slotId].maxCapacity;
        
        if (isReserve) {
            alert(`${name} has been added to the reserve list for ${slotType}.`);
        } else {
            alert(`${name} has been successfully booked for ${slotType}.`);
        }
    }
}

// Update a specific slot display
function updateSlot(slotId) {
    const slot = document.querySelector(`[data-slot="${slotId}"]`);
    const data = bookingData[slotId];
    
    // Update available spots
    const availableSpots = slot.querySelector('.available-spots');
    const remaining = Math.max(0, data.maxCapacity - data.booked.length);
    availableSpots.textContent = `${remaining} spots available`;
    
    // Update reserve count
    const reserveCount = slot.querySelector('.reserve-count');
    reserveCount.textContent = `${data.reserve.length} on reserve`;
    
    // Update booked players list
    const playersList = slot.querySelector('.players-list');
    playersList.innerHTML = '';
    data.booked.forEach(name => {
        const li = document.createElement('li');
        li.textContent = name;
        playersList.appendChild(li);
    });
    
    // Update reserve list
    const reserveList = slot.querySelector('.reserve-list');
    const reservePlayersList = slot.querySelector('.reserve-players-list');
    
    if (data.reserve.length > 0) {
        reserveList.style.display = 'block';
        reservePlayersList.innerHTML = '';
        data.reserve.forEach(name => {
            const li = document.createElement('li');
            li.textContent = name;
            reservePlayersList.appendChild(li);
        });
    } else {
        reserveList.style.display = 'none';
    }
    
    // Update slot styling
    if (data.booked.length >= data.maxCapacity) {
        slot.classList.add('full');
        availableSpots.textContent = 'FULL';
    } else {
        slot.classList.remove('full');
    }
    
    // Add click-to-cancel functionality
    data.booked.forEach((name, index) => {
        const li = playersList.children[index];
        if (li) {
            li.style.cursor = 'pointer';
            li.title = 'Click to cancel booking';
            li.style.userSelect = 'none';
            li.classList.add('clickable-name');
            // Remove any existing event listeners
            li.replaceWith(li.cloneNode(true));
            const newLi = playersList.children[index];
            newLi.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                cancelBooking(slotId, name, 'booked');
            });
        }
    });
    
    data.reserve.forEach((name, index) => {
        const li = reservePlayersList.children[index];
        if (li) {
            li.style.cursor = 'pointer';
            li.title = 'Click to cancel booking';
            li.style.userSelect = 'none';
            li.classList.add('clickable-name');
            // Remove any existing event listeners
            li.replaceWith(li.cloneNode(true));
            const newLi = reservePlayersList.children[index];
            newLi.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                cancelBooking(slotId, name, 'reserve');
            });
        }
    });
    
    // Disable booking if closed
    const button = slot.querySelector('.booking-form button');
    const input = slot.querySelector('.name-input');
    const slotType = slotId.includes('padel') ? 'padel' : 'fitness';
    
    if (!bookingStatus[slotType]) {
        button.disabled = true;
        input.disabled = true;
    } else {
        button.disabled = false;
        input.disabled = false;
    }
}

// Cancel a booking
async function cancelBooking(slotId, name, listType) {
    if (confirm(`Are you sure you want to cancel ${name}'s booking?`)) {
        try {
            // Try to cancel booking via server API
            const response = await fetch('/api/cancel', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ slot_id: slotId, name: name })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Reload data from server to get updated state
                await loadBookingData();
                alert(`${name}'s booking has been cancelled.`);
            } else {
                alert(result.message || 'Failed to cancel booking.');
            }
        } catch (error) {
            console.log('Server not available, using localStorage fallback');
            // Fallback to localStorage logic
            const data = bookingData[slotId];
            
            if (listType === 'booked') {
                const index = data.booked.indexOf(name);
                if (index > -1) {
                    data.booked.splice(index, 1);
                    
                    // Move first person from reserve to booked if available
                    if (data.reserve.length > 0) {
                        const reserveName = data.reserve.shift();
                        data.booked.push(reserveName);
                    }
                }
            } else if (listType === 'reserve') {
                const index = data.reserve.indexOf(name);
                if (index > -1) {
                    data.reserve.splice(index, 1);
                }
            }
            
            updateSlot(slotId);
            saveBookingData();
            alert(`${name}'s booking has been cancelled.`);
        }
    }
}

// Update all slots
function updateAllSlots() {
    Object.keys(bookingData).forEach(slotId => {
        updateSlot(slotId);
    });
}

// Authenticate admin
function authenticateAdmin() {
    const password = prompt('Enter admin password:');
    if (password === ADMIN_PASSWORD) {
        isAdminAuthenticated = true;
        return true;
    } else if (password !== null) {
        alert('Incorrect password. Access denied.');
    }
    return false;
}

// Toggle admin panel
function toggleAdmin() {
    const adminPanel = document.getElementById('admin-panel');
    
    if (adminPanel.style.display === 'none' || !adminPanel.style.display) {
        // Opening admin panel - check authentication
        if (!isAdminAuthenticated) {
            if (!authenticateAdmin()) {
                return; // Exit if authentication failed
            }
        }
        adminPanel.style.display = 'flex';
    } else {
        // Closing admin panel - reset authentication
        adminPanel.style.display = 'none';
        isAdminAuthenticated = false;
    }
}

// Toggle padel booking status
function togglePadelBooking() {
    bookingStatus.padel = !bookingStatus.padel;
    updateBookingStatus();
    updateAllSlots();
    saveBookingData();
    
    const status = bookingStatus.padel ? 'opened' : 'closed';
    alert(`Padel booking has been ${status}.`);
}

// Toggle fitness booking status
function toggleFitnessBooking() {
    bookingStatus.fitness = !bookingStatus.fitness;
    updateBookingStatus();
    updateAllSlots();
    saveBookingData();
    
    const status = bookingStatus.fitness ? 'opened' : 'closed';
    alert(`Fitness booking has been ${status}.`);
}

// Clear all bookings
async function clearAllBookings() {
    if (confirm('Are you sure you want to clear all bookings? This action cannot be undone.')) {
        try {
            // Try to clear bookings via server API
            const response = await fetch('/api/clear', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Reload data from server to get updated state
                await loadBookingData();
                alert('All bookings have been cleared.');
            } else {
                alert('Failed to clear bookings.');
            }
        } catch (error) {
            console.log('Server not available, using localStorage fallback');
            // Fallback to localStorage logic
            Object.keys(bookingData).forEach(slotId => {
                bookingData[slotId].booked = [];
                bookingData[slotId].reserve = [];
            });
            updateAllSlots();
            saveBookingData();
            alert('All bookings have been cleared.');
        }
    }
}

// Generate WhatsApp message for Padel
function generatePadelMessage() {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    let message = `🏓 FOBC Padel Booking - ${dateStr}\n\n`;
    
    const padelSlots = [
        { id: 'padel-1', time: '6:30 AM - 7:30 AM' },
        { id: 'padel-2', time: '7:30 AM - 8:30 AM' },
        { id: 'padel-3', time: '8:30 AM - 9:30 AM' }
    ];
    
    padelSlots.forEach(slot => {
        const data = bookingData[slot.id];
        message += `⏰ ${slot.time}\n`;
        message += `👥 Confirmed (${data.booked.length}/${data.maxCapacity}):\n`;
        
        if (data.booked.length > 0) {
            data.booked.forEach((name, index) => {
                message += `${index + 1}. ${name}\n`;
            });
        } else {
            message += `No bookings yet\n`;
        }
        
        if (data.reserve.length > 0) {
            message += `\n📋 Reserve List (${data.reserve.length}):\n`;
            data.reserve.forEach((name, index) => {
                message += `${index + 1}. ${name}\n`;
            });
        }
        
        message += `\n`;
    });
    
    message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `📱 Friends of Brighton College Dubai\n`;
    message += `🏓 Padel Club\n\n`;
    message += `Please arrive 10 minutes before your session time.\n`;
    message += `For any changes, please contact the admin.`;
    
    document.getElementById('generated-message').value = message;
}

// Generate WhatsApp message for Fitness
function generateFitnessMessage() {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    let message = `💪 FOBC Fitness Booking - ${dateStr}\n\n`;
    
    const fitnessData = bookingData['fitness-1'];
    message += `👥 Confirmed (${fitnessData.booked.length}/${fitnessData.maxCapacity}):\n`;
    
    if (fitnessData.booked.length > 0) {
        fitnessData.booked.forEach((name, index) => {
            message += `${index + 1}. ${name}\n`;
        });
    } else {
        message += `No bookings yet\n`;
    }
    
    if (fitnessData.reserve.length > 0) {
        message += `\n📋 Reserve List (${fitnessData.reserve.length}):\n`;
        fitnessData.reserve.forEach((name, index) => {
            message += `${index + 1}. ${name}\n`;
        });
    }
    
    message += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `📱 Friends of Brighton College Dubai\n`;
    message += `💪 Fitness Club\n\n`;
    message += `Please arrive 10 minutes before your session time.\n`;
    message += `For any changes, please contact the admin.`;
    
    document.getElementById('generated-message').value = message;
}

// Generate combined WhatsApp message
function generateMessage() {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    let message = `🏓 FOBC Booking Summary - ${dateStr}\n\n`;
    
    // Padel bookings
    message += `🏓 PADEL BOOKINGS:\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    const padelSlots = [
        { id: 'padel-1', time: '6:30 AM - 7:30 AM' },
        { id: 'padel-2', time: '7:30 AM - 8:30 AM' },
        { id: 'padel-3', time: '8:30 AM - 9:30 AM' }
    ];
    
    padelSlots.forEach(slot => {
        const data = bookingData[slot.id];
        message += `⏰ ${slot.time}\n`;
        message += `👥 Confirmed (${data.booked.length}/${data.maxCapacity}):\n`;
        
        if (data.booked.length > 0) {
            data.booked.forEach((name, index) => {
                message += `${index + 1}. ${name}\n`;
            });
        } else {
            message += `No bookings yet\n`;
        }
        
        if (data.reserve.length > 0) {
            message += `\n📋 Reserve List (${data.reserve.length}):\n`;
            data.reserve.forEach((name, index) => {
                message += `${index + 1}. ${name}\n`;
            });
        }
        
        message += `\n`;
    });
    
    // Fitness bookings
    message += `💪 FITNESS BOOKINGS:\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    const fitnessData = bookingData['fitness-1'];
    message += `👥 Confirmed (${fitnessData.booked.length}/${fitnessData.maxCapacity}):\n`;
    
    if (fitnessData.booked.length > 0) {
        fitnessData.booked.forEach((name, index) => {
            message += `${index + 1}. ${name}\n`;
        });
    } else {
        message += `No bookings yet\n`;
    }
    
    if (fitnessData.reserve.length > 0) {
        message += `\n📋 Reserve List (${fitnessData.reserve.length}):\n`;
        fitnessData.reserve.forEach((name, index) => {
            message += `${index + 1}. ${name}\n`;
        });
    }
    
    message += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `📱 Friends of Brighton College Dubai\n`;
    message += `🏓 Padel & Fitness Club\n\n`;
    message += `Please arrive 10 minutes before your session time.\n`;
    message += `For any changes, please contact the admin.`;
    
    document.getElementById('generated-message').value = message;
}

// Generate email format
function generateEmail() {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    let message = `Subject: FOBC Booking Summary - ${dateStr}\n\n`;
    message += `Dear FOBC Members,\n\n`;
    message += `Please find below the booking summary for ${dateStr}:\n\n`;
    
    // Padel bookings
    message += `PADEL BOOKINGS:\n`;
    message += `================\n\n`;
    
    const padelSlots = [
        { id: 'padel-1', time: '6:30 AM - 7:30 AM' },
        { id: 'padel-2', time: '7:30 AM - 8:30 AM' },
        { id: 'padel-3', time: '8:30 AM - 9:30 AM' }
    ];
    
    padelSlots.forEach(slot => {
        const data = bookingData[slot.id];
        message += `Time Slot: ${slot.time}\n`;
        message += `Confirmed Players (${data.booked.length}/${data.maxCapacity}):\n`;
        
        if (data.booked.length > 0) {
            data.booked.forEach((name, index) => {
                message += `  ${index + 1}. ${name}\n`;
            });
        } else {
            message += `  No bookings yet\n`;
        }
        
        if (data.reserve.length > 0) {
            message += `\nReserve List (${data.reserve.length}):\n`;
            data.reserve.forEach((name, index) => {
                message += `  ${index + 1}. ${name}\n`;
            });
        }
        
        message += `\n`;
    });
    
    // Fitness bookings
    message += `FITNESS BOOKINGS:\n`;
    message += `=================\n\n`;
    
    const fitnessData = bookingData['fitness-1'];
    message += `Confirmed Members (${fitnessData.booked.length}/${fitnessData.maxCapacity}):\n`;
    
    if (fitnessData.booked.length > 0) {
        fitnessData.booked.forEach((name, index) => {
            message += `  ${index + 1}. ${name}\n`;
        });
    } else {
        message += `  No bookings yet\n`;
    }
    
    if (fitnessData.reserve.length > 0) {
        message += `\nReserve List (${fitnessData.reserve.length}):\n`;
        fitnessData.reserve.forEach((name, index) => {
            message += `  ${index + 1}. ${name}\n`;
        });
    }
    
    message += `\n================\n\n`;
    message += `Important Reminders:\n`;
    message += `• Please arrive 10 minutes before your session time\n`;
    message += `• Bring appropriate sports attire and equipment\n`;
    message += `• For any changes or cancellations, please contact the admin immediately\n\n`;
    message += `Best regards,\n`;
    message += `Friends of Brighton College Dubai\n`;
    message += `Padel & Fitness Club Administration`;
    
    document.getElementById('generated-message').value = message;
}

// Copy message to clipboard
function copyMessage() {
    const messageTextarea = document.getElementById('generated-message');
    messageTextarea.select();
    messageTextarea.setSelectionRange(0, 99999); // For mobile devices
    
    try {
        document.execCommand('copy');
        alert('Message copied to clipboard!');
    } catch (err) {
        // Fallback for modern browsers
        navigator.clipboard.writeText(messageTextarea.value).then(() => {
            alert('Message copied to clipboard!');
        }).catch(() => {
            alert('Failed to copy message. Please copy manually.');
        });
    }
}

// Handle Enter key in name inputs
document.addEventListener('DOMContentLoaded', function() {
    loadBookingData();
    
    // Add event listeners for Enter key
    document.querySelectorAll('.name-input').forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const slot = this.closest('.time-slot');
                const slotId = slot.getAttribute('data-slot');
                addBooking(slotId);
            }
        });
    });
    
    // Close admin panel when clicking outside
    document.getElementById('admin-panel').addEventListener('click', function(e) {
        if (e.target === this) {
            toggleAdmin();
        }
    });
});

// Auto-save every 30 seconds
setInterval(saveBookingData, 30000);
