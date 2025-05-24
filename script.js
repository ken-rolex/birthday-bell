// Authentication and User Management
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.users = JSON.parse(localStorage.getItem('birthdayBell_users')) || {};
        this.init();
    }

    init() {
        // Check if user is already logged in
        const savedSession = localStorage.getItem('birthdayBell_session');
        if (savedSession) {
            const session = JSON.parse(savedSession);
            if (this.isValidSession(session)) {
                this.currentUser = session.user;
                this.showMainApp();
                return;
            }
        }
        this.showAuthOverlay();
    }

    isValidSession(session) {
        // Check if session is valid (not expired, user exists)
        const now = new Date().getTime();
        return session.expires > now && this.users[session.user.email];
    }

    // Simple password hashing (Note: In production, use proper server-side hashing)
    hashPassword(password) {
        // This is a simple hash for demo purposes
        // In production, use bcrypt or similar on the server
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36);
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    validatePassword(password) {
        return password.length >= 6;
    }

    signup(name, email, password, confirmPassword) {
        // Validation
        if (!name.trim()) {
            this.showError('Please enter your full name');
            return false;
        }

        if (!this.validateEmail(email)) {
            this.showError('Please enter a valid email address');
            return false;
        }

        if (!this.validatePassword(password)) {
            this.showError('Password must be at least 6 characters long');
            return false;
        }

        if (password !== confirmPassword) {
            this.showError('Passwords do not match');
            return false;
        }

        if (this.users[email]) {
            this.showError('An account with this email already exists');
            return false;
        }

        // Create new user
        const hashedPassword = this.hashPassword(password);
        const user = {
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            createdAt: new Date().toISOString(),
            birthdays: [],
            friends: [],
            messages: []
        };

        this.users[email] = user;
        localStorage.setItem('birthdayBell_users', JSON.stringify(this.users));

        this.showSuccess('Account created successfully! Please sign in.');
        setTimeout(() => switchToLogin(), 1500);
        return true;
    }

    login(email, password) {
        // Validation
        if (!this.validateEmail(email)) {
            this.showError('Please enter a valid email address');
            return false;
        }

        if (!password) {
            this.showError('Please enter your password');
            return false;
        }

        const user = this.users[email.toLowerCase().trim()];
        if (!user) {
            this.showError('No account found with this email address');
            return false;
        }

        const hashedPassword = this.hashPassword(password);
        if (user.password !== hashedPassword) {
            this.showError('Incorrect password');
            return false;
        }

        // Login successful
        this.currentUser = user;
        this.createSession();
        this.showSuccess('Welcome back!');
        setTimeout(() => this.showMainApp(), 1000);
        return true;
    }

    createSession() {
        const session = {
            user: this.currentUser,
            expires: new Date().getTime() + (7 * 24 * 60 * 60 * 1000) // 7 days
        };
        localStorage.setItem('birthdayBell_session', JSON.stringify(session));
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('birthdayBell_session');
        this.showAuthOverlay();
        this.showSuccess('Logged out successfully');
    }

    showAuthOverlay() {
        document.getElementById('authOverlay').style.display = 'flex';
        document.getElementById('mainApp').style.display = 'none';
    }

    showMainApp() {
        document.getElementById('authOverlay').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        
        // Update welcome message
        const welcomeUser = document.getElementById('welcomeUser');
        welcomeUser.textContent = `Welcome back, ${this.currentUser.name}!`;
        
        // Load user data
        this.loadUserData();
    }

    loadUserData() {
        // Load user's birthdays, friends, and messages
        birthdayManager.birthdays = this.currentUser.birthdays || [];
        friendManager.friends = this.currentUser.friends || [];
        messageManager.messages = this.currentUser.messages || [];
        
        // Refresh displays
        birthdayManager.displayBirthdays();
        friendManager.displayFriends();
        messageManager.displayMessages();
        messageManager.updateFriendDropdown();
    }

    saveUserData() {
        if (this.currentUser) {
            this.currentUser.birthdays = birthdayManager.birthdays;
            this.currentUser.friends = friendManager.friends;
            this.currentUser.messages = messageManager.messages;
            
            this.users[this.currentUser.email] = this.currentUser;
            localStorage.setItem('birthdayBell_users', JSON.stringify(this.users));
        }
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type) {
        // Remove existing notifications
        const existing = document.querySelector('.auth-notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = `auth-notification ${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">×</button>
        `;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? 'linear-gradient(135deg, #ff6b6b, #ee5a24)' : 'linear-gradient(135deg, #00d2d3, #54a0ff)'};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 15px;
            font-weight: 500;
            animation: slideInRight 0.3s ease-out;
        `;

        notification.querySelector('button').style.cssText = `
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            width: 25px;
            height: 25px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            font-weight: bold;
        `;

        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
}

// Birthday Management
class BirthdayManager {
    constructor() {
        this.birthdays = [];
        this.currentFilter = 'name';
    }

    addBirthday(name, date) {
        if (!name.trim() || !date) {
            authManager.showError('Please fill in all fields');
            return false;
        }

        const birthday = {
            id: Date.now(),
            name: name.trim(),
            date: date,
            addedAt: new Date().toISOString()
        };

        this.birthdays.push(birthday);
        authManager.saveUserData();
        this.displayBirthdays();
        this.clearForm();
        this.createConfetti();
        authManager.showSuccess(`Birthday added for ${name}!`);
        return true;
    }

    displayBirthdays() {
        const container = document.getElementById('birthdaysList');
        if (!container) return;

        if (this.birthdays.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.6); padding: 20px;">No birthdays added yet. Add your first birthday above!</p>';
            return;
        }

        const sortedBirthdays = this.getSortedBirthdays();
        container.innerHTML = sortedBirthdays.map(birthday => `
            <div class="birthday-item">
                <h3>${birthday.name}</h3>
                <p>🎂 ${this.formatDate(birthday.date)}</p>
                <p>⏰ ${this.getDaysUntilBirthday(birthday.date)}</p>
            </div>
        `).join('');
    }

    getSortedBirthdays() {
        const sorted = [...this.birthdays];
        
        switch (this.currentFilter) {
            case 'name':
                return sorted.sort((a, b) => a.name.localeCompare(b.name));
            case 'date':
                return sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
            case 'upcoming':
                return sorted.filter(birthday => {
                    const days = this.getDaysUntilBirthdayNumber(birthday.date);
                    return days <= 30;
                }).sort((a, b) => this.getDaysUntilBirthdayNumber(a.date) - this.getDaysUntilBirthdayNumber(b.date));
            default:
                return sorted;
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric',
            year: 'numeric'
        });
    }

    getDaysUntilBirthday(dateString) {
        const today = new Date();
        const birthday = new Date(dateString);
        const thisYear = today.getFullYear();
        
        // Set birthday to this year
        birthday.setFullYear(thisYear);
        
        // If birthday has passed this year, set to next year
        if (birthday < today) {
            birthday.setFullYear(thisYear + 1);
        }
        
        const diffTime = birthday - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return "🎉 Today!";
        } else if (diffDays === 1) {
            return "🎈 Tomorrow!";
        } else {
            return `📅 ${diffDays} days to go`;
        }
    }

    getDaysUntilBirthdayNumber(dateString) {
        const today = new Date();
        const birthday = new Date(dateString);
        const thisYear = today.getFullYear();
        
        birthday.setFullYear(thisYear);
        if (birthday < today) {
            birthday.setFullYear(thisYear + 1);
        }
        
        const diffTime = birthday - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    clearForm() {
        document.getElementById('name').value = '';
        document.getElementById('birthday').value = '';
    }

    createConfetti() {
        const container = document.getElementById('confetti-container');
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'];
        
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = Math.random() * 3 + 's';
            confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
            container.appendChild(confetti);
            
            setTimeout(() => confetti.remove(), 5000);
        }
    }
}

