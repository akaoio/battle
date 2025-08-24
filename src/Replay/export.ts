import { getPlaybackEngineSource } from './getPlaybackEngineSource.js'

export function exportReplay(this: any, format: 'json' | 'html'): string {
    if (format === 'json') {
        return JSON.stringify(this.data, null, 2)
    }
    
    if (format === 'html') {
        // Generate enhanced HTML player with unified playback engine
        return `<!DOCTYPE html>
<html>
<head>
    <title>Battle Replay - ${this.data.timestamp}</title>
    <style>
        body {
            background: #1e1e1e;
            color: #d4d4d4;
            font-family: 'Cascadia Code', 'Courier New', monospace;
            padding: 20px;
            margin: 0;
        }
        
        .header {
            margin-bottom: 20px;
            padding: 15px;
            background: #2d2d30;
            border-radius: 8px;
        }
        
        .header h1 {
            margin: 0 0 10px 0;
            color: #007acc;
        }
        
        .metadata {
            display: flex;
            gap: 20px;
            font-size: 14px;
            color: #cccccc;
        }
        
        #terminal {
            background: #000;
            padding: 15px;
            border-radius: 8px;
            min-height: 400px;
            max-height: 600px;
            white-space: pre-wrap;
            overflow-y: auto;
            font-family: 'Cascadia Code', 'SF Mono', 'Monaco', 'Inconsolata', 'Consolas', monospace;
            font-size: 14px;
            line-height: 1.4;
            border: 1px solid #3c3c3c;
        }
        
        .controls-container {
            background: #2d2d30;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
        }
        
        .main-controls {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 15px;
        }
        
        .control-btn {
            background: #007acc;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: background 0.2s;
            min-width: 60px;
        }
        
        .control-btn:hover {
            background: #005a9e;
        }
        
        .control-btn:active {
            background: #004578;
        }
        
        .control-btn:disabled {
            background: #555;
            cursor: not-allowed;
        }
        
        .secondary-btn {
            background: #6c757d;
            padding: 8px 12px;
            font-size: 12px;
        }
        
        .secondary-btn:hover {
            background: #545b62;
        }
        
        .progress-container {
            display: flex;
            align-items: center;
            gap: 15px;
            margin-bottom: 15px;
        }
        
        .progress-bar {
            flex: 1;
            height: 8px;
            background: #444;
            border-radius: 4px;
            position: relative;
            cursor: pointer;
        }
        
        .progress-fill {
            height: 100%;
            background: #007acc;
            border-radius: 4px;
            width: 0%;
            transition: width 0.1s linear;
        }
        
        .progress-handle {
            position: absolute;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 16px;
            height: 16px;
            background: #007acc;
            border-radius: 50%;
            cursor: grab;
            opacity: 0;
            transition: opacity 0.2s;
        }
        
        .progress-bar:hover .progress-handle {
            opacity: 1;
        }
        
        .progress-handle:active {
            cursor: grabbing;
        }
        
        .time-display {
            font-family: 'Cascadia Code', monospace;
            font-size: 14px;
            color: #cccccc;
            min-width: 100px;
        }
        
        .speed-controls {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 10px;
        }
        
        .speed-preset {
            background: #555;
            border: 1px solid #666;
            color: #ccc;
            padding: 5px 10px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 12px;
        }
        
        .speed-preset:hover {
            background: #666;
        }
        
        .speed-preset.active {
            background: #007acc;
            border-color: #007acc;
            color: white;
        }
        
        .speed-input-container {
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        #speedInput {
            width: 60px;
            padding: 5px;
            background: #3c3c3c;
            border: 1px solid #555;
            border-radius: 3px;
            color: #d4d4d4;
            font-size: 12px;
        }
        
        .event-log {
            background: #252526;
            border: 1px solid #3c3c3c;
            border-radius: 8px;
            padding: 15px;
            margin-top: 20px;
            max-height: 200px;
            overflow-y: auto;
            font-size: 12px;
            font-family: 'Cascadia Code', monospace;
        }
        
        .event {
            padding: 2px 0;
            border-bottom: 1px solid #3c3c3c;
        }
        
        .event-spawn { color: #dcdcaa; }
        .event-output { color: #9cdcfe; }
        .event-input { color: #ce9178; }
        .event-key { color: #b5cea8; }
        .event-resize { color: #c586c0; }
        .event-screenshot { color: #608b4e; }
        .event-expect { color: #d7ba7d; }
        .event-exit { color: #f48771; }
        
        .status-container {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-top: 10px;
            font-size: 12px;
        }
        
        .status-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #555;
        }
        
        .status-dot.playing { background: #4ec9b0; animation: pulse 1s infinite; }
        .status-dot.paused { background: #ffcc00; }
        .status-dot.stopped { background: #f48771; }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        #eventCounter {
            margin-left: auto;
            color: #808080;
        }
        
        /* Keyboard shortcuts hint */
        .shortcuts {
            margin-top: 15px;
            padding: 10px;
            background: #1e1e1e;
            border-radius: 5px;
            font-size: 11px;
            color: #808080;
        }
        
        .shortcuts-title {
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .shortcut {
            display: inline-block;
            margin-right: 15px;
        }
        
        .shortcut-key {
            background: #3c3c3c;
            padding: 2px 5px;
            border-radius: 3px;
            font-family: monospace;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎬 Battle Replay Player</h1>
        <div class="metadata">
            <span>📅 ${this.data.timestamp}</span>
            <span>⏱️ Duration: ${(this.data.duration / 1000).toFixed(2)}s</span>
            <span>🎯 Events: ${this.data.events.length}</span>
            <span>📐 Terminal: ${this.data.metadata.cols}x${this.data.metadata.rows}</span>
            <span>💻 Command: ${this.data.metadata.command} ${(this.data.metadata.args || []).join(' ')}</span>
        </div>
    </div>
    
    <div class="controls-container">
        <div class="progress-container">
            <div id="progressBar" class="progress-bar" onclick="seekToPosition(event)">
                <div id="progressFill" class="progress-fill"></div>
                <div id="progressHandle" class="progress-handle"></div>
            </div>
            <div id="timeDisplay" class="time-display">0:00 / 0:00</div>
        </div>
        
        <div class="main-controls">
            <button id="playBtn" class="control-btn" onclick="togglePlay()">▶ Play</button>
            <button class="control-btn secondary-btn" onclick="stop()">⏹ Stop</button>
            <button class="control-btn secondary-btn" onclick="jumpToStart()">⏮ Start</button>
            <button class="control-btn secondary-btn" onclick="jumpToEnd()">⏭ End</button>
        </div>
        
        <div class="speed-controls">
            <span>Speed:</span>
            <button class="speed-preset" onclick="setSpeed.call(this, 0.5)">0.5×</button>
            <button class="speed-preset active" onclick="setSpeed.call(this, 1)">1×</button>
            <button class="speed-preset" onclick="setSpeed.call(this, 2)">2×</button>
            <button class="speed-preset" onclick="setSpeed.call(this, 4)">4×</button>
            <button class="speed-preset" onclick="setSpeed.call(this, 8)">8×</button>
            <div class="speed-input-container">
                <span>Custom:</span>
                <input type="number" id="speedInput" value="1.0" min="0" max="50" step="0.1" onchange="setCustomSpeed()">
                <span>×</span>
            </div>
        </div>
        
        <div class="status-container">
            <div id="statusDot" class="status-dot stopped"></div>
            <span id="statusText">Stopped</span>
            <span id="eventCounter">Event: 0/${this.data.events.length}</span>
        </div>
    </div>
    
    <div id="terminal"></div>
    
    <div id="eventLog" class="event-log">
        <strong>Event Log</strong> (most recent first)
    </div>
    
    <div id="eventDisplay"></div>
    
    <div class="shortcuts">
        <div class="shortcuts-title">⌨️ Keyboard Shortcuts:</div>
        <span class="shortcut"><span class="shortcut-key">Space</span> Play/Pause</span>
        <span class="shortcut"><span class="shortcut-key">←/→</span> Skip -/+ 5s</span>
        <span class="shortcut"><span class="shortcut-key">↑/↓</span> Speed Up/Down</span>
        <span class="shortcut"><span class="shortcut-key">0-9</span> Jump to %</span>
    </div>
    
    <script>
        ${getPlaybackEngineSource()}
        
        // Replay data
        const replayData = ${JSON.stringify(this.data)};
        const events = replayData.events;
        const duration = replayData.duration;
        
        // Create unified playback engine
        const engine = new PlaybackEngine(events, duration, {
            speed: 1.0,
            onEvent: processEvent,
            onStateChange: updateDisplay,
            onProgress: updateDisplay
        });
        
        // DOM elements
        const terminal = document.getElementById('terminal');
        const progressBar = document.getElementById('progressBar');
        const progressFill = document.getElementById('progressFill');
        const progressHandle = document.getElementById('progressHandle');
        const timeDisplay = document.getElementById('timeDisplay');
        const eventLog = document.getElementById('eventLog');
        const eventDisplay = document.getElementById('eventDisplay');
        const speedInput = document.getElementById('speedInput');
        const playBtn = document.getElementById('playBtn');
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');
        const eventCounter = document.getElementById('eventCounter');
        
        // Initialize
        updateDisplay();
        
        function togglePlay() {
            if (engine.isPlaying()) {
                engine.pause();
            } else {
                engine.play();
            }
        }
        
        function play() {
            engine.play();
        }
        
        function pause() {
            engine.pause();
        }
        
        function stop() {
            engine.stop();
            terminal.innerHTML = '';
            eventLog.innerHTML = '<strong>Event Log</strong> (most recent first)';
        }
        
        function jumpToStart() {
            engine.jumpToStart();
            terminal.innerHTML = '';
            eventLog.innerHTML = '<strong>Event Log</strong> (most recent first)';
        }
        
        function jumpToEnd() {
            engine.jumpToEnd();
            terminal.innerHTML = '';
            eventLog.innerHTML = '<strong>Event Log</strong> (most recent first)';
            
            // Process all events to current point
            for (let i = 0; i < engine.getCurrentEventIndex(); i++) {
                processEvent(events[i], engine.getState());
            }
        }
        
        function setSpeed(speed) {
            engine.setSpeed(speed);
            speedInput.value = speed.toFixed(2);
            
            // Update active preset
            document.querySelectorAll('.speed-preset').forEach(btn => {
                btn.classList.remove('active');
            });
            this.classList.add('active');
        }
        
        function setCustomSpeed() {
            const speed = Math.max(0, parseFloat(speedInput.value));
            engine.setSpeed(speed);
            
            // Update active preset
            document.querySelectorAll('.speed-preset').forEach(btn => {
                btn.classList.remove('active');
            });
        }
        
        function seekToPosition(event) {
            const rect = progressBar.getBoundingClientRect();
            const position = (event.clientX - rect.left) / rect.width;
            const percent = position * 100;
            
            engine.seekToPercent(percent);
            terminal.innerHTML = '';
            eventLog.innerHTML = '<strong>Event Log</strong> (most recent first)';
            
            // Process events up to current point
            for (let i = 0; i < engine.getCurrentEventIndex(); i++) {
                processEvent(events[i], engine.getState());
            }
        }
        
        function updateStatus(state, text) {
            statusDot.className = 'status-dot ' + state;
            statusText.textContent = text;
        }
        
        function updateDisplay() {
            const state = engine.getState();
            const progress = engine.getProgress();
            const currentTime = engine.getCurrentTime();
            
            // Update progress bar
            progressFill.style.width = progress + '%';
            progressHandle.style.left = progress + '%';
            
            // Update time display
            const currentMins = Math.floor(currentTime / 60000);
            const currentSecs = Math.floor((currentTime % 60000) / 1000);
            const totalMins = Math.floor(duration / 60000);
            const totalSecs = Math.floor((duration % 60000) / 1000);
            
            timeDisplay.textContent = 
                currentMins + ':' + currentSecs.toString().padStart(2, '0') + 
                ' / ' + 
                totalMins + ':' + totalSecs.toString().padStart(2, '0');
            
            // Update event counter
            eventCounter.textContent = 'Event: ' + state.currentEventIndex + '/' + events.length;
            
            // Update play button and status
            if (state.isPlaying) {
                updateStatus('playing', 'Playing');
                playBtn.textContent = '⏸ Pause';
            } else if (state.isPaused) {
                updateStatus('paused', 'Paused');
                playBtn.textContent = '▶ Play';
            } else {
                updateStatus('stopped', 'Stopped');
                playBtn.textContent = '▶ Play';
            }
        }
        
        function processEvent(event, state) {
            let logEntry = '<div class="event event-' + event.type + '">';
            logEntry += '[' + (event.timestamp / 1000).toFixed(2) + 's] ';
            
            switch(event.type) {
                case 'spawn':
                    logEntry += 'SPAWN: ' + event.data.command + ' ' + (event.data.args || []).join(' ');
                    break;
                    
                case 'output':
                    terminal.innerHTML += escapeHtml(event.data);
                    // Auto-scroll terminal
                    terminal.scrollTop = terminal.scrollHeight;
                    logEntry += 'OUTPUT: ' + event.data.length + ' bytes';
                    break;
                    
                case 'input':
                    logEntry += 'INPUT: ' + JSON.stringify(event.data);
                    break;
                    
                case 'key':
                    logEntry += 'KEY: ' + event.data;
                    break;
                    
                case 'resize':
                    logEntry += 'RESIZE: ' + event.data.cols + 'x' + event.data.rows;
                    break;
                    
                case 'screenshot':
                    logEntry += 'SCREENSHOT: ' + event.data.name;
                    break;
                    
                case 'expect':
                    logEntry += 'EXPECT: ' + (event.data.pattern || event.data);
                    break;
                    
                case 'exit':
                    logEntry += 'EXIT: Code ' + event.data;
                    break;
                    
                default:
                    logEntry += event.type.toUpperCase();
            }
            
            logEntry += '</div>';
            
            // Add to event log (prepend for most recent first)
            const currentLog = eventLog.innerHTML;
            const titleIndex = currentLog.indexOf('</strong>');
            if (titleIndex !== -1) {
                eventLog.innerHTML = currentLog.slice(0, titleIndex + 9) + 
                    logEntry + currentLog.slice(titleIndex + 9);
            }
            
            // Keep log size reasonable
            const logEvents = eventLog.querySelectorAll('.event');
            if (logEvents.length > 100) {
                logEvents[logEvents.length - 1].remove();
            }
        }
        
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case ' ':
                    e.preventDefault();
                    togglePlay();
                    break;
                case 'ArrowLeft':
                    engine.skipBackward(5000);
                    break;
                case 'ArrowRight':
                    engine.skipForward(5000);
                    break;
                case 'ArrowUp':
                    engine.setSpeed(Math.min(50, engine.getSpeed() * 2));
                    speedInput.value = engine.getSpeed().toFixed(2);
                    break;
                case 'ArrowDown':
                    engine.setSpeed(Math.max(0.1, engine.getSpeed() / 2));
                    speedInput.value = engine.getSpeed().toFixed(2);
                    break;
                case '0':
                case '1':
                case '2':
                case '3':
                case '4':
                case '5':
                case '6':
                case '7':
                case '8':
                case '9':
                    const percent = parseInt(e.key) * 10;
                    engine.seekToPercent(percent);
                    break;
            }
        });
    </script>
</body>
</html>`
    }
    
    throw new Error(`Unsupported export format: ${format}`)
}