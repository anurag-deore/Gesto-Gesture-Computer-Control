const { GestureRecognizer, FilesetResolver, DrawingUtils } = require("@mediapipe/tasks-vision");
const { mouse, Point, Button, keyboard, Key } = require('@nut-tree-fork/nut-js');
const { ipcRenderer } = require('electron');

let gestureRecognizer;
let webcamRunning = false;
const videoWidthNumber = 1280;
const videoHeightNumber = 720;

keyboard.config.autoDelayMs = 10;
const video = document.getElementById("webcam");
const canvasElement = document.getElementById("output_canvas");
const canvasCtx = canvasElement.getContext("2d");


let lastVideoTime = -1;
let results = undefined;
async function initialize() {
    try {
        // Initialize gesture recognizer
        const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath:
                    "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
                delegate: "GPU"
            },
            runningMode: "VIDEO"  // Use the defined runningMode
        });

        // Start webcam
        const constraints = {
            video: {
                width: videoWidthNumber,
                height: videoHeightNumber
            }
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        webcamRunning = true;
        video.addEventListener("loadeddata", predictWebcam);
    } catch (error) {
        console.error('Initialization error:', error);
        // Retry initialization after 5 seconds if it fails
        setTimeout(initialize, 5000);
    }
}


async function predictWebcam() {
    try {
        if (!webcamRunning || !gestureRecognizer) return;

        if (video.currentTime !== lastVideoTime) {
            lastVideoTime = video.currentTime;
            results = gestureRecognizer.recognizeForVideo(video, Date.now());
        }

        if (results?.landmarks) {
            for (const landmarks of results.landmarks) {
                // Calculate hand center
                const centerX = landmarks.reduce((sum, landmark) => sum + landmark.x, 0) / landmarks.length;
                const centerY = landmarks.reduce((sum, landmark) => sum + landmark.y, 0) / landmarks.length;

                // Translate to window coordinates
                const { x: windowX, y: windowY } = translateToWindowCoordinates({
                    x: centerX * videoWidthNumber,
                    y: centerY * videoHeightNumber
                });
                console.log(results.gestures);
                // Move mouse
                try {
                    await mouse.move(new Point(windowX, windowY));

                    if (checkCoordinates(windowX, windowY)) {
                        await mouse.click(Button.LEFT);
                    }
                    if (results.gestures && results.gestures.length > 0) {
                        const gesture = results.gestures[0][0].categoryName; // Assuming the first gesture is the one to check

                        if (gesture === "Thumb_Up") {
                            console.log("Thumb Up, scrolling up");
                            await mouse.scrollUp(10); // Scroll up for thumbs up gesture
                        } else if (gesture === "Thumb_Down") {
                            console.log("Thumb Up, scrolling up");
                            await mouse.scrollDown(10); // Scroll down for thumbs down gesture
                        } else if (gesture === "Open_Palm") {
                            await keyboard.pressKey(Key.LeftAlt, Key.LeftCmd, Key.M); // Press function F11 key
                            await keyboard.releaseKey(Key.LeftAlt, Key.LeftCmd, Key.M);
                        } else if (gesture === "Pointing_Up") {
                            await mouse.rightClick();
                        } else if (gesture === "Victory") {
                            await keyboard.pressKey(Key.LeftCmd, Key.Tab);
                            await keyboard.releaseKey(Key.LeftCmd, Key.Tab);
                        }

                    }
                } catch (error) {
                    console.error('Mouse control error:', error);
                }
            }
        }

        if (webcamRunning) {
            window.requestAnimationFrame(predictWebcam);
        }
    } catch (error) {
        console.error('Prediction error:', error);
        // Reset tracking if there's an error
        webcamRunning = false;
        setTimeout(initialize, 5000);
    }
}
// Function to translate hand position to window coordinates
const translateToWindowCoordinates = (handPosition) => {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // Translate hand position to window coordinates (inverting horizontal position)
    const windowX = windowWidth - Math.min(Math.max(handPosition.x, 0), windowWidth); // Inverted horizontal position
    const windowY = Math.min(Math.max(handPosition.y, 0), windowHeight);
    return { x: windowX, y: windowY };
};



const coordinatesArray = [];

const checkCoordinates = (x, y) => {
    const threshold = 0.02; // 5% threshold
    const recentCoordinates = coordinatesArray.slice(-120); // Get the last 120 coordinates

    // Check if the array has enough elements to compare
    if (recentCoordinates.length < 120) {
        coordinatesArray.push({ x, y });
        return false; // Not enough data to compare
    }

    for (const coord of recentCoordinates) {
        const xDiff = Math.abs(coord.x - x);
        const yDiff = Math.abs(coord.y - y);
        const xThreshold = coord.x * threshold;
        const yThreshold = coord.y * threshold;

        if (xDiff <= xThreshold && yDiff <= yThreshold) {
            coordinatesArray.length = 0; // Reset the coordinates array
            return true; // Coordinates are within the threshold
        }
    }

    coordinatesArray.push({ x, y }); // Store the new coordinates
    return false; // Coordinates are not within the threshold
};


// Handle pause/resume commands from main process
ipcRenderer.on('pause-tracking', () => {
    webcamRunning = false;
});

ipcRenderer.on('resume-tracking', () => {
    if (!webcamRunning) {
        webcamRunning = true;
        predictWebcam();
    }
});

// Start tracking immediately
initialize();