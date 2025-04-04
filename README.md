# Frame the Speaker | Держи в кадре!

## Game Description

Frame the Speaker is a web-based game where you control a virtual camera and must keep a moving speaker within your frame. The speaker moves chaotically around the screen, changing direction and speed randomly.

## How to Play

1. Use the arrow keys to move the camera frame (red rectangle)
2. Keep the speaker inside the frame as long as possible
3. You lose a life when the speaker is completely outside the frame
4. Score points for each second you keep the speaker in frame
5. The game ends when you run out of lives

## Game Features

- Randomly moving speaker with varying speeds and directions
- Score tracking and high score saving (using localStorage)
- Lives system (3 lives by default)
- Game over screen with final score and restart option
- Responsive design for different screen sizes

## Technical Details

- Built with vanilla JavaScript, HTML5, and CSS3
- Uses HTML5 Canvas for rendering
- No external libraries or dependencies required
- All game assets included in the repository

## How to Run

Simply open the `index.html` file in any modern web browser to start playing.

## Controls

- **Arrow Keys** or **WASD**: Move camera frame
  - Up Arrow / W: Move camera frame up
  - Down Arrow / S: Move camera frame down
  - Left Arrow / A: Move camera frame left
  - Right Arrow / D: Move camera frame right

## Game Parameters

You can modify the following constants in `game.js` to adjust the game difficulty:

- `CAMERA_SPEED`: How fast the camera frame moves
- `SPEAKER_MIN_SPEED` and `SPEAKER_MAX_SPEED`: Range of speaker movement speeds
- `DIRECTION_CHANGE_MIN_TIME` and `DIRECTION_CHANGE_MAX_TIME`: How often the speaker changes direction
- `FRAME_WIDTH` and `FRAME_HEIGHT`: Size of the camera frame
- `TOTAL_LIVES`: Number of lives at the start of the game