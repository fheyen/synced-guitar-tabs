<script>
  // @ts-nocheck
  import { onDestroy, onMount } from 'svelte';
  import '@fortawesome/fontawesome-free/css/all.min.css';

  const PORT = 8080;

  const host = window.location.hostname;
  const url = `ws://${host}:${PORT}`;

  console.log(`connecting to ${url}`);
  const ws = new WebSocket(url);

  let enableSend = true;
  let enableReceive = true;

  let wrapper;
  let main;
  let api;
  let connected = false;
  let countInActive = false;
  let loopActive = false;
  let playbackSpeed = 1;
  let fileBuffer;
  $: if (fileBuffer) {
    // load file when it updates
    api.load(fileBuffer);
  }

  let lastSelectedBar;

  async function handleAction(m) {
    console.log('got command', m);
    // perform actions
    if (m.type === 'playpause') {
      api.playPause();
    } else if (m.type === 'stop') {
      api.stop();
    } else if (m.type === 'countInActive') {
      countInActive = m.value;
      if (countInActive) {
        api.countInVolume = 1;
      } else {
        api.countInVolume = 0;
      }
    } else if (m.type === 'loopActive') {
      loopActive = m.value;
      api.isLooping = m.value;
    } else if (m.type === 'speed') {
      playbackSpeed = +m.value;
      api.playbackSpeed = +m.value;
    } else if (m.type === 'selectedBarRange') {
      // see https://github.com/CoderLine/alphaTab/discussions/1385
      const [start, end] = m.value.sort();
      const masterBar1 = api.score.masterBars[start];
      const masterBar2 = api.score.masterBars[end];
      const startTick = api.tickCache.getMasterBarStart(masterBar1);
      // const endTick = api.tickCache.getMasterBarStart(masterBar2);

      // get last beat of bar2
      const endTick =
        api.tickCache.getMasterBarStart(masterBar2.nextMasterBar) - 1;

      // const lastBeat = masterBar2
      // const endTick = api.tickCache.getBeatStart(beat);

      // wait for alphaTab to perform the click and then overwrite...
      setTimeout(() => {
        api.tickPosition = startTick;
        if (start !== end) {
          api.playbackRange = { startTick, endTick };
        } else {
          api.playbackRange = null;
        }
      }, 500);
    }
  }

  const initWebSocket = () => {
    ws.onopen = () => {
      connected = true;
    };
    ws.onmessage = async (msg) => {
      if (enableReceive) {
        console.log('got message', msg);
        // is it a file buffer?
        if (msg.data.size > 1000) {
          fileBuffer = await msg.data.arrayBuffer();
        } else {
          const text = await msg.data.text();
          const m = JSON.parse(text);
          handleAction(m);
        }
      } else {
        console.log('receiving disabled');
      }
    };
    ws.onclose = () => {
      console.warn('connection closed');
      connected = false;
    };
    console.log(ws);
  };

  const sendMsg = (msg) => {
    if (enableSend) {
      console.log('sending mesage', msg);
      const msgString = JSON.stringify(msg);
      ws.send(msgString);
    } else {
      console.log('sending disabled');
    }
    if (!enableSend || !enableReceive) {
      // still want to perform action locally
      handleAction(msg);
    }
  };

  const handleFileInput = async (evt) => {
    console.log(evt.target.files[0]);
    const buffer = await evt.target.files[0].arrayBuffer();
    ws.send(buffer);
  };

  const initTab = () => {
    // load elements
    wrapper = document.querySelector('.at-wrap');
    main = wrapper.querySelector('.at-main');

    // initialize alphatab
    const settings = {
      file: 'https://www.alphatab.net/files/canon.gp',
      player: {
        enablePlayer: true,
        soundFont:
          'https://cdn.jsdelivr.net/npm/@coderline/alphatab@latest/dist/soundfont/sonivox.sf2',
        scrollElement: wrapper.querySelector('.at-viewport'),
      },
      display: {
        // ScoreTab, Score, Tab, TabMixed https://www.alphatab.net/docs/reference/settings/display/staveprofile/
        staveProfile: 'Tab',
      },
      notation: {
        scoreArtist: false,
        scoreAlbum: false,
        scoreCopyright: false,
      },
    };
    api = new alphaTab.AlphaTabApi(main, settings);

    // overlay logic
    const overlay = wrapper.querySelector('.at-overlay');
    api.renderStarted.on(() => {
      overlay.style.display = 'flex';
    });
    api.renderFinished.on(() => {
      overlay.style.display = 'none';
    });

    // track selector
    function createTrackItem(track) {
      const trackItem = document
        .querySelector('#at-track-template')
        .content.cloneNode(true).firstElementChild;
      trackItem.querySelector('.at-track-name').innerText = track.name;
      trackItem.track = track;
      trackItem.onclick = (e) => {
        e.stopPropagation();
        api.renderTracks([track]);
      };
      return trackItem;
    }
    const trackList = wrapper.querySelector('.at-track-list');
    api.scoreLoaded.on((score) => {
      // clear items
      trackList.innerHTML = '';
      // generate a track item for all tracks of the score
      score.tracks.forEach((track) => {
        trackList.appendChild(createTrackItem(track));
      });
    });
    api.renderStarted.on(() => {
      // collect tracks being rendered
      const tracks = new Map();
      api.tracks.forEach((t) => {
        tracks.set(t.index, t);
      });
      // mark the item as active or not
      const trackItems = trackList.querySelectorAll('.at-track');
      trackItems.forEach((trackItem) => {
        if (tracks.has(trackItem.track.index)) {
          trackItem.classList.add('active');
        } else {
          trackItem.classList.remove('active');
        }
      });
    });

    /** Controls **/
    api.scoreLoaded.on((score) => {
      wrapper.querySelector('.at-song-title').innerText = score.title;
      wrapper.querySelector('.at-song-artist').innerText = score.artist;
    });

    const countIn = wrapper.querySelector('.at-controls .at-count-in');
    countIn.onclick = () => {
      sendMsg({
        type: 'countInActive',
        value: !countInActive,
      });
    };

    const metronome = wrapper.querySelector('.at-controls .at-metronome');
    metronome.onclick = () => {
      metronome.classList.toggle('active');
      if (metronome.classList.contains('active')) {
        api.metronomeVolume = 1;
      } else {
        api.metronomeVolume = 0;
      }
    };

    const loop = wrapper.querySelector('.at-controls .at-loop');
    loop.onclick = () => {
      sendMsg({
        type: 'loopActive',
        value: !loopActive,
      });
    };

    const zoom = wrapper.querySelector('.at-controls .at-zoom select');
    zoom.onchange = () => {
      const zoomLevel = parseInt(zoom.value) / 100;
      api.settings.display.scale = zoomLevel;
      api.updateSettings();
      api.render();
    };

    const layout = wrapper.querySelector('.at-controls .at-layout select');
    layout.onchange = () => {
      switch (layout.value) {
        case 'horizontal':
          api.settings.display.layoutMode = alphaTab.LayoutMode.Horizontal;
          break;
        case 'page':
          api.settings.display.layoutMode = alphaTab.LayoutMode.Page;
          break;
      }
      api.updateSettings();
      api.render();
    };

    // player loading indicator
    const playerIndicator = wrapper.querySelector(
      '.at-controls .at-player-progress',
    );
    api.soundFontLoad.on((e) => {
      const percentage = Math.floor((e.loaded / e.total) * 100);
      playerIndicator.innerText = percentage + '%';
    });
    api.playerReady.on(() => {
      playerIndicator.style.display = 'none';
    });

    // main player controls
    const playPause = wrapper.querySelector(
      '.at-controls .at-player-play-pause',
    );
    const stop = wrapper.querySelector('.at-controls .at-player-stop');
    playPause.onclick = (e) => {
      if (!e.target.classList.contains('disabled')) {
        sendMsg({ type: 'playpause' });
      }
    };
    stop.onclick = (e) => {
      if (!e.target.classList.contains('disabled')) {
        sendMsg({ type: 'stop' });
      }
    };
    api.playerReady.on(() => {
      playPause.classList.remove('disabled');
      stop.classList.remove('disabled');
    });
    api.playerStateChanged.on((e) => {
      const icon = playPause.querySelector('i.fas');
      if (e.state === alphaTab.synth.PlayerState.Playing) {
        icon.classList.remove('fa-play');
        icon.classList.add('fa-pause');
      } else {
        icon.classList.remove('fa-pause');
        icon.classList.add('fa-play');
      }
    });

    // song position
    function formatDuration(milliseconds) {
      let seconds = milliseconds / 1000;
      const minutes = (seconds / 60) | 0;
      seconds = (seconds - minutes * 60) | 0;
      return (
        String(minutes).padStart(2, '0') +
        ':' +
        String(seconds).padStart(2, '0')
      );
    }

    const songPosition = wrapper.querySelector('.at-song-position');
    let previousTime = -1;
    api.playerPositionChanged.on((e) => {
      // reduce number of UI updates to second changes.
      const currentSeconds = (e.currentTime / 1000) | 0;
      if (currentSeconds == previousTime) {
        return;
      }

      songPosition.innerText =
        formatDuration(e.currentTime) + ' / ' + formatDuration(e.endTime);
    });

    // api.playbackRangeChanged.on((args) => {
    //   // console.log(args);
    //   // if (args.playbackRange) {
    //   //     highlightRangeInProgressBar(args.playbackRange.startTick, args.playbackRange.endTick);
    // });

    api.beatMouseDown.on((beat) => {
      const bar = beat.voice.bar;
      lastSelectedBar = bar.index;
    });

    api.beatMouseUp.on((beat) => {
      const bar = beat.voice.bar;
      sendMsg({
        type: 'selectedBarRange',
        value: [lastSelectedBar, bar.index],
      });
    });
  };

  onMount(() => {
    initWebSocket();
    initTab();
  });

  onDestroy(() => {
    ws.close();
  });

  const handleKeyPress = (evt) => {
    console.log(evt.key);
  };
