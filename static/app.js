document.addEventListener('DOMContentLoaded', () => {
    const loginView = document.getElementById('login-view');
    const dashboardView = document.getElementById('dashboard-view');
    const loginForm = document.getElementById('login-form');
    const bookingForm = document.getElementById('booking-form');
    const bookingsList = document.getElementById('bookings-list');
    const logoutBtn = document.getElementById('logout-btn');
    const loginError = document.getElementById('login-error');
    const userRoleBadge = document.getElementById('user-role-badge');
    const adminNotice = document.getElementById('admin-notice');

    let token = localStorage.getItem('token');
    let isAdmin = localStorage.getItem('isAdmin') === 'true';

    if (token) {
        showDashboard();
    }
    // Login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        loginError.textContent = '';

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || 'Login failed');
            }

            const data = await res.json();
            token = data.token;
            isAdmin = data.is_admin;
            localStorage.setItem('token', token);
            localStorage.setItem('isAdmin', isAdmin);
            
            showDashboard();
        } catch (err) {
            loginError.textContent = err.message;
        }
    });

    // Logout
    logoutBtn.addEventListener('click', () => {
        token = null;
        isAdmin = false;
        localStorage.removeItem('token');
        localStorage.removeItem('isAdmin');
        showLogin();
    });

    // Create Booking
    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const startTimeInput = document.getElementById('start-time');
        const endTimeInput = document.getElementById('end-time');
        const start_time = startTimeInput.value;
        const end_time = endTimeInput.value;

        try {
            const res = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ start_time, end_time })
            });

            if (!res.ok) {
                if (res.status === 401) return handleUnauthorized();
                const data = await res.json().catch(() => ({}));
                throw new Error(data.detail || 'Failed to create booking');
            }

            startTimeInput.value = '';
            endTimeInput.value = '';
            fetchBookings(); // Refresh list
        } catch (err) {
            alert(err.message);
        }
    });

    function showLogin() {
        loginView.classList.add('active');
        dashboardView.classList.remove('active');
        loginForm.reset();
    }

    function showDashboard() {
        loginView.classList.remove('active');
        dashboardView.classList.add('active');
        
        userRoleBadge.textContent = isAdmin ? 'Admin' : 'User';
        adminNotice.style.display = isAdmin ? 'inline' : 'none';
        
        fetchBookings();
    }

    // Fetch Bookings
    async function fetchBookings() {
        try {
            const res = await fetch('/api/bookings', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                if (res.status === 401) return handleUnauthorized();
                throw new Error('Failed to fetch bookings');
            }

            const bookings = await res.json();
            renderBookings(bookings);
        } catch (err) {
            console.error(err);
        }
    }

    function renderBookings(bookings) {
        bookingsList.innerHTML = '';
        if (bookings.length === 0) {
            bookingsList.innerHTML = '<li style="justify-content: center; color: var(--text-muted)">No bookings found.</li>';
            return;
        }

        bookings.forEach(booking => {
            const li = document.createElement('li');
            li.style.flexDirection = 'column';
            li.style.alignItems = 'stretch';
            
            const rowDiv = document.createElement('div');
            rowDiv.style.display = 'flex';
            rowDiv.style.justifyContent = 'space-between';
            rowDiv.style.alignItems = 'center';

            const infoDiv = document.createElement('div');
            infoDiv.className = 'booking-info';
            infoDiv.innerHTML = `
                <strong>${booking.start_time} - ${booking.end_time}</strong>
                <small>Booked by: ${booking.username}</small>
            `;
            
            const actionsDiv = document.createElement('div');
            actionsDiv.style.display = 'flex';
            actionsDiv.style.gap = '0.5rem';

            const editBtn = document.createElement('button');
            editBtn.className = 'btn-secondary';
            editBtn.style.padding = '0.4rem 0.8rem';
            editBtn.style.fontSize = '0.85rem';
            editBtn.textContent = 'Edit';
            
            const delBtn = document.createElement('button');
            delBtn.className = 'btn-danger';
            delBtn.textContent = 'Cancel';
            delBtn.onclick = () => deleteBooking(booking.id);
            
            actionsDiv.appendChild(editBtn);
            actionsDiv.appendChild(delBtn);

            rowDiv.appendChild(infoDiv);
            rowDiv.appendChild(actionsDiv);
            li.appendChild(rowDiv);

            // Edit Form Div (Hidden by default)
            const editDiv = document.createElement('div');
            editDiv.style.display = 'none';
            editDiv.style.marginTop = '1rem';
            editDiv.style.paddingTop = '1rem';
            editDiv.style.borderTop = '1px solid var(--glass-border)';
            editDiv.innerHTML = `
                <div style="display: flex; gap: 1rem; margin-bottom: 0.5rem;">
                    <div style="flex: 1;">
                        <label style="font-size: 0.8rem">Start Time</label>
                        <input type="time" id="edit-start-${booking.id}" value="${booking.start_time}" style="width: 100%; padding: 0.4rem;">
                    </div>
                    <div style="flex: 1;">
                        <label style="font-size: 0.8rem">End Time</label>
                        <input type="time" id="edit-end-${booking.id}" value="${booking.end_time}" style="width: 100%; padding: 0.4rem;">
                    </div>
                </div>
                <button class="btn-primary" style="padding: 0.4rem; font-size: 0.85rem;" onclick="updateBooking('${booking.id}')">Save Changes</button>
            `;
            
            editBtn.onclick = () => {
                editDiv.style.display = editDiv.style.display === 'none' ? 'block' : 'none';
            };

            li.appendChild(editDiv);
            bookingsList.appendChild(li);
        });
    }

    window.updateBooking = async function(id) {
        const start_time = document.getElementById(`edit-start-${id}`).value;
        const end_time = document.getElementById(`edit-end-${id}`).value;
        
        try {
            const res = await fetch(`/api/bookings/${id}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ start_time, end_time })
            });

            if (!res.ok) {
                if (res.status === 401) return handleUnauthorized();
                const data = await res.json().catch(() => ({}));
                throw new Error(data.detail || 'Failed to update booking');
            }

            fetchBookings(); // Refresh list
        } catch (err) {
            alert(err.message);
        }
    }

    async function deleteBooking(id) {
        if (!confirm('Are you sure you want to cancel this booking?')) return;

        try {
            const res = await fetch(`/api/bookings/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                if (res.status === 401) return handleUnauthorized();
                throw new Error('Failed to delete booking');
            }

            fetchBookings();
        } catch (err) {
            alert(err.message);
        }
    }

    function handleUnauthorized() {
        token = null;
        localStorage.removeItem('token');
        localStorage.removeItem('isAdmin');
        showLogin();
        loginError.textContent = 'Session expired. Please login again.';
    }
});