// Friend Management
class FriendManager {
    constructor() {
        this.friends = [];
        this.currentFilter = 'name';
    }

    addFriend(name, phone, whatsapp, dob, photo) {
        if (!name.trim() || !phone.trim() || !dob) {
            authManager.showError('Please fill in all required fields');
            return false;
        }

        const friend = {
            id: Date.now(),
            name: name.trim(),
            phone: phone.trim(),
            whatsapp: whatsapp.trim() || phone.trim(),
            dob: dob,
            photo: photo,
            addedAt: new Date().toISOString()
        };

        this.friends.push(friend);
        authManager.saveUserData();
        this.displayFriends();
        this.clearForm();
        this.createConfetti();
        messageManager.updateFriendDropdown();
        authManager.showSuccess(`Friend ${name} added successfully!`);
        return true;
    }

    displayFriends() {
        const container = document.getElementById('friendsList');
        if (!container) return;

        if (this.friends.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.6); padding: 20px;">No friends added yet. Add your first friend above!</p>';
            return;
        }

        const sortedFriends = this.getSortedFriends();
        container.innerHTML = sortedFriends.map(friend => `
            <div class="friend-item">
                ${friend.photo ? `<img src="${friend.photo}" alt="${friend.name}" class="friend-photo">` : '<div class="friend-photo" style="background: linear-gradient(135deg, #667eea, #764ba2); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">${friend.name.charAt(0)}</div>'}
                <div class="friend-info">
                    <h3>${friend.name}</h3>
                    <p>📞 ${friend.phone}</p>
                    <p>💬 ${friend.whatsapp}</p>
                    <p>🎂 ${this.formatDate(friend.dob)}</p>
                </div>
                <div class="friend-actions">
                    <button class="action-btn whatsapp-action" onclick="friendManager.openWhatsApp('${friend.whatsapp}', '${friend.name}')">
                        WhatsApp
                    </button>
                </div>
            </div>
        `).join('');
    }

    getSortedFriends() {
        const sorted = [...this.friends];
        
        switch (this.currentFilter) {
            case 'name':
                return sorted.sort((a, b) => a.name.localeCompare(b.name));
            case 'birthday':
                return sorted.sort((a, b) => new Date(a.dob) - new Date(b.dob));
            case 'recent':
                return sorted.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
            default:
                return sorted;
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric'
        });
    }

    openWhatsApp(number, name) {
        const message = `Hi ${name}! 👋`;
        const url = `https://api.whatsapp.com/send/?phone=${number}&text=${encodeURIComponent(message)}&type=phone_number&app_absent=0`;
        window.open(url, '_blank');
    }

    clearForm() {
        document.getElementById('friendName').value = '';
        document.getElementById('friendPhone').value = '';
        document.getElementById('friendWhatsApp').value = '';
        document.getElementById('friendDOB').value = '';
        document.getElementById('friendPhoto').value = '';
    }

    createConfetti() {
        const container = document.getElementById('confetti-container');
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'];
        
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = Math.random() * 3 + 's';
            confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
            container.appendChild(confetti);
            
            setTimeout(() => confetti.remove(), 5000);
        }
    }
}

