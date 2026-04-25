---
title: "VirtualDJ - User Manual - Appendix - List of Options"
source: "https://www.virtualdj.com/manuals/virtualdj/appendix/optionslist.html"
author:
  - "[[VirtualDJ Website]]"
published:
created: 2025-02-18
description: "With over 100,000,000 downloads, VirtualDJ packs the most advanced DJ technology. Both perfect to start DJing, and perfect for advanced pro DJs."
tags:
  - "clippings"
---
[Appendix](https://www.virtualdj.com/manuals/virtualdj/appendix/index.html)  # List of Options

  

## Automation

autoBPMMatch

Automatically change the pitch to match the BPM of the other deck when a new song is loaded ("smart" means only when the song's bpm is within 10% of the other deck's song)

  

autoPitchLock

Automatically engages pitch\_lock whenever BPMs are matched, so that moving manually one pitch slider will move the other in order to keep the match

  

autoGain

Automatically set the gain to make the song's overall volume 0dbA when a song is loaded (or remember any previous manual modification of the gain)

  

autoKey

Automatically change the key when a song is loaded to match the key of the song on the other deck when the key difference is up to 1 semitone

  

autoCue

Automatically goes to the first cue or first beat when a song is loaded

  

smartPlay

Automatically start playing from the nearest position that would get the song beatmatched

  

smartPlayLimitPitchRange

When on, smartPlay will only match bpm if it is within 10% of the current bpm, preventing too big speed differences

  

smartCue

Automatically adjust the jump position to keep the song beatmatched

  

smartLoop

Automatically adjust the loop points when setting a loop so that the loop is seamless

  

quantizeLoop

Automatically adjust the loop position to the quantized position

  

quantizeSetCue

Automatically adjust setting cue position to the quantized position

  

globalQuantize

Select 1 to make quantized functions jump to beat boundaries, 4 to jump to measures boundaries, or 0.25 to jump on quarters boundaries.

  

smartScratch

Automatically mute the volume when scratching backward

  

cueLoopAutoSync

When on, cue\_loop will be quantized to the beat

  

resetPitchOnLoad

Automatically reset the pitch to +0% when you load a new song

  

resetEqOnLoad

Automatically reset all the equalizers and filter to 0 when you load a new song

  

resetStemsOnLoad

Automatically reset the stems when you load a new song

  

resetFXOnLoad

Automatically stop all the effects when you load a new song

  

resetKeyOnLoad

Reset key to normal when you load a new song.

  

resetGainOnLoad

Reset gain and apply autoGain when enabled when you load a new song. This option has no effect when a controller that applies gain in hardware is used

  

autoHeadphones

Automatically switch the headphones and selected deck to the song that has just been loaded or touched

  

pflOnSelect

Automatically switch the PFL when a deck is selected

  

keyMatching

Standard allows automatic key matching to change the key by one semi-tone, in order to harmonically match to the other song. Fuzzy will also allow changes from major to minor key, and fuzzy full will allow changing the track up to 2 semi-tones to harmonically match the other track

  
  

## Controls

playMode

Select if the play and stop buttons act as play-stutter and pause-stop, or play-pause and stop

  

cueMode

Select if the cue button act as cue, cue-hold (will keep playing if cue is pressed more than 2s), or cue-cup (play on release, stop and rewind on push)

  

hotcueMode

Select if hotcue buttons play or stutter

  

updateHotCueOnCueCombo

When a hot cue is pressed while holding the deck's CUE button, it will update the cue to the current cue position instead of jumping to the cue

  

hotcueSavesLoop

When a hot cue is saved while a loop is active, the loop will be saved with the hot cue

  

loopBackMode

Select, when a loop is set by number of beats ('loop 4'), if the loop starts from the current position (no) or ends at the current position (yes). Smart means set start when paused or set end when playing.

  

loopAutoMove

Select if the loop is kept and moved to the new position when a cue is called during a loop

  

loopDefault

Default number of beats used in loops

  

loopRollDefault

Default number of beats used in loopRolls

  

beatjump

Number of beats the beatjump script will jump

  

keepPlayingPastEnd

When on, the song keeps playing after the end and you have to press cue manually to stop the song

  

keepPlayStatusOnLoadSong

When on, a new song loaded to the deck will start playing automatically if the previous song in the deck was playing

  

eqMode

Select which algorithm the EQ knobs control

  

eqModeDual

Use extra decks on 4-deck mixers to control both frequency and modern EQs at the same time

  

stemsBleedMuteVocal

Control how much the "fast" stems separation algorithm will allow bleeding when muting vocals. 0% means strict separation (remove more vocal, but might remove other frequencies), 100% means less strict (might remove less vocal, but keep the original song more intact).

  

stemsBleedMuteInstru

Control how much the "fast" stems separation algorithm will allow bleeding when muting instruments. 0% means strict separation (remove more instrument, but might remove other frequencies), 100% means less strict (might remove less instrument, but keep the original song more intact).

  

stemsBleedOnlyVocal

Control how much the "fast" stems separation algorithm will allow bleeding when isolating vocals. 0% means strict separation (isolate better, but might remove some vocal frequencies too), 100% means less strict (might isolate less, but keep the vocal more intact).

  

stemsBleedOnlyInstru

Control how much the "fast" stems separation algorithm will allow bleeding when isolating instruments. 0% means strict separation (isolate better, but might remove some instrument frequencies too), 100% means less strict (might isolate less, but keep the instrument more intact).

  

stemsSplitLeftRight

When enabled, stems\_split will split from deck 1->2 and 3->4. When false, split from deck 1->3 and deck 2->4

  

vinylMode

In Vinyl mode, touching the disc on the skin or the jogwheel on a controller stop the song and scratch. In CD mode, it speed up or slow down a little the song.

  

masterTempo

Make the pitch slider changes the speed of the song, but not its key

  

pitchRange

Set how far the pitch slider can move

  

autoPitchRange

Automatically adjust the range of the pitch when pitch-matching requires a broader range

  

pitchResetSpeed

How fast pitch reset moves the pitch (in percent per second, default 1 percent per second)

  

faderStart

Automatically starts to play when the volume fader is moved up

  

faderStartStop

Automatically stops to play when the volume fader is moved down to zero (requires faderStart to be enabled as well)

  

crossfaderCurve

Defines how the crossfader behaves

  

crossfaderDisable

Disable the crossfader

  

crossfaderCustom

Save a custom configuration for the crossfader

  

crossfaderHamster

Invert the crossfader (so that putting the crossfader to the left-most position makes the right deck audible and the left deck silenced)

  

levelfaderHamster

Invert the fader (so that it is fully on when down and fully off when up)

  

effects

remember the plugins loaded on the deck slots

  

masterEffects

remember the plugins loaded on the master effect slots

  

mixFx

The last selected mix effect when using the crossfader

  

pluginBanks

  

padsPagesOrder

  

padsPagesHidden

List of pages hidden from the page selection drop-down

  

sixteenPadsMode

When on auto, 16-pads mode is enabled only when a controller with 16 pads is connected.

  

padsPagesChanged

Pads Pages modified from the controller defaults

  

padsSkinIndependent

Set to true to keep the pads on the skin independent from the controllers

  

loopPadPage

Loop pad page currently selected on each deck

  

autoSortCues

Automatically sort cue points chronologically

  

autoBpmTransitionLength

Length of transition done by auto\_bpm\_transition in beats

  
  

## Skins

skinWaveformType

Set waveform type in skins that support it

  

coloredWaveforms

Select which color scheme is used on the waveforms to identify the beat, vocal and instrumental areas

  

skinWaveformType

Set waveform type in skins that support it

  

skinOverviewType

Set the waveform type for the overview display in decks ('auto' follows the main waveform type)

  

skinWaveformScratchType

Set the waveform type for vertical scratch waves

  

coloredWaveforms

Select which color scheme is used on the waveforms to identify the beat, vocal and instrumental areas

  

waveUseFrequency

Use frequencies instead of stems to calculate the colors in the colors waveform

  

waveGrayOnKill

Show in gray the stems that are removed on the shape waveform

  

waveformCenter

  

skinPlayheadShadow

Set whether songpos waveform shows the shadow on the playhead marker

  

showGridLines

Show grid lines on the scratch and rhythm waves

  

beatCounterRange

Set over how many beats the beat counter on the skin is counting (default: 16)

  

rhythmZoom

Zoom level of the horizontal rhythm and scratch display

  

scratchZoomVertical

Zoom level of the vertical scratch display

  

touchScreenMode

force a set of options usually used with touchscreens (gridview in the browser, maximized window, bigger handles on splitviews)

  

multiTouchTwoFingerScroll

Enable scrolling with two fingers on touch-screens

  

onScreenKeyboard

Show an on-screen keyboard when you need to edit something

  

keyboardShowKeymapOverlay

While holding CTRL or ALT, show keyboard mapping overlay in browser area on supported mappers

  

keyboardKeymapOverlayOnStickyKeys

While sticky keys is on (double-press ALT, or key assigned to keyboard\_shortcuts) the keyboard mapping overlay will stay visible

  

skinEmptyButtons

Show or hide some extra empty customizable buttons on the default skins

  

customButtons

Actions saved for the various custom buttons and custom knobs

  

skin3FxLayout

Switch between "1 FX with 3 knobs" and "3 FX with 1 knob each" layouts

  

skin6FxLayout

Switch to "6 FX with 1 knob" layout

  

vuMeter

  

clockDisplay

  

dateFormat

Select how dates are shown in the browser

  

cueDisplay

Select what is shown on hotcue buttons

  

savedLoopDisplay

Select what is shown on the saved loop buttons

  

displayTime

Select the way song time is displayed (elapsed, remain, total)

  

keyDisplay

Show keys on deck and browser either in Musical format (C, C#, D, etc...) or Harmonic (01A, 02A, 01B, ...)

  

cpuMeter

Show in the CPU meter how fast the whole system is running, or how fast the audio subsystem is running.

  

hideSongInfo

Hide the song's title and artist from the skin, if you don't want people behind you to be able to see which tracks you are playing

  

tooltip

Show or hide the tooltips

  

tooltipDelay

Delay during which the mouse must stop before the tooltip is shown

  

showCoverForDragDrop

show the cover of the files being dragged during drag-and-drop operations

  

RPM

Rotation speed of the domes on the skin (default: 33)

  

dialogsColorTheme

Force the dialogs and menus to use a light-color or dark-color theme

  

cleartype

Use ClearType to show sharper text on laptops

  

maximized

Select if the skin is maximized to use the full desktop (1), use the full desktop including the taskbar (2), or windowed (0)

  

skin

Name of the current skin file

  

skinWindows

  

skinPanels

Skin panel visibility

  

skinTextzones

Skin text zones

  

skinSplitState

Skin split state

  

skinRacks

Skin rack state

  
  

## Audio

audioAutoDetect

Keep checking for new devices to detect when a known soundcard is plugged in

  

exclusiveAudioAccess

When set to yes, VirtualDJ will take exclusive control of your soundcard, meaning that all other applications running in the background will stop to make any sound while VirtualDJ is active

  

splitHeadphones

If set to true, the headphones will have the master in the left ear and the PFL in the right ear

  

equalizerInHeadphones

Set to yes (default) if you want to hear the equalizer on the PFL, or no if you want to hear the original song

  

headphonesGain

Set the gain applied to the headphones output

  

prelistenOutput

Selects which deck is used to output the prelisten sound (from the editors or the info panel preview). 0 means automatically select the deck that is not currently on air

  

boothMicrophone

The microphone input is also heard on the booth audio output

  

microphoneToMaster

The microphone input is heard on the master audio output (when false, microphone will be included in recording, but not heard on master output)

  

metronomeVolume

Set the volume used by the metronome ticks in the BPM Editor

  

gainSliderIncludesAutoGain

when set to yes, the gain knob on the skin shows at 100% when the gain is equal to the automatic value. When set to no, 100% on the knobs means no gain applied.

  

faderCurve

Set the curve for the volume sliders (0=linear, 0.5=quadratic, 1=logarithmic)

  

zeroDB

Add additional headroom to prevent distortion when mixing several tracks together by lowering the volume

  

rampStartTime

Simulate how a real turntable needs time to reach its full speed when started

  

rampStopTime

Simulate how a real turntable brakes to reach full stop when stopped

  

rampScratchTime

Simulate how a real turntable needs time to react when the disc is touched

  

equalizerFrequencySpread

Defines the spread of the equalizer bands. "Default" has each band narrow around their frequency, while "Full Kill" has each band extending to share its border with the next band (meaning if you kill all 3 bands in "Full Kill" mode, you'll get silence, while if you kill all 3 bands in "Default" mode, you'll get everything except the bass, medium and high bands)

  

equalizerLowFrequency

Set the central frequency used by the Low equalizer

  

equalizerMidFrequency

Set the central frequency used by the Mid equalizer

  

equalizerHighFrequency

Set the central frequency used by the High equalizer

  

filterDefaultResonance

Set the amount of resonance applied by the filter

  

fxProcessing

Select if effects are processed before or after level fader and crossfader (pre-fader or post-fader)

  
  

## Video

useVideoSkin

Enable or disable video skins

  

videoSkin

Name of the current video skin

  

showVideoSkinOnPreview

Show the video skin on the video preview on the main skin

  

videoLogo

Show a logo on the bottom-right corner of the video output (you need a VirtualDJ PRO license to be able to remove or change the logo)

  

videoLogoImage

Select which image is used for the video logo (you need a VirtualDJ PRO license to be able to remove or change the logo)

  

videoLogoSize

Select the size of the video logo (you need a VirtualDJ PRO license to be able to remove or change the logo)

  

videoLogoPosition

Select the position of the video logo (you need a VirtualDJ PRO or Controller license, or a Karaoke subscription to be able to change the logo position)

  

videoCrossfader

Define the behavior of the video crossfader (Separate to control both audio and video separately, Linked to control both together, Smart to let VirtualDJ moves the video crossfader automatically to follow what the audience is hearing)

  

videoVolumeLink

Moving the volume sliders automatically moves the video levels too

  

videoTransition

Select which video transition plugin is used to fade between two video sources when the video crossfader is moving

  

videoRandomTransition

Automatically select a new video transition plugin randomly for each transition

  

videoFx

Select which video fx plugin is currently loaded

  

videoAudioOnlyVisualisation

Select which visualization plugin will be used when a song with no video track is played and the video output is opened

  

letterBoxing

Select how to handle the difference in aspect ratio between your video files and your video output window

  

videoFPS

Set the number of Frame Per Seconds used by the video engine

  

videoMicroFrames

Enhance the quality of the video at lower speed, by adding "MicroFrames" between the regular frames. When set to "smart", MicroFrames are used only when scratching or playing at low speed.

  

videoResampleQuality

Quality of the video when rescaling. High can look better, but may require a faster video card.

  

videoShaderQuality

Force visualization shaders to a lower quality, if your videocard is not powerful enough to keep up with the desired framerate

  

videoUseDXVA

If set to true, the video engine will use Hardware Acceleration (DXVA) from your videocard, if available

  

videoDriver

Show which video driver is being used by your computer

  

videoMaxMemory

Enforce a hard limit on the amount of video memory from the video card VirtualDJ can consume

  

videoForceFullscreen

force the video output to use fullscreen mode (can help if you have a dual-videocard system). 0 for default, -1 for alternative video mode

  

videoDelay

Set a delay (positive or negative) between the video output and the audio output (in milliseconds)

  

videoWindowAlwaysOnTop

Keeps the video window always above all other windows

  

videoWindowPosition

Video Window Positions

  

videoCreateLinkOnDrop

Dropping a video on the video preview area or cover art of an audio file will automatically create a video edit of the audio file

  

startVideoOnLoad

Automatically open the video output window when you load a video track

  
  

## Karaoke

karaokeBackground

  

karaokeBackgroundMusic

Select which folder is used to play background music between karaoke song, when the karaoke mode is active. (can also be "automix" (default) or "sidelist", to respectively use the automix playlist or the sidelist playlist from the sideView)

  

karaokeBackgroundImage

Select which image will be displayed when the background music is playing and karaokeBackground is set to image (between karaoke songs)

  

karaokeBackgroundVolume

Set the volume at which the background music is played, between karaoke songs

  

karaokeVideoSkin

Select video skin to be used while karaoke is active

  

karaokeSkipSilence

Automatically skip silence at end of karaoke song when playing background music in karaoke mode

  

karaokeAutoRemovePlayed

Remove played tracks automatically when in karaoke mode

  

karaokeDualDeck

When enabled, play karaoke on one deck and background music on another deck. Otherwise karaoke and background music play on the same deck

  
  

## Controllers

mixerOrder

For 4-deck controllers, defines the order of the decks from left to right

  

controllerTakeoverMode

Defines how sliders and knob are behaving when the value on the controller doesn't match the value on the skin: "Instant" means as soon as you touch the slider on the controller, VirtualDJ will use the controller's position. "Pickup" means that the controller's slider has no effect until it reaches the current skin's position, at which point both positions become linked again. "Gradual" means that when you move the controller's slider, it will moves the skin's slider in the same direction to gradually match both positions

  

controllerTakeoverModePitch

Defines how the pitch slider on the controller is behaving when it doesn't match the software pitch value: "Instant" means as soon as you touch the slider on the controller, VirtualDJ will use the controller's position. "Pickup" means that the controller's slider has no effect until it reaches the current pitch, at which point both pitch become linked again. "Gradual" means that when you move the controller's slider, it will moves the software's pitch in the same direction to gradually match both positions, "Relative" means that when you move the controller's slider, it will move the software's pitch in the same direction and same amount.

  

touchWheelBackspin

Moving a touchweel backward with the touch part pressed, and releasing it while the wheel is still spinning backward, will continue like if the wheel was still "touched" until the wheel stops moving, to produce a "backspin" effect

  

touchWheelForwardspin

Moving a touchweel forward with the touch part pressed, and releasing it while the wheel is still spinning forward, will continue like if the wheel was still "touched" until the wheel stops moving, to produce a "forward-spin" effect

  

touchWheelSpinThreshold

Minimum speed jogwheel needs to have on release before backspin or forwardspin will be triggered

  

jogSensitivityScratch

Set the sensitivity of the controllers jogwheels when scratching

  

jogSensitivityCue

Set the sensitivity of the controllers jogwheels when cueing

  

jogSensitivityBend

Set the sensitivity of the controllers jogwheels when pitch-bending

  

jogVibrationProtection

If the track is moving on it's own while paused, increase this value to prevent it (Leave on 0 unless there are issues)

  

motorWheelInstantPlay

On controllers with motorized jogwheel, when you press play, the song will play instantly at its normal speed, even if the motor takes some time to reach its nominal speed

  

motorWheelInstantStop

On controllers with motorized jogwheel, when you press pause, the song will stop, even if the motor takes some time to slow down

  

motorWheelSmoothPercent

Helps smoothing the motorized jogwheel speed against fluctuations due to the OS delays in receiving the MIDI or HID messages

  

motorWheelLockTime

Set the number of seconds that VirtualDJ stops to interpret the motorized jogwheel movements after a play or stop action is done (to prevent the wobbling movement of the motor when it abruptly stops)

  

controllerRefreshRate

Maximum refresh rate of MIDI/HID controllers (in ms between refresh). 0 means as fast as possible, which is refresh every 10ms (100 times per seconds).

  

controllerWaveFormZoom

Zoom level for certain controllers with a waveform display

  

disableBuiltInDefinitions

Set to yes if you don't want VirtualDJ to use its built-in controller list to recognize MIDI or HID devices

  

createMidiLog

When on, will create a log file for your MIDI controller, that can be used by our engineers to find problems or help write native support.

  

midiLogLevel

  

showControllersSubDevices

Show display and main device as separate controllers on certain devices for development purposes

  
  

## Timecode

timecodeMode

Select what to do on needle-drop: relative=do nothing, absolute=use the offset from the beginning of the record, smart=use the distance if the jump is small, map the full length of the record to the full length of the song if the jump is bigger.

  

timecodeType

Select which timecode type you are using (will be also set automatically during calibration, except for "VirtualDJ7 CD" which needs to be set manually).

  

timecodeLeadInTime

Move the "start" of the timecode, to skip a section at the beginning of the record if it is damaged from too much use.

  

timecodeAntiSkip

Prevent the song position to change if the needle slipped to the next or previous grooves (only for vinyl in smart mode). The value is how many grooves maximum the antiSkip will absorb.

  

timecodeNeedleDropSync

When needle-dropping, wait to be sure of the new position before starting to play.

  

timecodePitchSliderIgnoreBend

The timecode pitch slider will not move during manual pitch-bend (braking or speeding up the record), but at the expense of a delayed movement of the slider if you make sudden big pitch modifications.

  

timecodeSilence

Level under which the timecode is considered stopped. Raise this value if you perform in a very noisy or vibration-full environment. Lower this value if you want to perform tricks that require very slow scratches.

  

timecodeCalibrationVolume

Calculated during calibration, this value is the average volume of your input signal.

  

timecodeCalibrationPhase

Calculated during calibration, this value checks if your input signal is stereo-inverted, and/or phase-inverted.

  
  

## Sampler

samplerBank

Name of the sample bank that is currently loaded

  

samplerTriggerMode

Defines how the sampler slots are triggered: "on/off" means the sample starts when you press once, and stop when it reaches the end of the sample or when you press again. "hold" means the sample starts when you press, and stops when you release the pad. "stutter" means the sample starts when you press, and continue until the end of the sample. If you press the pad again, it restarts the sample from the beginning. "unmute" means the sample keeps running in the background, but is audible only while the pad is pressed.

  

samplerDefaultLoopMode

Set the default sync mode that is used when a new loop is recorded.

  

samplerForceNbColumns

Force a layout for the sample pad in the sideView

  

samplerSpanAcrossDecks

When set to yes, if a bank with 16 samples is loaded, deck 2 will automatically show the second half (9-16)

  

samplerExportLossless

When set to yes, new samples that are recorded will be saved using a lossless algorithm (FLAC). When set to false (default), they will be slightly compressed using OGG.

  

samplerDontSaveSource

When set to yes, new samples that are recorded will not save their source file filepath (if you want to distribute the sample file without exposing your folder paths)

  

samplerRootFolder

Let you change the default folder where the samples are stored

  

samplerHideDefaultBanks

Let you hide the default banks

  

samplerHideLegacyBanks

Hide the old legacy banks from VirtualDJ v8 if they're still in the folder

  

samplerOutputDeck

Where to route the output from samples in non-stemSwap banks (or triggered from sideview sampler). 0 for master/all decks, -2 for trigger deck, -1 for headphones, 1 for deck 1, 2 for deck 2, etc...

  

samplerApplyEffectsOnDeckOutput

When samplerOutputDeck is set to a fixed deck and this setting is turned on, deck effects, equalizer and filter are also applied to the sampler. Otherwise only volume and pfl affect sampler.

  

samplerVideoVolumeLink

Video samples fade to black with sample volume when on

  

autoSideview

Switch sideview to sampler when sampler\_bank action is used to change sample bank

  

samplerImageSize

Specifies the size of the image on a sampler pad

  

samplerHeadphones

Sampler can be heard in headphones

  

samplerShowEffects

Show effect toolbar in sampler sideview

  

samplerShowWaveform

Show sample waveforms in the sampler sideview

  

samplerIndependentDeckBanks

Each deck and master can have their own sample bank

  

samplerRecordStemsPads

Select which pads will record which stems for stemsSwap banks

  

samplerRecordLength

When recording a stem slot on the pads, record for the duration specified

  
  

## Browser

fileFormats

List of extensions that will be displayed in the browser

  

rootFoldersLocation

List of root folders that will be displayed in the tree view

  

browserShortcuts

Quick shortcuts to folders to display on the left toolbar

  

browserShortcutsIcons

Icons for the folder shortcuts

  

browserShortcutsCustomIconFile

If you want to use your own icon collection, select an image with a grid of 64x64 icons

  

browserShortcutsDefaultIcon

Default icon number used when adding a new shortcut. -1 to popup the list.

  

iTunesDatabaseFile

Path to your iTunes database file

  

seratoFolder

Path to your Serato crates folder

  

traktorFolder

  

rekordboxFolder

Path to your rekordbox library

  

importV7Databases

Automatically import databases from VirtualDJ 7.x or earlier into the new VirtualDJ 8.x format if needed

  

ignoreDrives

List of drives to ignore when looking for VirtualDJ databases

  

readOnly

Set VirtualDJ in read-only mode, the databases on the drives will not be modified

  

searchInFolder

Search results display results from the current folder first

  

searchInDB

Search results display all results from the database

  

searchInOnlineCatalogs

Search results display results from online catalogs if an Internet connection is available

  

OnlineCatalogsWhenEmpty

Only search online catalogs if no local result was found

  

OnlineCatalogs

Specify which catalog(s) to use for online search

  

onlineCatalogsContentPreference

  

showMusic

Activate filter to show only Audio tracks

  

showVideo

Activate filter to show only Video tracks

  

showKaraoke

Activate filter to show only Karaoke tracks

  

searchFields

Fields used by the search engine

  

browserColumns

Columns displayed in the various browser windows

  

browserSort

Sort column used in the various browser windows

  

browserGridColumns

Columns displayed in the various browser windows while in grid view

  

infoviewColumns

Fields displayed in the info side-panel

  

showHorizontalSideList

Show the horizontal sidelist like in older VirtualDJ versions

  

lockFolderOrder

When active, the order of folders is locked and can't be moved accidentally by dragging them around

  

keepSortOrder

Keep the sort order when you change folder

  

rememberRecurse

Remember if recurse was used on a folder

  

browserSearchByFirstLetter

When the focus is on the browser, typing on the keyboard will select the song starting with this letter, instead of using the keyboard mapper

  

lastSelectedFolder

Last selected folder (saved for the next session)

  

coverFlow

Select how to display the cover pictures on the coverflow band

  

lastTrackListDate

Last date from the tracklisting.txt file

  

historyDelay

Number of seconds a song needs to be playing before it's considered 'played' and added to the history, tracklisting, etc (default: 45 seconds)

  

writeHistory

When disabled, don't log tracks in history and don't update play count or last play date

  

prelistenVisible

Show the prelisten control in the info panel

  

prelistenStopOnChange

Stop the prelisten if it was playing when you switch to a new file in the browser

  

prelistenStartPos

\-1=default, 0 to 1: start at that location in the song

  

autoSearchDB

Automatically add any song that VirtualDJ encounters while browsing your folders and drives, to the search database

  

showZipKaraoke

When browsing the content of a folder, check for all .zip files to see if it's a karaoke file (.mp3 + .cdg) inside

  

showM3UAsFolders

When opening a folder, check if it has .m3u playlist files inside, and if so show them as subfolders

  

fontSize

Font size modifier for the browser

  

browserPadding

Padding around lines in the browser

  

browserBPMDigits

How many digits after the dot should be displayed in the browser when showing a BPM

  

savePlaylist

Automatically save the automix/sidelist/karaoke list between sessions

  

saveUnplayedToSidelist

When you load a song on a deck, but change your mind and don't play it and load something else, automatically put the song in the sidelist for later

  

removePlayedFromSidelist

When you play a song long enough to mark it as played, and the song was in the sidelist, remove it from the sidelist

  

browserTextFit

How to display large text in the browser when it's too long to fit

  

tracklistFormat

format used when writing the tracklist.txt file (use the same syntax as the skin engine's text elements)

  

shellIcons

Display the real OS icons instead of the VirtualDJ flat one, for regular folders

  

sideviewShortcuts

List of the folders that have shortcut buttons in the sideview

  

sideView

Save the sideview view between sessions

  

gridView

Display the lists of files as a grid instead of row by row

  

triggerPadView

Display the sampler as a pad in the sideview instead of as a list

  

sideViewReco

Set the mode of the sideview recommendation panel

  

RemixesViewProvider

  

liveFeedbackProviders

  

logUnsuccessfulSearches

Automatically save all unsuccessful searches into the file SearchLog.txt

  

chartsCountry

Force the charts to show results from another country than where you are currently located

  

filterFolderSplitGenreBySlash

When enabled, a slash is seperating genres in filter folders

  

browserAutoZoom

Automatically zoom the browser on mouse-over

  

browserFontSizeButtons

Show buttons on the browser toolbar to fine tune the font size, instead of the quick big/small button

  

browserPreviousFoldersButton

Show a button on the browser toolbar to go back to previous folders

  

browserDaysSongsAreNew

Number of days after first seen a file that it gets the new file icon

  

browserShowSideviewInLists

Show the sideview's automix, sidelist and karaoke lists in the MyLists folder

  

disableHotplugForNewLists

Set all new Lists to "disable Hotplug", which will keep the list on the main drive instead of splitting it across the various drives where the content is

  

disableDuplicateForNewLists

Set all new Lists to "no Duplicates" by default

  

browserAutoExportM3U

Automatically save a .m3u copy in %AppData%/VirtualDJ/Playlists/ for each list in MyLists (in case you use an external utility that reads only m3u format)

  

browserShowLegacyM3UPlaylists

Show the old .m3u playlists to keep working with them (in case you use an external utility that also modifies them)

  

browserAutoOpenNewDrive

Automatically select a new external drive or usb key when plugged in

  

cdjExportStemsConfig

List of possible combinations of stems to export on CDJ flash drives

  

cdjExportStems

List of stems combinations to export on CDJ flash drive when exporting a new file

  

cdjExportCompatibility

Minimum level of compatibility for CDJ flash drive databases

  

cdjExportShowAllDrives

Show all USB drives under the CDJ Export folder

  

cdjExportAutoSyncCues

Automatically keep the cue points synchronized when modified inside VirtualDJ and on a CDJ

  

cdjExportCuesAsMemoryPoints

Store cue points as memory points as well on cdj export

  

quickFilters

List of available quick filters

  

colorRules

List of color rules

  

user1FieldName

Display name for the user-definable tags field

  

user2FieldName

Display name for the user-definable tags field

  

favoriteGenres

List of genres to be offered first when editing the genre field

  

favoriteTags1

List of tags to be offered first when editing the user1 field

  

favoriteTags2

List of tags to be offered first when editing the user2 field

  
  

## Tags

getTagsAuto

Automatically get infos from the file's tags when a new file is encountered

  

setTagsAuto

Automatically write infos to the file's tags when something is modified inside VirtualDJ

  

coverDownload

Automatically download cover pictures when a new file without cover is encountered

  

getTitleFromTags

Get the title and artist fields from the tag

  

getRatingFromTags

Get the rating field from the tag

  

getCommentFromTags

Get the comment field from the tag

  

getCuesFromTags

Get the cues field from the tag

  

getTagFromZip

Open zip files to see if there is a mp3 or mp4 file inside to get tags from

  

getRemixWhenParsingFilenames

Get the remix field when filename are formated like "artist - title (remix)" or "artist - title \[remix\]"

  

useKeyFromTag

Prefer to use the key from the tag instead of the value calculated by VirtualDJ

  

cleanTagsInDeckDisplay

title, artist, featuring and remix are uniformly formatted for display in the deck's tag info display

  
  

## Automix

automixMode

Force the automix engine to use one particular mode

  

fadeLength

Length (in seconds) of the transition when using "fade" automix. Negative length adds delay between songs

  

automixRepeat

The automix playlist will repeat from the beginning when it reaches the end

  

automixAutoRemovePlayed

Files will be removed from the automix playlist when they get played during automix, or when they get played any time

  

automixDualDeck

Use both decks and the crossfader to perform the automix, instead of doing everything on a single deck

  

autoMixBeatMatchOnFade

When automix mode is set to fade and songs tempo is close to each other, they will be beatmatched

  

automixSkipLength

Number of beats to fade when forcing automix to skip to a different song (double-click or mix\_now for example)

  

automixMaxLength

Maximum time (in seconds) a song will play in automix before skipping to the next song

  

automixDoubleClick

While automix is active, select what happens when double-clicking a song

  

automixTempoMode

When automix mixes to the next song, it can either go back to 0% pitch, keep the pitch the same, or keep the bpm the same (when possible within a pitch of +-10%)

  
  

## Internet

internetProxyURL

URL of proxy to access internet

  

internetProxyPort

Port of proxy to access internet

  

internetProxyUsername

Username of proxy to access internet (if required)

  

internetProxyPassword

Password of proxy to access internet (if required)

  

stayLoggedIn

Set to no if you want VirtualDJ to ask your password everytime

  

dontLogin

Set to yes if you don't want to log in (and see the log in window when you start VirtualDJ)

  

checkUpdates

What to do when there is a new version of VirtualDJ available

  

earlyAccessUpdates

Get early access to new updates and new features as soon as they are fully tested

  

sendHistory

Save your playlists on your virtualdj.com account (some features won't be available if you disable this)

  

sendAnonymousStats

Help improve VirtualDJ by sending anonymous statistics about which controller you use, which skin, etc

  

autoRefreshDRM

Automatically refresh the DRM of your online catalogs downloaded song when they're near expiration

  

liveFeedback

Show new track recommendation based on the feedback of millions of other DJs who have played the same tracks as you just did

  

liveFeedbackUseBpm

LiveFeedback should prioritize recommendations with a similar BPM (turn it off if you play cocktails or weddings where BPM is not important)

  

netsearchVideoQuality

Quality (and size) of the video files that online video catalogs will download

  

netsearchAudioQuality

Quality (and size) of the audio files that online audio catalogs will download. Note that not all quality levels are offered by all providers

  

cloudDriveEngine

Select the storage engine that will be used by CloudDrive

  

cloudDriveSynchronization

Select two-way if you are modifying the clouddrive on another computer and want the changes to be reflected on this computer

  

cloudDriveFullAccess

Get full access to browse the full content of your storage engine

  

cloudDriveSync

keep track of the folders you synced to CloudDrive

  

cloudDrivePauseSync

Let you pause all CloudDrive synchronization (if you need to preserve your internet bandwidth)

  

iRemote

Look for old v7 remote application

  

iRemoteList

list of old v7 remote clients

  

iRemoteDefaultPort

Port on which to connect with old v7 remote clients

  

vdjRemoteDevices

List of mobile devices that will reconnect automatically if they're running VirtualDJRemote (v8 or above)

  

vdjRemoteIPs

List of manual IP addresses previously used for remote

  

os2l

Send beats and bpm to any DMX software compatible with OS2L (Open Sound To Light protocol)

  

os2lDirectIp

Set the IP and port of your DMX application to connect OS2L directly without using Bonjour or Zeroconf

  

askTheDJMonitoring

Choose if AskTheDJ keeps polling requests when the folder is not shown

  

askTheDJFrequency

Frequency (in seconds) at which to update AskTheDJ

  

askTheDJTwitterHashtag

Use Twitter instead of [http://ask.the.dj](http://ask.the.dj/) to get request, looking for the specified hashtag

  
  

## Record

recordFile

File use to record the mix

  

recordFormat

File format used to record the mix (mp3, ogg, flac, wav, webm, mp4)

  

recordQuality

Amount of compression used when saving the recording (the lower the quality the bigger the compression)

  

recordAutoStart

The recording will automatically start as soon as you press play on a deck

  

recordWaitForSound

Once recording is started, the recording will wait until something is actually playing before recording

  

recordOverwrite

Decide what to do when you record a new file (and didn't manually change the output filename)

  

recordAutoSplit

A new recorded file will be created each time you move the crossfader from one side to another

  

recordWriteCueFile

A .cue file will be created alongside the recorded mp3, with the times and titles of each track you play (the .cue file can be used by many CD burning software to create tracked CDs)

  

recordVideoResolution

resolution of recorded video

  

recordVideoHardwareAcceleration

  

recordMicrophone

When set to no the microphone is not recorded or broadcasted

  

recordBitDepth

24-bit only available for wav and flac. Warning: 24-bit files are not compatible with all media players!

  

recordVideoFps

Frames per seconds for video recording. Note that to record at 60fps, videoFps also needs to be set to 60

  

recordVideoCodec

Video Codec used when recording video. Note that h265 and av1 are not available on all hardware

  
  

## Broadcast

broadcastMode

Broadcast mode ("direct" if you want to stream directly from your computer, "server" if you want to stream to a radio station, "podcast" if you want to save your podcast on virtualdj.com for later use)

  

broadcastVideoQuality

Amount of compression used when broadcasting video (the lower the quality the bigger the compression)

  

broadcastVideoQualityCustom

Custom video broadcast quality "resX x resY @ videokbps , audiokbps"

  

broadcastServer

Server address to broadcast to

  

broadcastDirectFormat

File format used to broadcast ("ogg" is better quality but works only in Chrome, "mp3" works with any browser)

  

broadcastDirectPort

Internet port used for direct broadcast

  

broadcastDirectQuality

Encoding quality (compression) when using Direct Broadcast

  

broadcastDirectMaxClients

Maximum number of listener who can connect to your computer at the same time in Direct Broadcast (don't put too high if you don't have a lot of bandwidth)

  

broadcastDirectName

Name of your broadcast

  

broadcastSongInfo

Set to no if you don't want your listeners to see the titles of what you are playing

  

broadcastSongInfoFormat

Set how the title is formatted that is sent to the broadcast server

  

podcastName

Name of your podcast

  

broadcastVideoProvider

video broadcast server

  

broadcastVideoURL

url of the video broadcast servers

  

broadcastVideoKey

stream keys for the video broadcast

  
  

## Options

ABtesting

  

language

Language-file used for translation

  

loadSecurity

Ask a confirmation message if you try to load a song on a deck that is already playing. Silent will not load and not show a confirmation dialog.

  

endOfSongWarning

Time left in song (in seconds) when to show the end-of-song warning

  

autoDiscMarker

Automatically put the disc marker back to 0 degrees on cue points

  

sandboxSplitHeadphones

In sandbox mode, sends the sandbox master to the left ear of your headphones, and the sandbox pfl to the right ear

  

sandboxPreviewOnly

In preview only sandbox mode, only the song position is reflected in the sandbox. volumes, crossfaders, equalizers and effects are still applied to the main output

  

VDJScriptGlobalVariables

List of persistent global variables saved by your scripts

  

crashGuard

CrashGuard constantly monitors the VirtualDJ process, and silently reboot it without interruption if something goes wrong

  

crashReportLevel

If you experience some problems and the technical support ask you to submit more detailed dump files, set this to the value the technical support agent told you

  

poiEditorShowAll

Show system POIs in the POI Editor

  

poiEditorSnap

Snap POIs to the beat in the POI Editor

  

nonColoredPoi

Specify how to choose the default color for CUEs and other POIs that don't have a specific color

  

colorPicker

Select which colorPicker to use. 'auto' uses gradient in tag editor and simple otherwise

  

settingPage

Last page used in settings

  

dontShowAgain

Dialogs that you asked not to show again

  

vstFxFolder

Folder where your VST3 effects are installed. On Mac this is typically /Library/Audio/Plug-Ins/VST3 and on Windows C:\\Program Files\\Common Files\\VST3

  

showTipOfTheDay

show Tip Of The Day when new ones are available

  

tipOfTheDayAlreadySeen

list of Tip Of The Day already clicked or closed (that won't be shown again)

  

skinStarterTip

  

startOfDayHour

Hour (in 24h format) at which to cut into a new date in tracklisting.txt (default: 8 AM)

  

automaticDatabaseBackupPeriod

Number of days between each automatic database backup, or 0 for no automatic backup

  

databaseBackupLocation

Folder to store database backups

  

watchFolders

Comma-separated list of folders to automatically scan on startup to check for new files

  
  

## Performance

stemsRealtimeSeparation

\- Always: separate every song when loading\\n- On-Demand: only separate songs that make use of stems (will have a small delay with reduced quality when starting)\\n- Prepared: offer to prepare saved stems when needed, and use reduced-quality in the meantime\\n- Reduced quality: silently use reduced quality if no prepared stems available\\n- Fully disabled: never try to separate stems, not even in reduced quality (modern waveforms will be unavailable)

  

stemsSavedStems

Choose if a prepared stems file should be saved automatically after a real-time separation

  

stemsGPU

  

stemsFix

If your computer is a little too old, try one of these options

  

stemsSavedFolder

By default prepared stems files are saved alongside their source file in the source file's folder. If you want all the prepared stems to be saved instead in a separate folder, set the folder here

  

skinUseLowPowerGPU

For laptop with dual-GPU, select if the skin and video should use the internal low-power GPU (to preserve battery) or the discrete high-power GPU. The low-power GPU is usually enough to draw the skin and for basic video mixing, and will make your battery last longer. Use the high-power GPU if you're doing complicated video mixing with complex effects or shaders.

  

skinUseLowPowerGPU

  

skinFPS

Set the number of frames per seconds the skin is updated. A higher value will make animation smoother, a lower value will make cpu usage lower

  

sampleRate

Force the internal samplerate. If set to "auto" VirtualDJ will use the samplerate recommended by your soundcard. If you are playing a lot of MP3 files, we recommend using a 44100 samplerate. If you are playing a lot of VOB videos, we recommend using 48000. As a rule, a bigger samplerate DOES NOT mean a better sound quality, on the opposite. The best quality is when your source file, internal samplerate, and soundcard, all use the same value. And since you can change the value of the soundcard and of VirtualDJ, but not of the source files, you should set the value that matches most of your files (mp3 are 44100, videos are 48000)

  

latency

latency in samples

  

ultraLatency

Set to yes to minimize the latency when using ASIO sound drivers, by writing audio before the "safe" recommended point. If you hear some cracks in ASIO, try to turn this off.

  

maxPreloadLength

Prevent overloading your memory, by not fully preloading any song that is longer than this value (in minutes). Set to -1 to always preload. 0 to select automatically

  

maxStemLength

Prevent overloading your memory, by not fully preloading stems for any song that is longer than this value (in minutes). Set to -1 to always try to allocate memory for stems

  

pitchQuality

Choose which algorithm to use when pitching/scratching/mastertempo. 1 is fastest, 2 is good quality, 3 is excellent quality, 4 is best quality but requires fast cpu

  

scratchFilterQuality

Choose the quality of the algorithm used for the scratching. Higher values increase sound quality but also increase cpu usage. Default is 12, maximum is 32

  

songLoadPriority

Lower song load priority to prevent audio drop-outs while loading

  

experimentalBeatAnalyzer

  

experimentalSkinEngine

Improve skin rendering performance

  

useOpengl

Use openGL instead of Metal for graphic rendering

  

experimentalWaveColors

  

safeVideoDecode

Use this if your are experiencing troubles with old video drivers using hardware decoding of videos

  

analyzeSongsOnView

When enabled, unscanned files are automatically scanned as they are browsed

  

keepBPMonAnalyzerUpdate

When enabled, automatically detected bpm and beat-grid will not be updated when the bpm analyzer has been updated. Only manual re-scan will then update the bpm and phase with the new analyzer.

  
  
[List of Native Effects](https://www.virtualdj.com/manuals/virtualdj/appendix/nativeeffects.html)