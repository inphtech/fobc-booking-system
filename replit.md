# FOBC Booking System

## Overview

FOBC Booking System is a comprehensive web application for managing padel and fitness bookings at Friends of Brighton College Dubai. The system features real-time availability tracking, automatic reserve list management, and timezone-aware scheduling with separate controls for padel and fitness activities. Built as a client-side application with local storage persistence, it includes robust admin functionality for booking management and multi-format message generation.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Single Page Application (SPA)**: Built with vanilla HTML, CSS, and JavaScript
- **Responsive Design**: Mobile-first approach using CSS Grid and Flexbox
- **Component-based Structure**: Modular sections for padel and fitness bookings
- **Real-time Updates**: Dynamic DOM manipulation for live booking status

### Data Management
- **Client-side Storage**: Uses localStorage for data persistence
- **State Management**: Centralized booking data object managing all slots and reservations
- **Data Structure**: Hierarchical organization with separate capacity limits and reserve lists

### Booking Logic
- **Capacity Management**: Fixed limits (12 for padel, 20 for fitness) with automatic overflow to reserve lists
- **Time Zone Handling**: GST (UTC+4) aware scheduling for automatic opening/closing
- **Dual Control System**: Independent booking controls for padel and fitness activities

### Security and Access Control
- **Admin Authentication**: Password-protected admin interface
- **Session Management**: Browser session-based admin state
- **Input Validation**: Client-side name validation and duplicate prevention

### User Interface Design
- **Modern Aesthetic**: Glass morphism effects with gradient backgrounds
- **Typography**: Inter font family for clean, professional appearance
- **Interactive Elements**: Hover effects, smooth transitions, and visual feedback
- **Admin Panel**: Hidden interface with booking controls and message generation

### Automation Features
- **Scheduled Operations**: Automatic booking closure based on day/time rules
- **Reserve Management**: Automatic promotion from reserve to confirmed status
- **Multi-format Output**: WhatsApp and email message generation with clipboard integration

## External Dependencies

### Frontend Libraries
- **Google Fonts**: Inter font family for typography
- **No framework dependencies**: Vanilla JavaScript implementation

### Browser APIs
- **localStorage API**: For client-side data persistence
- **Clipboard API**: For one-click message copying functionality
- **Date/Time APIs**: For GST timezone calculations and scheduling

### Hosting Platform
- **Replit**: Designed for deployment on Replit's web hosting platform
- **Static Assets**: SVG logo and CSS/JS files served directly

### Third-party Integrations
- **WhatsApp Integration**: Message format generation for WhatsApp sharing
- **Email Integration**: Professional email format generation
- **No external APIs**: Fully self-contained application without external service dependencies