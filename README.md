# Gesto - Hand Gesture Control Application

Gesto is a desktop application that allows you to control your computer using hand gestures. It uses machine learning to detect hand movements and gestures through your webcam and translates them into mouse and keyboard actions.

## Features

- Hand tracking and mouse control
- Gesture recognition for various commands:
  - 👍 Thumb Up: Scroll Up
  - 👎 Thumb Down: Scroll Down
  - ✌️ Victory: Switch between applications (Cmd + Tab)
  - ☝️ Pointing Up: Right Click
  - 🖐️ Open Palm: Minimize window (Alt + Cmd + M)
- System tray integration for easy access and control
- Pause/Resume tracking functionality

## Technologies Used

- **Electron**: For creating the cross-platform desktop application
- **MediaPipe**: For hand tracking and gesture recognition
- **@nut-tree-fork/nut-js**: For programmatic mouse and keyboard control
- **TensorFlow.js**: For machine learning model support

## Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)
- A webcam

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/gesto.git
cd gesto
```

2. Install dependencies:

```bash
npm install
```

3. Start the application:

```bash
npm start
```

## Usage

1. After launching the application, it will appear in your system tray
2. The webcam will automatically start tracking your hand movements
3. Use the system tray menu to:
   - Pause/Resume hand tracking
   - Quit the application

## Gesture Controls

| Gesture       | Action               |
| ------------- | -------------------- |
| Hand Movement | Mouse Cursor Control |
| Hold Still    | Left Click           |
| Thumb Up      | Scroll Up            |
| Thumb Down    | Scroll Down          |
| Victory Sign  | Switch Applications  |
| Pointing Up   | Right Click          |
| Open Palm     | Minimize Window      |

## Demo

[Add your demo video here]

## Dependencies

- @mediapipe/camera_utils: ^0.3.1675466862
- @mediapipe/hands: ^0.4.1675469240
- @mediapipe/tasks-vision: ^0.10.18
- @nut-tree-fork/nut-js: ^4.2.2
- @tensorflow-models/hand-pose-detection: ^2.0.1
- @tensorflow/tfjs: ^4.22.0
- electron: ^33.2.0

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is licensed under the ISC License.