// Message Management
class MessageManager {
    constructor() {
        this.messages = [];
        this.currentFilter = 'recent';
        this.templates = {
            template1: "🎉 Happy Birthday! Hope you have a wonderful day filled with happiness and joy! 🎂",
            template2: "Wishing you a very Happy Birthday! 🎈 May all your dreams come true! ✨",
            template3: "🎂 Another year of amazing memories! Happy Birthday! 🎉",
            template4: "Happy Birthday! 🎊 May this new year bring you lots of love and laughter! 💕"
        };
    }

    updateFriendDropdown() {
        const dropdown = document.getElementById('selectFriend');
        if (!dropdown) return;

        dropdown.innerHTML = '<option value="">Choose a friend...</option>';
        
        friendManager.friends.forEach(friend => {
            const option = document.createElement('option');
            option.value = friend.id;
            option.textContent = friend.name;
            dropdown.appendChild(option);
        });
    }

    useTemplate() {
        const templateSelect = document.getElementById('messageTemplate');
        const messageText = document.getElementById('messageText');
        
        if (templateSelect.value && this.templates[templateSelect.value]) {
            messageText.value = this.templates[templateSelect.value];
        }
    }

    sendWhatsAppMessage() {
        const friendId = document.getElementById('selectFriend').value;
        const message = document.getElementById('messageText').value.trim();

        if (!friendId) {
            authManager.showError('Please select a friend');
            return;
        }

        if (!message) {
            authManager.showError('Please enter a message');
            return;
        }

        const friend = friendManager.friends.find(f => f.id == friendId);
        if (!friend) {
            authManager.showError('Friend not found');
            return;
        }

        // Save message to history
        const messageRecord = {
            id: Date.now(),
            friendId: friendId,
            friendName: friend.name,
            message: message,
            type: 'whatsapp',
            timestamp: new Date().toISOString()
        };

        this.messages.push(messageRecord);
        authManager.saveUserData();
        this.displayMessages();

        // Open WhatsApp
        const url = `https://api.whatsapp.com/send/?phone=${friend.whatsapp}&text=${encodeURIComponent(message)}&type=phone_number&app_absent=0`;
        window.open(url, '_blank');

        // Clear form
        document.getElementById('messageText').value = '';
        document.getElementById('messageTemplate').value = '';
        
        authManager.showSuccess(`WhatsApp message sent to ${friend.name}!`);
    }

