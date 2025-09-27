# FOBC Booking System

A comprehensive booking website for Friends of Brighton College Dubai Padel & Fitness Club with advanced admin controls and automatic scheduling.

## Features

### Padel Booking
- 3 time slots: 6:30-7:30 AM, 7:30-8:30 AM, 8:30-9:30 AM
- 12 places per slot with automatic reserve list
- Real-time availability display
- **Automatic closure**: Thursdays at 6:00 PM GST
- Independent booking control (can be opened/closed separately from fitness)

### Fitness Booking
- 1 fitness session with 20 places
- Automatic reserve list when full
- Real-time availability display
- **Automatic closure**: Wednesdays at 6:00 PM GST
- Independent booking control (can be opened/closed separately from padel)

### Enhanced Admin Features
- **Separate Booking Controls**: Toggle padel and fitness bookings independently
- **Multiple Message Formats**: 
  - Generate Padel-only WhatsApp messages
  - Generate Fitness-only WhatsApp messages
  - Generate Combined WhatsApp messages
  - Generate professional Email format
- **Easy Cancellation**: Click any name in booking lists to cancel
- **Smart Reserve Management**: Automatic promotion from reserve to confirmed when cancellations occur
- **Automatic Scheduling**: GST timezone-aware automatic closure
- **Clear All Bookings**: Reset all bookings with confirmation
- **Copy to Clipboard**: One-click message copying

## Deployment on Replit

1. **Create a new Repl:**
   - Go to [replit.com](https://replit.com)
   - Click "Create Repl"
   - Choose "Python" template (for server-side database support)
   - Name your repl (e.g., "fobc-booking")

2. **Upload files:**
   - Delete the default files in your repl
   - Upload all files from the FOBC directory:
     - `index.html`
     - `styles.css`
     - `script.js`
     - `server.py`
     - `logo.svg` / `logo.jpg`
     - `README.md`
     - `.replit` (configuration file)

3. **Run the server:**
   - Click the "Run" button
   - The Python server will start with database support
   - Your booking website will be live with cross-device synchronization
   - The SQLite database will be automatically created on first run

4. **Access the website:**
   - Use the provided Replit URL to access your booking system
   - All bookings will be synchronized across devices in real-time

## Usage Instructions

### For Members
1. Visit the booking website
2. Choose between Padel or Fitness sections
3. Select your preferred time slot (for Padel)
4. Enter your name and click "Book Slot"
5. You'll be added to the confirmed list or reserve list if the slot is full

### For Admins
1. Click the "Admin" button in the top right
2. **Enter admin password:** `Fobc2024@Adm` (change this in script.js for security)
3. **Booking Controls:**
   - **Toggle Padel Booking:** Open/close padel bookings independently
   - **Toggle Fitness Booking:** Open/close fitness bookings independently
   - **Clear All Bookings:** Reset all bookings (use with caution)

3. **Message Generation:**
   - **Generate Padel WhatsApp:** Create padel-only WhatsApp message
   - **Generate Fitness WhatsApp:** Create fitness-only WhatsApp message
   - **Generate Combined WhatsApp:** Create message for both padel and fitness
   - **Generate Email:** Create professional email format

4. **Admin Actions:**
   - **Copy Message:** Copy generated messages to clipboard
   - **Close Admin:** Close the admin panel

5. **Easy Cancellation:**
   - Click on any name in the booking lists to cancel that booking
   - Cancelled confirmed bookings automatically promote reserve list members

## Technical Details

- **Cross-Device Synchronization:** Server-side SQLite database enables booking persistence across all devices
- **Hybrid Storage:** Uses server API with localStorage fallback for offline functionality
- **Responsive Design:** Works on desktop, tablet, and mobile devices
- **Real-time Updates:** Booking counts and lists update immediately across all connected devices
- **Data Persistence:** Bookings are saved automatically to server database
- **Thread-Safe Operations:** Concurrent booking requests handled safely with database locking
- **REST API:** Full API backend for booking operations with CORS support

## Booking Rules

1. **Booking Schedule:** 
   - **Fitness:** Opens Saturday 12:00 PM GST, closes Wednesday 6:00 PM GST
   - **Padel:** Opens Sunday 12:00 PM GST, closes Thursday 6:00 PM GST
2. **Duplicate Prevention:** Same name cannot book the same slot twice
3. **Capacity Management:** 
   - Padel: 12 spots per time slot
   - Fitness: 20 spots total
4. **Reserve System:** Automatic overflow to reserve list when capacity is reached
5. **Automatic Closure:** System automatically closes bookings at scheduled times

## Message Formats

### WhatsApp Message
- Emoji-rich format suitable for WhatsApp groups
- Clear time slots and participant lists
- Professional club branding

### Email Format
- Formal email structure with subject line
- Detailed participant information
- Important reminders and contact information

## Customization

To customize for your club:

1. **Club Name:** Edit the header in `index.html`
2. **Time Slots:** Modify the time slots in `index.html` and `script.js`
3. **Capacity:** Change `maxCapacity` values in `script.js`
4. **Styling:** Update colors and fonts in `styles.css`
5. **Logo:** Replace `logo.svg` with your club's logo

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers

## Support

For technical support or customization requests, contact the development team.

---

**Friends of Brighton College Dubai**  
Padel & Fitness Club
