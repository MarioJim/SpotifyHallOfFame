interface InitialState {
  status: 'initial';
}

interface PausedState {
  status: 'paused';
  url: string;
  player: HTMLAudioElement;
}

interface PlayingState {
  status: 'playing';
  url: string;
  player: HTMLAudioElement;
}

type AudioPlayerState = InitialState | PausedState | PlayingState;

export default class AudioPlayer {
  state: AudioPlayerState;

  constructor() {
    this.state = { status: 'initial' };
  }

  playPause(url: string) {
    if (this.state.status === 'initial') {
      this.#reset(url);
    } else if (this.state.status === 'playing') {
      this.state.player.pause();
      if (this.state.url === url) {
        this.state = { ...this.state, status: 'paused' };
      } else {
        this.#reset(url);
      }
    } else if (this.state.status === 'paused') {
      if (this.state.url === url) {
        this.state.player.play();
        this.state = { ...this.state, status: 'playing' };
      } else {
        this.#reset(url);
      }
    }
  }

  #reset(url: string) {
    const player = new Audio(url);
    player.volume = 0.2;
    player.autoplay = false;
    player.addEventListener('ended', () => {
      this.state = { status: 'initial' };
    });
    player.play().catch((e) => console.error('Error playing audio: ' + e));

    this.state = { status: 'playing', player, url };
  }
}
