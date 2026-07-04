# Architecture & Implementation Guide: Next-Gen Features

This document outlines the technical architecture, required dependencies, and step-by-step implementation guide to bring the **Skill Tree** and **1v1 Code Duels** to AcECode using the existing MERN stack (MongoDB, Express, React, Node.js).

---

## Feature 1: The "Skill Tree" Progression System

The Skill Tree introduces a graph-based progression structure, replacing flat problem lists. This guides users through logical learning paths.

### 1. Database Schema Updates (MongoDB)

To support a directed acyclic graph (DAG) structure, we will update the Problem schema to link problems to their prerequisites and assign position coordinates for visual rendering.

#### Problem Model Update
Add the following fields to your Problem schema:
- `prerequisites`: `[ObjectId]` (References to other problems in the collection that must be solved before this one unlocks)
- `coordinates`: `{ x: Number, y: Number }` (Optional coordinate mapping to save and persist visual positions on the node map)

```javascript
// Example MongoDB Schema Update
const problemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  // ... existing fields ...
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem'
  }],
  coordinates: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 }
  }
});
```

### 2. Frontend Visualization (React)

To render a highly interactive, responsive node map, we will use **React Flow** rather than writing complex custom SVG or Canvas math.

- **Recommended Library:** `reactflow` (A highly customizable React library for node-based UIs).
- **Setup & Routing:**
  - Create a new route: `/journey` or `/skill-tree`.
  - Fetch all problems and dynamically construct the flow elements:
    - **Nodes:** Represent each problem.
      - **Locked state:** If a user has not solved the prerequisites, display the node in grey with a padlock icon.
      - **Completed state:** If solved, render it with an active state (e.g., glowing emerald green).
      - **Available/Unlocked state:** If all prerequisites are met but the problem is not yet solved, render it in a distinct, highlight color.
    - **Edges:** Draw animated, glowing lines (`animated: true` in React Flow) between prerequisites and their child nodes.

```javascript
// Conceptual frontend transformation snippet
const nodes = problems.map(prob => ({
  id: prob._id,
  type: 'problemNode',
  data: { 
    label: prob.title,
    status: getUserProblemStatus(prob._id, userProgress) // 'locked' | 'unlocked' | 'completed'
  },
  position: prob.coordinates || { x: 0, y: 0 }
}));

const edges = [];
problems.forEach(prob => {
  if (prob.prerequisites) {
    prob.prerequisites.forEach(prereqId => {
      edges.push({
        id: `e-${prereqId}-${prob._id}`,
        source: prereqId,
        target: prob._id,
        animated: getUserProblemStatus(prereqId, userProgress) === 'completed',
        style: { stroke: '#10b981' } // Emerald green for active progression paths
      });
    });
  }
});
```

### 3. Logic & Security

- **Backend Enforcement:** When a user submits a code solution, the backend evaluation endpoint must verify that all database prerequisites for that problem have been marked as solved in the user's progress record.
- **Frontend Feedback:** When a node status transitions to "completed" upon submission, trigger a smooth particle/glow animation unlocking the subsequent children nodes dynamically.

---

## Feature 2: 1v1 "Code Duels" (Multiplayer)

Real-time 1v1 matching and coding battles require bi-directional, low-latency communication via WebSockets instead of polling over HTTP.

### 1. Backend Infrastructure (Node.js + Socket.io)

- **Install Dependency:** `npm install socket.io` on the Node.js backend.
- **Matchmaking Queue:**
  - When a user requests a match, they emit a `join_queue` socket event.
  - The server places candidate players in a matchmaking queue: `let queue = []`.
  - Once the queue size reaches $\ge 2$, pop the first two users, generate a unique `roomId` (e.g., using `uuid`), and emit a `match_found` event to both.
- **Room Management:**
  - Move both sockets into a dedicated lobby using `socket.join(roomId)`.
  - Persist the match state (problems assigned, time limits, and scores) on the server.

```javascript
// Simple Matchmaking Concept
let queue = [];

io.on('connection', (socket) => {
  socket.on('join_queue', (user) => {
    queue.push({ socketId: socket.id, user });
    
    if (queue.length >= 2) {
      const player1 = queue.shift();
      const player2 = queue.shift();
      const roomId = uuidv4();
      
      io.to(player1.socketId).emit('match_found', { roomId, opponent: player2.user });
      io.to(player2.socketId).emit('match_found', { roomId, opponent: player1.user });
    }
  });
});
```

### 2. Frontend Multiplayer UI (React + Socket.io-client)

- **Install Dependency:** `npm install socket.io-client`.
- **Split-Screen Layout:**
  - **Left panel:** The shared problem description, constraints, and inputs.
  - **Center panel:** The user's active Monaco Editor instance.
  - **Right panel/Top bar:** Opponent status HUD (e.g., opponent's avatar, connection status, typing status, and overall progress).
- **Progress Tracking:**
  - To prevent excessive bandwidth usage, do not transmit whole keystrokes.
  - Instead, listen to Monaco Editor's `onChange` event, and emit a debounced `code_progress` event (e.g., every 2 seconds). Send metric metadata, such as number of lines written or count of local test cases passing.
  - The opponent UI parses this and advances a real-time progress bar.

### 3. Execution & Winning

1. **Submission & Grading:** When a user clicks "Submit", the client submits the code to your existing evaluation API container/runner.
2. **Victory Verification:** If the execution engine returns a clean run passing 100% of test cases, the server emits a `player_won` event to the `roomId`.
3. **End-of-Match Flow:**
   - Both clients receive the `player_won` payload.
   - Instantly halt the game loop/timer.
   - Render a high-fidelity victory/defeat modal.
   - The backend modifies both users' Elo ratings and saves the match history details.

---

## Roadmap: How to Get Started

### Phase 1: Skill Tree
1. **[ ] Database Setup:** Add the `prerequisites` and `coordinates` fields to the problem schema. Seed or update a small set of mock problems to form a structured dependency graph.
2. **[ ] Visualization Engine:** Install `reactflow` on the frontend. Create the `/skill-tree` component to render nodes dynamically based on problem listings.
3. **[ ] Progression Guard:** Link visual states to the authenticated user's problem history. Build logic to lock/unlock problems dynamically on both the frontend and backend.

### Phase 2: Code Duels
1. **[ ] Socket.io server:** Configure Socket.io on the Express server. Verify connection handshakes.
2. **[ ] Matchmaking Core:** Construct the matchmaking queue array with entry/exit logic. Emit events to build the unique duel room.
3. **[ ] Duel Workspace UI:** Assemble the split-screen workspace under `/duel/:roomId`. Establish debounced websocket synchronization for opponent progress bars.
4. **[ ] Game Loop End State:** Wire the evaluation API to declare the winner, broadcast the finish state, update Elo rankings, and route players back to the dashboard safely.
