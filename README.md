# Trick ANNA: Break the bot

![Trick ANNA](main.png)

## Quick setup

Needs Node.js 20 or newer and a Nebius Token Factory key.

1. **Get the code**

   ```bash
   git clone https://github.com/Andreaswt/FreshaHackathon.git
   cd FreshaHackathon
   ```

2. **Install**

   ```bash
   npm install
   ```

3. **Add your Nebius key.** Create a file called `.env` in the repository folder:

   ```bash
   NEBIUS_API_KEY=your-nebius-key
   ```

   `.env` is never committed. Without the key the intro still plays, but ANNA and Penny can't reply.

4. **Run**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) for the game and
   [http://localhost:3000/pitch](http://localhost:3000/pitch) for the one-slide pitch.

5. **Check**

   ```bash
   npx tsc --noEmit
   npm run lint
   ```

Switches (in `.env`): `DIFFICULTY=soft` makes ANNA easier to trick, and `DEMO_BACKDOORS=off` turns off
the scripted demo bugs.

## Overview

ANNA's AI agents move money and send invoices. To trust them you need lots of realistic, labelled
examples of them going wrong, and writing those by hand is slow.

Trick ANNA turns finding those failures into a game. The player chats with a fake ANNA banking
assistant and tries to make it slip up. Penny, a piggy-bank coach, watches every reply, explains
what happened and gives hints. Every time the player breaks ANNA, the break is saved as a labelled
test case that can be replayed.

## Setup

### Clone the repository

```bash
git clone https://github.com/Andreaswt/FreshaHackathon.git
cd FreshaHackathon
```

### Install Node.js

Install Node.js 20 or newer ([Node.js download](https://nodejs.org/)), then:

```bash
npm install
```

### Add the Nebius key

Create a `.env` file:

```bash
NEBIUS_API_KEY=your-key-here
```

### Run

```bash
npm run dev
```

- `/` is the game: welcome, a scripted intro (skippable), then the missions.
- `/pitch` is a one-slide pitch. Press → or Enter to jump into the game.
