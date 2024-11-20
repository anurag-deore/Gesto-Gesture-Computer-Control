const { GestureRecognizer, FilesetResolver, DrawingUtils } = require("@mediapipe/tasks-vision");
const { mouse, Point, left, Button } = require('@nut-tree-fork/nut-js');  // Import nut.js for mouse control

const demosSection = document.getElementById("demos");
let gestureRecognizer;
let runningMode = "IMAGE";
let enableWebcamButton;
let webcamRunning = false;
const videoWidthNumber = 1280;
const videoHeightNumber = 720;

// Declare the video element
const video = document.getElementById("webcam");  // Ensure this matches your HTML element ID
const canvasElement = document.getElementById("output_canvas");
const canvasCtx = canvasElement.getContext("2d");
const gestureOutput = document.getElementById("gesture_output");

// Define target coordinates for the click event
const targetCoordinate = { x: 640, y: 360 }; // Example target coordinate (center of the window)
const clickThreshold = 0.05; // 5% threshold

// Create the gesture recognizer
const createGestureRecognizer = async () => {
    const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
    );
    gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath:
                "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
            delegate: "GPU"
        },
        runningMode: runningMode
    });
    demosSection.classList.remove("invisible");
};
createGestureRecognizer();

// Check if webcam access is supported
function hasGetUserMedia() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

// Enable the webcam view and start detection
if (hasGetUserMedia()) {
    enableWebcamButton = document.getElementById("webcamButton");
    enableWebcamButton.addEventListener("click", enableCam);
} else {
    console.warn("getUserMedia() is not supported by your browser");
}

// Enable the webcam stream
function enableCam(event) {
    if (!gestureRecognizer) {
        alert("Please wait for gestureRecognizer to load");
        return;
    }

    if (webcamRunning === true) {
        webcamRunning = false;
        enableWebcamButton.innerText = "ENABLE PREDICTIONS";
    } else {
        webcamRunning = true;
        enableWebcamButton.innerText = "DISABLE PREDICTIONS";
    }

    const constraints = {
        video: true
    };

    navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
        video.srcObject = stream;
        video.addEventListener("loadeddata", predictWebcam);
    });
}

let lastVideoTime = -1;
let results = undefined;
async function predictWebcam() {
    if (runningMode === "IMAGE") {
        runningMode = "VIDEO";
        await gestureRecognizer.setOptions({ runningMode: "VIDEO" });
    }
    let nowInMs = Date.now();
    if (video.currentTime !== lastVideoTime) {
        lastVideoTime = video.currentTime;
        results = gestureRecognizer.recognizeForVideo(video, nowInMs);
    }

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    const drawingUtils = new DrawingUtils(canvasCtx);

    // canvasElement.style.height = videoHeight;
    // video.style.height = videoHeight;  // Use the video variable here
    // canvasElement.style.width = videoWidth;
    // video.style.width = videoWidth;  // Use the video variable here

    if (results.landmarks) {
        for (const landmarks of results.landmarks) {
            drawingUtils.drawConnectors(
                landmarks,
                GestureRecognizer.HAND_CONNECTIONS,
                {
                    color: "#00FF00",
                    lineWidth: 5
                },
            );
            drawingUtils.drawLandmarks(landmarks, {
                color: "#FF0000",
                lineWidth: 2
                }
            );

            // Calculate the center of the hand based on landmarks
            const centerX = landmarks.reduce((sum, landmark) => sum + landmark.x, 0) / landmarks.length;
            const centerY = landmarks.reduce((sum, landmark) => sum + landmark.y, 0) / landmarks.length;
            // Translate to window coordinates and move the mouse
            const { x: windowX, y: windowY } = translateToWindowCoordinates({ x: centerX * videoWidthNumber - 50, y: centerY * videoHeightNumber - 50 });
            mouse.move(new Point(windowX, windowY));
            if (checkCoordinates(windowX, windowY)) {
                console.log("running click")
                await mouse.click(Button.LEFT);  // Perform a click event
            }
        }
    }
    canvasCtx.restore();

    if (webcamRunning === true) {
        window.requestAnimationFrame(predictWebcam);
    }
}

// Function to translate hand position to window coordinates
const translateToWindowCoordinates = (handPosition) => {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // Translate hand position to window coordinates (you may need to adjust scaling)
    const windowX = Math.min(Math.max(handPosition.x, 0), windowWidth);
    const windowY = Math.min(Math.max(handPosition.y, 0), windowHeight);
    return { x: windowX, y: windowY };
};



const coordinatesArray = [];

const checkCoordinates = (x, y) => {
    const threshold = 0.01; // 5% threshold
    const recentCoordinates = coordinatesArray.slice(-100); // Get the last 100 coordinates

    // Check if the array has enough elements to compare
    if (recentCoordinates.length < 100) {
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
