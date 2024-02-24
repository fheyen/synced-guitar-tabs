<script>
  import { onMount } from 'svelte';

  const ws = new WebSocket('ws://localhost:8080');

  // Browser WebSockets have slightly different syntax than `ws`.
  // Instead of EventEmitter syntax `on('open')`, you assign a callback
  // to the `onopen` property.
  onMount(() => {
    ws.onopen = () => {
      document.querySelector('#send').disabled = false;

      document.querySelector('#send').addEventListener('click', () => {
        ws.send(document.querySelector('#message').value);
      });
    };

    ws.onmessage = async (msg) => {
      console.log('got message', msg);
      const text = await msg.data.text();
      document.querySelector('#messages').innerHTML += `<div>${text}</div>`;
    };

    ws.onclose = () => {
      alert('connection closed');
    };

    console.log(ws);
  });
</script>

<main>
  <h1>Chat</h1>
  <div>
    <input id="message" placeholder="Message" />
    <button id="send" disabled="{true}">Send</button>
  </div>
  <div id="messages"></div>
</main>

<style>
</style>
