export default class AudioPlayer {
  constructor() {
    this.url = null;
    this.player = null;
  }

  playPause(url) {
    if (url === this.url) {
      this.player.pause();
    } else {
      if (this.player) {
        this.player.pause();
        this.player = null;
      }
      this.player = new Audio(url);
      this.player.volume = 0.2;
      this.player.autoplay = false;
      this.player
        .play()
        .catch((e) => console.error('Error playing audio: ' + e));
    }
    this.url = url;
  }
}