</script>

<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<main on:keydown="{handleKeyPress}">
  <div class="at-wrap">
    <div class="at-overlay">
      <div class="at-overlay-content">Music sheet is loading</div>
    </div>
    <div class="at-content">
      <div class="at-sidebar">
        <div class="at-sidebar-content">
          <div class="at-track-list"></div>
        </div>
      </div>
      <div class="at-viewport">
        <div class="at-main"></div>
      </div>
    </div>
    <div class="at-controls">
      <div class="at-controls-left">
        <i
          class="fas fa-signal"
          style="color: {connected ? 'green' : 'inherit'}"
          title="{connected ? `connected to ${url}` : 'not connected'}"
        ></i>
        <a
          class="btn toggle {enableSend ? 'active' : ''}"
          title="enable/disable sending interactions"
          on:click="{() => (enableSend = !enableSend)}"
        >
          <i class="fas fa-upload"></i>
        </a>
        <a
          class="btn toggle {enableReceive ? 'active' : ''}"
          title="enable/disable receiving interactions"
          on:click="{() => (enableReceive = !enableReceive)}"
        >
          <i class="fas fa-download"></i>
        </a>
        <a
          class="btn"
          title="open a file"
          on:click="{() => document.querySelector('#fileInput').click()}"
        >
          <i class="fas fa-file"></i>
          <input
            id="fileInput"
            type="file"
            on:input="{handleFileInput}"
            style="display: none"
            accept=".gp,.gp3, .gp5"
          />
        </a>
        <a class="btn at-player-stop disabled" title="stop and back to start">
          <i class="fas fa-step-backward"></i>
        </a>
        <a class="btn at-player-play-pause disabled" title="play/pause">
          <i class="fas fa-play"></i>
        </a>
        <span class="at-player-progress">0%</span>
        <div class="at-song-info">
          <span class="at-song-title"></span> -
          <span class="at-song-artist"></span>
        </div>
        <div class="at-song-position">00:00 / 00:00</div>
      </div>
      <div class="at-controls-right">
        <a
          class="btn toggle at-count-in {countInActive ? 'active' : ''}"
          title="count-in"
        >
          <i class="fas fa-hourglass-half"></i>
        </a>
        <a class="btn at-metronome" title="metronome">
          <i class="fas fa-edit"></i>
        </a>
        <a class="btn at-loop {loopActive ? 'active' : ''}" title="loop">
          <i class="fas fa-retweet"></i>
        </a>
        <div class="at-speed" title="playback speed">
          <i class="fas fa-gauge-simple"></i>
          <select
            bind:value="{playbackSpeed}"
            on:change="{(evt) =>
              sendMsg({ type: 'speed', value: +evt.target.value })}"
          >
            <option value="{0.5}">50%</option>
            <option value="{0.6}">60%</option>
            <option value="{0.7}">70%</option>
            <option value="{0.75}">75%</option>
            <option value="{0.8}">80%</option>
            <option value="{0.85}">85%</option>
            <option value="{0.9}">90%</option>
            <option value="{0.95}">95%</option>
            <option value="{1.0}">100%</option>
            <option value="{1.1}">110%</option>
            <option value="{1.1}">110%</option>
            <option value="{1.25}">125%</option>
          </select>
        </div>
        <div class="at-zoom" title="zoom">
          <i class="fas fa-search"></i>
          <select>
            <option value="25">25%</option>
            <option value="50">50%</option>
            <option value="75">75%</option>
            <option value="90">90%</option>
            <option value="100" selected>100%</option>
            <option value="110">110%</option>
            <option value="125">125%</option>
            <option value="150">150%</option>
            <option value="200">200%</option>
          </select>
        </div>
        <div class="at-layout" title="layout">
          <select>
            <option value="horizontal">Horizontal</option>
            <option value="page" selected>Page</option>
          </select>
        </div>
      </div>
    </div>
  </div>

  <template id="at-track-template">
    <div class="at-track">
      <div class="at-track-icon">
        <i class="fas fa-guitar"></i>
      </div>
      <div class="at-track-details">
        <div class="at-track-name"></div>
      </div>
    </div>
  </template>
</main>

<style>
  main {
    width: 100vw;
    height: 100vh;
  }
</style>
