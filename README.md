# 🖱️ Mouse Heatmap Recorder

A real-time mouse movement tracking and heatmap visualization tool. Track your mouse movements across a webpage and generate beautiful heatmap visualizations to analyze user interaction patterns.

## ✨ Features

- **Real-time Mouse Tracking**: Track mouse movements in real-time through WebSocket connections
- **Start/Stop Recording**: Control when to start and stop recording mouse movements
- **Manual Heatmap Generation**: Generate heatmaps on-demand with timestamped filenames
- **Connection Status Monitoring**: Visual indicators showing the status of all WebSocket connections
- **Modern UI**: Clean, responsive interface with a navigation bar and status indicators

## 🏗️ Architecture

The project consists of three main components:

1. **Frontend (Browser)**: HTML/CSS/JavaScript client that tracks mouse movements
2. **Node.js Server**: Middleware server that bridges the browser and Python backend
3. **Python Backend**: Processes mouse data and generates heatmap visualizations

```
Browser → Node.js Server → Python Backend
   ↓           ↓                ↓
Mouse      WebSocket       Heatmap
Tracking   Proxy          Generation
```

## 📋 Prerequisites

- **Node.js** (v14 or higher)
- **Python** (3.8 or higher)
- **npm** (comes with Node.js)

## 🚀 Installation

### 1. Clone or navigate to the project directory

```bash
cd mouse-heatmap
```

### 2. Install Node.js dependencies

```bash
cd node
npm install
```

### 3. Install Python dependencies

```bash
cd ../python
pip install -r requirements.txt
```

Or install with user flag if you encounter permission issues:

```bash
pip install --user -r requirements.txt
```

## 🎯 Usage

### Starting the Servers

You need to run both servers simultaneously. Open two terminal windows:

#### Terminal 1 - Node.js Server

```bash
cd node
node server.js
```

You should see:
```
HTTP server on http://localhost:3000
Browser WS on ws://localhost:3001
```

#### Terminal 2 - Python Backend

```bash
cd python
python app.py
```

You should see:
```
Python WS on ws://localhost:5000
```

### Using the Application

1. **Open your browser** and navigate to `http://localhost:3000`

2. **Check Connection Status**: The top navigation bar shows:
   - Browser → Node.js connection status
   - Node.js → Python connection status

3. **Start Recording**: Click the "▶️ Start Recording" button

4. **Move Your Mouse**: Move your mouse around the webpage to record movements

5. **Stop Recording**: Click the "⏹️ Stop Recording" button when done

6. **Generate Heatmap**: Click the "🔥 Generate Heatmap" button to create a visualization

7. **View Results**: The heatmap will be saved in the `python/` directory with a timestamped filename (e.g., `heatmap_2026-01-11_15-35-50.png`)

## 📁 Project Structure

```
mouse-heatmap/
├── node/
│   ├── server.js          # Node.js WebSocket server
│   ├── package.json        # Node.js dependencies
│   └── node_modules/       # Installed packages
├── python/
│   ├── app.py              # Python WebSocket server & heatmap generator
│   ├── requirements.txt    # Python dependencies
│   └── heatmap_*.png       # Generated heatmap files
├── public/
│   └── index.html          # Frontend application
└── README.md               # This file
```

## 🔧 Configuration

### Heatmap Dimensions

The default heatmap size is 1920x1080 pixels. You can modify this in `python/app.py`:

```python
WIDTH = 1920
HEIGHT = 1080
```

### Server Ports

- **HTTP Server**: `3000` (Node.js)
- **Browser WebSocket**: `3001` (Node.js)
- **Python WebSocket**: `5000` (Python)

To change ports, modify the respective server files.

## 🛠️ Technologies Used

### Frontend
- HTML5
- CSS3 (with modern gradients and animations)
- Vanilla JavaScript (WebSocket API)

### Backend
- **Node.js**: Express.js for HTTP server, `ws` for WebSocket server
- **Python**: 
  - `websockets` for WebSocket server
  - `numpy` for data processing
  - `matplotlib` for heatmap visualization

## 📝 Notes

- Heatmap files are automatically ignored by git (see `.gitignore`)
- Each generated heatmap includes a timestamp in the filename for easy identification
- The application only records mouse movements when recording is active
- Heatmaps are only generated when you manually click the "Generate Heatmap" button

## 🐛 Troubleshooting

### Python Connection Shows "Unknown" or "Disconnected"

- Make sure the Python server is running
- Check that port 5000 is not in use by another application
- Verify Python dependencies are installed correctly

### No Heatmap Generated

- Ensure you've started recording and moved your mouse
- Check the browser console (F12) for error messages
- Verify both Node.js and Python servers are running

### Module Not Found Errors

- For Python: Run `pip install -r requirements.txt` in the `python/` directory
- For Node.js: Run `npm install` in the `node/` directory

## 📄 License

This project is open source and available for personal and educational use.

## 🤝 Contributing

Feel free to submit issues, fork the repository, and create pull requests for any improvements.

---

**Happy Tracking! 🎯**
