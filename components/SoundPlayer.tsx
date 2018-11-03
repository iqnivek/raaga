import * as React from "react";
import { SoundPlayerProps, SoundPlayerState } from "./typings/SoundPlayer";
import { getMidiRange, isWithinRange, Player } from "@utils";
import {
  flexOne,
  loaderClass,
  pianoWrapper
} from "@components/styles/SoundPlayer.styles";
import { colors, Loader } from "@anarock/pebble";
import { getPianoRangeAndShortcuts } from "@config/piano";
import { MIDI, Track } from "midiconvert";
import Visualizer from "@components/Visualizer";
import { NoteWithEvent, CanvasWorkerInterface } from "@utils/typings/Player";
import { connect } from "react-redux";
import { Store } from "@typings/store";
import { Piano } from "./Piano";
import { css, cx } from "emotion";
import Header from "@components/Header";
import CanvasWorker from "@workers/canvas.worker";
import { getInstrumentById, instruments } from "midi-instruments";
import PlayerController from "@components/PlayerController";
import { ReducersType } from "@enums/reducers";
import { Transition } from "react-spring";
import { VISUALIZER_MODE } from "@enums/visualizerMessages";

const { range } = getPianoRangeAndShortcuts([38, 88]);

const canvasWorker: CanvasWorkerInterface = new CanvasWorker();

class SoundPlayer extends React.PureComponent<
  SoundPlayerProps,
  SoundPlayerState
> {
  player = new Player({
    canvasWorker,
    range
  });

  state: SoundPlayerState = {
    instrument: instruments[0].value,
    loading: false,
    activeMidis: [],
    keyboardRange: range,
    isPlaying: false
  };

  private resetPlayer = () => {
    this.player.clear();
    this.setState({
      activeMidis: []
    });
  };

  private changeInstrument = async (instrument = this.state.instrument) => {
    this.setState({ loading: true });
    await this.player.loadSoundFont(instrument);
    this.setState({
      instrument,
      loading: false
    });
  };

  private setRange = notes => {
    // change piano range.
    const requiredRange = getMidiRange(notes);
    if (!isWithinRange(requiredRange, [range.first, range.last])) {
      this.setState(
        {
          keyboardRange: getPianoRangeAndShortcuts(requiredRange).range,
          isPlaying: true
        },
        () => {
          this.player.setRange(this.state.keyboardRange);
        }
      );
    }
  };

  componentDidUpdate(prevProps: Readonly<SoundPlayerProps>): void {
    // reset player if mode changes.
    if (prevProps.settings.mode !== this.props.settings.mode) {
      this.resetPlayer();
    }
  }

  private preparePlayerForNewTrack = async (selectedTrack: Track) => {
    const { notes } = selectedTrack;
    this.setRange(notes);

    // change instrument if info present in midi.
    if (selectedTrack.instrumentNumber) {
      const { value } = getInstrumentById(selectedTrack.instrumentNumber);
      if (value === this.state.instrument) return;

      await this.changeInstrument(value);
    } else {
      if (this.state.instrument === instruments[0].value) return;
      await this.changeInstrument();
    }
  };

  componentDidMount() {
    this.changeInstrument();
  }

  onRecordPlay = (notesPlaying: NoteWithEvent[], isComplete) => {
    if (isComplete) {
      this.player.stopTrack();
      this.setState({
        activeMidis: []
      });
    } else {
      this.setState({
        activeMidis: notesPlaying.map(note => note.midi)
      });
    }
  };

  // private stopRecording = () => {
  //   this.player.stopRecording();
  //   this.player.playRecording(this.props.selectedTrack, this.onRecordPlay);
  // };

  private onNoteStart = midi => {
    this.player.playNote(midi);
    this.setState(state => ({
      activeMidis: state.activeMidis.concat(midi)
    }));
  };

  private onNoteStop = midi => {
    this.player.stopNote(midi);
    this.setState(state => ({
      activeMidis: state.activeMidis.filter(activeMidi => activeMidi !== midi)
    }));
  };

  private onTogglePlay = () => {
    this.player.toggle();

    this.setState({
      isPlaying: !this.state.isPlaying
    });
  };

  private selectTrack = (midi: MIDI, i: number) => {
    const track = midi.tracks[i];

    this.props.dispatch({
      type: ReducersType.LOADED_MIDI,
      payload: midi
    });
    this.props.dispatch({
      type: ReducersType.SET_SELECTED_TRACK,
      payload: track
    });

    this.resetPlayer();
    this.preparePlayerForNewTrack(track);
  };

  private startPlayingTrack = async (track = this.props.selectedTrack) => {
    // in case the sound-fonts are not yet loaded.
    await this.preparePlayerForNewTrack(track);

    this.player.playTrack(this.props.loadedMidi, track, this.onRecordPlay);
  };

  render() {
    const {
      instrument,
      loading,
      activeMidis,
      keyboardRange,
      isPlaying
    } = this.state;

    const {
      settings: { mode }
    } = this.props;

    return (
      <>
        <div className={flexOne}>
          <Header
            onTogglePlay={this.onTogglePlay}
            isPlaying={isPlaying}
            instrument={instrument}
            mode={mode}
          />
          <Transition
            native
            items={mode === VISUALIZER_MODE.READ}
            from={{ opacity: 0 }}
            enter={{ opacity: 1 }}
            leave={{ opacity: 0, pointerEvents: "none" }}
          >
            {show =>
              show &&
              (styles => (
                <PlayerController
                  style={styles}
                  onTogglePlay={this.onTogglePlay}
                  isPlaying={isPlaying}
                  midi={this.props.loadedMidi}
                  onTrackSelect={this.selectTrack}
                  onComplete={this.startPlayingTrack}
                />
              ))
            }
          </Transition>

          <Visualizer
            range={keyboardRange}
            mode={mode}
            canvasWorker={canvasWorker}
          />
        </div>
        <div style={{ height: 300 }}>
          <div className={pianoWrapper}>
            {loading && (
              <Loader className={loaderClass} color={colors.white.base} />
            )}
            <Piano
              activeMidis={activeMidis}
              onPlay={this.onNoteStart}
              onStop={this.onNoteStop}
              min={keyboardRange.first}
              max={keyboardRange.last}
              className={cx({
                [css({ opacity: 0.2 })]: loading
              })}
            />
          </div>
        </div>
      </>
    );
  }
}

export default connect(({ settings, loadedMidi, selectedTrack }: Store) => ({
  settings,
  loadedMidi,
  selectedTrack
}))(SoundPlayer);