    sendSMSMessage() {
        const friendId = document.getElementById('selectFriend').value;
        const message = document.getElementById('messageText').value.trim();

        if (!friendId) {
            authManager.showError('Please select a friend');
            return;
        }

        if (!message) {
            authManager.showError('Please enter a message');
            return;
        }

        const friend = friendManager.friends.find(f => f.id == friendId);
        if (!friend) {
            authManager.showError('Friend not found');
            return;
        }

        // Save message to history
        const messageRecord = {
            id: Date.now(),
            friendId: friendId,
            friendName: friend.name,
            message: message,
            type: 'sms',
            timestamp: new Date().toISOString()
        };

        this.messages.push(messageRecord);
        authManager.saveUserData();
        this.displayMessages();

        // Open SMS (this will work on mobile devices)
        const smsUrl = `sms:${friend.phone}?body=${encodeURIComponent(message)}`;
        window.open(smsUrl);

        // Clear form
        document.getElementById('messageText').value = '';
        document.getElementById('messageTemplate').value = '';
        
        authManager.showSuccess(`SMS prepared for ${friend.name}!`);
    }

    displayMessages() {
        const container = document.getElementById('messageHistory');
        if (!container) return;

        if (this.messages.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.6); padding: 20px;">No messages sent yet. Send your first birthday wish above!</p>';
            return;
        }

        const filteredMessages = this.getFilteredMessages();
        container.innerHTML = filteredMessages.map(msg => `
            <div class="message-item">
                <div class="message-header">
                    <span class="message-recipient">${msg.friendName}</span>
                    <span class="message-type ${msg.type}">${msg.type.toUpperCase()}</span>
                </div>
                <div class="message-content">${msg.message}</div>
                <div class="message-time">${this.formatTimestamp(msg.timestamp)}</div>
            </div>
        `).join('');
    }

    getFilteredMessages() {
        const sorted = [...this.messages];
        
        switch (this.currentFilter) {
            case 'recent':
                return sorted.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            case 'whatsapp':
                return sorted.filter(msg => msg.type === 'whatsapp').sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            case 'sms':
                return sorted.filter(msg => msg.type === 'sms').sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            default:
                return sorted.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        }
    }

    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Global instances
let authManager, birthdayManager, friendManager, messageManager;

// Navigation function - make it global
window.showSection = function(index) {
    console.log('showSection called with index:', index);
    alert('showSection called with index: ' + index); // Debug alert
    
    try {
        const sections = ['birthdaysSection', 'friendsSection', 'messagesSection'];
        const navBtns = document.querySelectorAll('.nav-btn');
        
        console.log('Found sections:', sections);
        console.log('Found nav buttons:', navBtns.length);
        
        // Remove active class from all sections and nav buttons
        sections.forEach(section => {
            const element = document.getElementById(section);
            console.log('Section element:', section, element);
            if (element) {
                element.classList.remove('active');
            }
        });
        navBtns.forEach(btn => btn.classList.remove('active'));
        
        // Add active class to selected section and nav button
        if (navBtns[index]) {
            navBtns[index].classList.add('active');
        }
        const targetSection = document.getElementById(sections[index]);
        console.log('Target section:', sections[index], targetSection);
        if (targetSection) {
            targetSection.classList.add('active');
        }
        
        console.log('Section switched to:', sections[index]);
    } catch (error) {
        console.error('Error in showSection:', error);
        alert('Error: ' + error.message);
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing...');
    alert('DOM loaded!'); // Debug alert
    
    authManager = new AuthManager();
    
    // Add event listeners to navigation buttons
    const navBtns = document.querySelectorAll('.nav-btn');
    console.log('Found nav buttons:', navBtns.length);
    alert('Found nav buttons: ' + navBtns.length); // Debug alert
    
    navBtns.forEach((btn, index) => {
        btn.addEventListener('click', function() {
            console.log('Nav button clicked:', index);
            alert('Button clicked: ' + index); // Debug alert
            showSection(index);
        });
    });
    birthdayManager = new BirthdayManager();
    friendManager = new FriendManager();
    messageManager = new MessageManager();

    // Set up event listeners
    setupEventListeners();
});

