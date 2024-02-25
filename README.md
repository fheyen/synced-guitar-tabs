# synced-guitar-tabs

https://www.alphatab.net/docs/reference/api

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

- Connect a device's browser to the URL shown in the console whe starting the app
- Make sure the signal bars icon at the bottom left is green (connection to server works)
- Connect more devices
- Click the file button next to the singal bars to open a Guitar Pro file and display it on all clients
- Interact with the tab, e.g., set a speed and activate count-in, this should be reflected by all clients
- Play together!
- Some settings are not synced, such as the instrument shown, metronome, zoom, page layout

## TODO

- [x] sync file
  - https://www.alphatab.net/docs/reference/api/load/
- [x] sync play/pause
- [x] sync loop and count-in
- [x] sync speed
  - https://www.alphatab.net/docs/reference/api/playbackspeed/
- [ ] sync jumping
- [ ] sync selection
  - https://www.alphatab.net/docs/reference/api/playbackrangechanged/
- [ ] allow user to temporarily disable sending
- [ ] allow user to temporarily disable recieving
- ~~allow to set host and port~~
  - [x] use serve to host websocket server and app on same hostname
- [ ] allow muting each instrument
- [ ] allow choosing Tab/ScoreTab/Score
