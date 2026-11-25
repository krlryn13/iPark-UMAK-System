# iPark UMAK

iPark UMAK is a web-based campus parking and vehicle sticker management system made for the University of Makati (UMak). It lets students and faculty check available parking slots in the HPSB Building (Levels 1 to 4), apply and pay for vehicle stickers online, request guest parking passes, and lets OHSO administrators review applications, view logs, and download PDF reports. It also supports an optional ESP32 parking gate diorama.

## Requirements

Before running the project on your laptop, please make sure these are installed:

- Node.js (version 18 or higher) - https://nodejs.org/
- XAMPP (for MySQL and phpMyAdmin) - https://www.apachefriends.org/
- Git - https://git-scm.com/

## How to Run Locally

### Step 1: Download the Project

Open a terminal (Command Prompt or PowerShell) and clone the repository:

```bash
git clone https://github.com/krlryn13/iPark-UMAK-System.git
cd iPark-UMAK-System
```

### Step 2: Create the Database

1. Open the XAMPP Control Panel.
2. Click Start on **MySQL** and **Apache** (Apache is only needed to open phpMyAdmin).
3. Open your browser and go to `http://localhost/phpmyadmin`.
4. Click **New** on the left sidebar.
5. Enter `ipark_umak` as the database name and click **Create**.

Leave the database empty. The tables, default admin account, and HPSB parking slots will be created automatically when you start the backend.

### Step 3: Put the .env Files

Our team will send the two `.env` files separately. Place them in these exact folders:

- Put the backend `.env` file inside the `backend` folder (`backend/.env`).
- Put the frontend `.env` file inside the `frontend` folder (`frontend/.env`).

If your local XAMPP uses the default MySQL settings, make sure these lines in `backend/.env` match your setup:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=ipark_umak
```

### Step 4: Install and Start the Backend

Open a terminal inside the `backend` folder and run:

```bash
cd backend
npm install
npm start
```

Wait until the terminal shows that the server is running on port 5000 and the database tables have been initialized. All tables, parking slots, and RFID/device tables are set up automatically on first startup.

Keep this terminal open while using the system.

### Step 5: Install and Start the Frontend

Open a new terminal inside the `frontend` folder and run:

```bash
cd frontend
npm install
npm run dev
```

Once it finishes starting, open your browser and go to:

- Website: `http://localhost:5173`
- Backend Server: `http://localhost:5000`
- phpMyAdmin: `http://localhost/phpmyadmin`

## Default Admin Account

A default administrator account is created automatically on first run:

- Email: `admin@umak.edu.ph`
- Password: `admin123`

## Optional: Connecting the ESP32 Parking Diorama

The website runs normally even without the hardware connected. If you want to test it with the physical ESP32 diorama:

1. Open `firmware/parking_diorama/parking_diorama.ino` in Arduino IDE.
2. Select **ESP32 Dev Module** as the board and make sure the `MFRC522`, `LiquidCrystal I2C`, and `ESP32Servo` libraries are installed.
3. Inside `firmware/parking_diorama/`, copy `config.example.h` and rename it to `config.h`.
4. Edit `config.h` with your 2.4 GHz Wi-Fi name, password, and your laptop's local IP address for `SERVER_HOST` (do not use `localhost`).
5. Make sure your laptop and the ESP32 are connected to the same Wi-Fi network, allow port `5000` through your firewall if prompted, and upload the code to the ESP32.

## Team Members

University of Makati - College of Computing and Information Sciences

- Robert Kenneth Valenzuela
- Karl Ryan Ricafort
- Gerard Angelo Acabado