function setupEventListeners() {
    // Auth form submissions
    document.getElementById('loginFormElement').addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        authManager.login(email, password);
    });

    document.getElementById('signupFormElement').addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        authManager.signup(name, email, password, confirmPassword);
    });

    // Navigation
    document.querySelectorAll('.nav-btn').forEach((btn, index) => {
        btn.addEventListener('click', () => switchSection(index));
    });

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const section = this.closest('.section').id;
            const filterType = this.textContent.toLowerCase().includes('name') ? 'name' :
                              this.textContent.toLowerCase().includes('date') ? 'date' :
                              this.textContent.toLowerCase().includes('upcoming') ? 'upcoming' :
                              this.textContent.toLowerCase().includes('birthday') ? 'birthday' :
                              this.textContent.toLowerCase().includes('recent') ? 'recent' :
                              this.textContent.toLowerCase().includes('whatsapp') ? 'whatsapp' :
                              this.textContent.toLowerCase().includes('sms') ? 'sms' : 'name';
            
            // Update active state
            this.parentElement.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Apply filter
            if (section === 'birthdaysSection') {
                birthdayManager.currentFilter = filterType;
                birthdayManager.displayBirthdays();
            } else if (section === 'friendsSection') {
                friendManager.currentFilter = filterType;
                friendManager.displayFriends();
            } else if (section === 'messagesSection') {
                messageManager.currentFilter = filterType;
                messageManager.displayMessages();
            }
        });
    });

    // File upload for friend photo
    document.getElementById('friendPhoto').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                // Store the base64 data
                document.getElementById('friendPhoto').dataset.photoData = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
}

// Authentication functions
function switchToSignup() {
    document.getElementById('loginForm').classList.remove('active');
    document.getElementById('signupForm').classList.add('active');
}

function switchToLogin() {
    document.getElementById('signupForm').classList.remove('active');
    document.getElementById('loginForm').classList.add('active');
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = input.nextElementSibling;
    
    if (input.type === 'password') {
        input.type = 'text';
        button.textContent = '🙈';
    } else {
        input.type = 'password';
        button.textContent = '👁️';
    }
}

function logout() {
    try {
        console.log('logout function called');
        if (!authManager) {
            console.error('authManager is not initialized');
            alert('Auth manager not initialized. Please refresh the page.');
            return;
        }
        authManager.logout();
    } catch (error) {
        console.error('Error in logout:', error);
        alert('Error logging out: ' + error.message);
    }
}



// Birthday functions
function addBirthday() {
    try {
        console.log('addBirthday function called');
        const name = document.getElementById('name').value;
        const birthday = document.getElementById('birthday').value;
        console.log('Name:', name, 'Birthday:', birthday);
        console.log('birthdayManager:', birthdayManager);
        
        if (!birthdayManager) {
            console.error('birthdayManager is not initialized');
            alert('Birthday manager not initialized. Please refresh the page.');
            return;
        }
        
        const result = birthdayManager.addBirthday(name, birthday);
        console.log('Add birthday result:', result);
    } catch (error) {
        console.error('Error in addBirthday:', error);
        alert('Error adding birthday: ' + error.message);
    }
}

function filterBirthdays(type) {
    birthdayManager.currentFilter = type;
    birthdayManager.displayBirthdays();
}

// Friend functions
function addFriend() {
    try {
        console.log('addFriend function called');
        const name = document.getElementById('friendName').value;
        const phone = document.getElementById('friendPhone').value;
        const whatsapp = document.getElementById('friendWhatsApp').value;
        const dob = document.getElementById('friendDOB').value;
        const photoData = document.getElementById('friendPhoto').dataset.photoData || null;
        
        console.log('Friend data:', { name, phone, whatsapp, dob });
        
        if (!friendManager) {
            console.error('friendManager is not initialized');
            alert('Friend manager not initialized. Please refresh the page.');
            return;
        }
        
        const result = friendManager.addFriend(name, phone, whatsapp, dob, photoData);
        console.log('Add friend result:', result);
    } catch (error) {
        console.error('Error in addFriend:', error);
        alert('Error adding friend: ' + error.message);
    }
}

function filterFriends(type) {
    friendManager.currentFilter = type;
    friendManager.displayFriends();
}

// Message functions
function useTemplate() {
    messageManager.useTemplate();
}

function sendWhatsAppMessage() {
    messageManager.sendWhatsAppMessage();
}

function sendSMSMessage() {
    messageManager.sendSMSMessage();
}

function filterMessages(type) {
    messageManager.currentFilter = type;
    messageManager.displayMessages();
}

// Add CSS animation for slideInRight
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);