# synced-guitar-tabs

A simple synchronized guitar tab viewer that allows multiple people to see the same song and coordinate playing it.
You need to run a small server (can be local) for web sockets to work. 
Each user simply opens the web app in their browser.

Build using [alphaTab](https://www.alphatab.net/).

## Setup

```
cd server
pnpm i
```
```
cd app
pnpm i
```

## Dev

```
cd server
npm run dev
```
```
cd app
npm run dev
```

## Deploy

```
cd server
npm start
```
```
cd app
npm start
```

## Use

- Connect a device's browser to the URL shown in the console when starting the app
- Make sure the signal bars icon at the bottom left is green (connection to server works)
- Connect more devices
- Click the file button next to the signal bars to open a Guitar Pro file and display it on all clients
- Interact with the tab, e.g., set a speed and activate count-in; this should be reflected by all clients
- Play together!
- Some settings are not synced, such as the instrument shown, metronome, zoom, page layout

## Keyboard Shortcuts

- `space` play/pause
- `CTRL + space` stop and go to beginning
- `l` toggle looping
- `c` toggle count-in
- `s` toggle sending
- `r` toggle receiving
- `+` zoom in
- `-` zoom out
- `ArrowLeft` previous bar
- `ArrowRight` next bar

## TODO

- [x] use serve to host web socket server and app on the same hostname
- [x] allow the user to disable sending and/or receiving temporarily
- [x] keyboard shortcuts
- [x] sync file
  - https://www.alphatab.net/docs/reference/api/load/
- [x] sync play/pause
- [x] sync loop and count-in
- [x] sync speed
- [x] sync jumping
- [x] sync selection
- [ ] allow muting each instrument
  - [ ] https://www.alphatab.net/docs/reference/api/changetrackmute/
- [ ] allow soloing each instrument
  - [ ] https://www.alphatab.net/docs/reference/api/changetracksolo/
- [ ] allow setting the volume of each instrument
  - [ ] https://www.alphatab.net/docs/reference/api/changetrackvolume/
- [ ] allow choosing Tab/ScoreTab/Score
