#!/usr/bin/env python3
import http.server
import socketserver
import json
import os
import sqlite3
import urllib.parse
from datetime import datetime
import threading

class BookingDatabase:
    def __init__(self, db_path='bookings.db'):
        self.db_path = db_path
        self.init_database()
        self.lock = threading.Lock()
    
    def init_database(self):
        """Initialize the SQLite database with required tables"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Create bookings table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS bookings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                slot_id TEXT NOT NULL,
                name TEXT NOT NULL,
                list_type TEXT NOT NULL,  -- 'booked' or 'reserve'
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create booking_status table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS booking_status (
                id INTEGER PRIMARY KEY,
                padel_open BOOLEAN DEFAULT 1,
                fitness_open BOOLEAN DEFAULT 1,
                last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Insert default status if not exists
        cursor.execute('SELECT COUNT(*) FROM booking_status')
        if cursor.fetchone()[0] == 0:
            cursor.execute('INSERT INTO booking_status (padel_open, fitness_open) VALUES (1, 1)')
        
        conn.commit()
        conn.close()
    
    def get_all_bookings(self):
        """Get all bookings organized by slot"""
        with self.lock:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('SELECT slot_id, name, list_type FROM bookings ORDER BY timestamp')
            rows = cursor.fetchall()
            
            # Organize bookings by slot
            bookings = {
                'padel-1': {'booked': [], 'reserve': [], 'maxCapacity': 12},
                'padel-2': {'booked': [], 'reserve': [], 'maxCapacity': 12},
                'padel-3': {'booked': [], 'reserve': [], 'maxCapacity': 12},
                'fitness-1': {'booked': [], 'reserve': [], 'maxCapacity': 20}
            }
            
            for slot_id, name, list_type in rows:
                if slot_id in bookings:
                    bookings[slot_id][list_type].append(name)
            
            conn.close()
            return bookings
    
    def get_booking_status(self):
        """Get current booking status"""
        with self.lock:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('SELECT padel_open, fitness_open FROM booking_status ORDER BY id DESC LIMIT 1')
            row = cursor.fetchone()
            
            conn.close()
            return {'padel': bool(row[0]), 'fitness': bool(row[1])} if row else {'padel': True, 'fitness': True}
    
    def add_booking(self, slot_id, name):
        """Add a new booking"""
        with self.lock:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Check if name already exists in this slot
            cursor.execute('SELECT COUNT(*) FROM bookings WHERE slot_id = ? AND name = ?', (slot_id, name))
            if cursor.fetchone()[0] > 0:
                conn.close()
                return {'success': False, 'message': 'Name already exists in this slot'}
            
            # Get current bookings count
            cursor.execute('SELECT COUNT(*) FROM bookings WHERE slot_id = ? AND list_type = "booked"', (slot_id,))
            booked_count = cursor.fetchone()[0]
            
            # Determine capacity
            max_capacity = 20 if slot_id == 'fitness-1' else 12
            
            # Determine list type
            list_type = 'booked' if booked_count < max_capacity else 'reserve'
            
            # Add booking
            cursor.execute('INSERT INTO bookings (slot_id, name, list_type) VALUES (?, ?, ?)', 
                         (slot_id, name, list_type))
            
            conn.commit()
            conn.close()
            
            return {'success': True, 'list_type': list_type}
    
    def cancel_booking(self, slot_id, name):
        """Cancel a booking and promote from reserve if needed"""
        with self.lock:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Get the booking to cancel
            cursor.execute('SELECT list_type FROM bookings WHERE slot_id = ? AND name = ?', (slot_id, name))
            row = cursor.fetchone()
            
            if not row:
                conn.close()
                return {'success': False, 'message': 'Booking not found'}
            
            list_type = row[0]
            
            # Remove the booking
            cursor.execute('DELETE FROM bookings WHERE slot_id = ? AND name = ?', (slot_id, name))
            
            # If it was a booked slot, promote first reserve
            if list_type == 'booked':
                cursor.execute('SELECT name FROM bookings WHERE slot_id = ? AND list_type = "reserve" ORDER BY timestamp LIMIT 1', (slot_id,))
                reserve_row = cursor.fetchone()
                
                if reserve_row:
                    reserve_name = reserve_row[0]
                    cursor.execute('UPDATE bookings SET list_type = "booked" WHERE slot_id = ? AND name = ?', 
                                 (slot_id, reserve_name))
            
            conn.commit()
            conn.close()
            
            return {'success': True}
    
    def update_booking_status(self, padel_open, fitness_open):
        """Update booking status"""
        with self.lock:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('UPDATE booking_status SET padel_open = ?, fitness_open = ?, last_updated = CURRENT_TIMESTAMP', 
                         (padel_open, fitness_open))
            
            conn.commit()
            conn.close()
            
            return {'success': True}
    
    def clear_all_bookings(self):
        """Clear all bookings"""
        with self.lock:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('DELETE FROM bookings')
            
            conn.commit()
            conn.close()
            
            return {'success': True}

class BookingHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        self.db = BookingDatabase()
        super().__init__(*args, **kwargs)
    
    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        # Add Cache-Control headers
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()
    
    def do_OPTIONS(self):
        """Handle preflight requests"""
        self.send_response(200)
        self.end_headers()
    
    def do_GET(self):
        """Handle GET requests"""
        if self.path == '/':
            self.path = '/index.html'
        elif self.path == '/api/bookings':
            self.send_json_response(self.db.get_all_bookings())
            return
        elif self.path == '/api/status':
            self.send_json_response(self.db.get_booking_status())
            return
        
        return super().do_GET()
    
    def do_POST(self):
        """Handle POST requests"""
        if self.path == '/api/book':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            result = self.db.add_booking(data['slot_id'], data['name'])
            self.send_json_response(result)
            
        elif self.path == '/api/cancel':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            result = self.db.cancel_booking(data['slot_id'], data['name'])
            self.send_json_response(result)
            
        elif self.path == '/api/status':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            result = self.db.update_booking_status(data['padel'], data['fitness'])
            self.send_json_response(result)
            
        elif self.path == '/api/clear':
            result = self.db.clear_all_bookings()
            self.send_json_response(result)
            
        else:
            self.send_error(404)
    
    def send_json_response(self, data):
        """Send JSON response"""
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

if __name__ == "__main__":
    PORT = 5000
    HOST = "0.0.0.0"  # Allow all hosts for Replit proxy
    
    # Change to the directory containing the static files
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    with socketserver.TCPServer((HOST, PORT), BookingHTTPRequestHandler) as httpd:
        print(f"Server running at http://{HOST}:{PORT}/")
        print("Serving booking system with database backend...")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")
            httpd.shutdown()
