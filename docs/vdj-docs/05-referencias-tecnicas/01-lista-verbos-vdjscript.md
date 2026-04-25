---
title: "VirtualDJ - User Manual - Appendix - List of VDJScript verbs"
source: "https://www.virtualdj.com/manuals/virtualdj/appendix/vdjscriptverbs.html"
author:
  - "[[VirtualDJ Website]]"
published:
created: 2025-02-18
description: "With over 100,000,000 downloads, VirtualDJ packs the most advanced DJ technology. Both perfect to start DJing, and perfect for advanced pro DJs."
tags:
  - "clippings"
---
[Appendix](https://www.virtualdj.com/manuals/virtualdj/appendix/index.html)  # List of Verbs

  

## Flow

nothing

Do nothing.

  

up

execute different actions depending if the key if pressed or released: 'up ? action1 : action2'

  

down

execute different actions depending if the key if pressed or released: 'down ? action1 : action2'

  

isrepeat

execute different actions depending if the key is being repeated or if it's the first message (on Windows, keyboard shortcuts are usually auto-repeated while held down): 'isrepeat ? nothing : goto\_cue')

  
  

## Param

true *(or* on *or* yes*)*

returns true

  

false *(or* no *or* off*)*

returns false

  

constant *(or* get\_constant*)*

Return the specified value Example: 'get constant 75%' always returns 75%

  

dim

equivalent of "constant 0.1"

  

color\_mix

Mix two colors based on an action in the third parameter color\_mix white red \`get\_limiter\`

  

color

color "red" color "#C08040" color 0.8 0.5 0.25 color 75% "red" (returns a dimmed red) color 0.66 (returns a gray)

  

param\_bigger *(or* param\_greater*)*

check if the value of the calling slider/encoder/button is bigger than something: 'param\_bigger 0 ? sampler loop 200% : sampler loop 50%' compare value of the first parameter with the value of the second parameter. Both parameters can be actions instead of values: 'param\_bigger pitch pitch\_slider'

  

param\_equal

Check if the value of the calling slider/encoder/button is equal to something To compare a string with the result of an action, use param\_equal \`action param\` "string". For example: param\_equal \`get\_browsed\_song 'type'\` "audio"

  

param\_contains

check if the value of the calling action contains the string in the parameter

  

param\_smaller

check if the value of the calling slider/encoder/button is smaller than something: 'param\_smaller 0 ? sampler loop 200% : sampler loop 50%'

  

param\_add

add the given value to the value of the calling slider/encoder/button add the value of the first parameter with the value of the second parameter. Both parameters can be actions instead of values: 'param\_add \`get\_var a\` \`get\_var b\`'

  

param\_multiply

multiply the value of the calling slider/encoder/button by the given value: 'param\_multiply 300% & effect slider' The parameter can also be an action 'cue\_pos 0 & param\_multiply "get\_time total 1000"'

  

param\_1\_x

invert the value of the calling slider/encoder/button (calculate 1/x) 'param\_1\_x & effect slider'

  

param\_pow

param\_pow y : computes the power of the caller to the power of y. Can be 0.5 for calculating square root.

  

param\_invert

invert the value of the calling slider/encoder/button (1-x): 'param\_invert & pitch\_slider'

  

param\_mod

wrap the value of the calling slider/encoder if more than the given value

  

param\_pingpong

transform the value of the calling slider/encoder from a linear scale to a forth-and-back scale

  

param\_cast

cast the value of the previous query action into a new type: 'pitch\_range & param\_cast "percentage"'. Valid types are 'integer', 'float', 'percentage', 'ms', 'boolean', 'beats', 'text'. casting to text can also optionally limit the number of characters: 'get\_browsed\_song "artist" & param\_cast "text" 5' to format a number as text with a specific number of digits: 'get\_bpm & param\_cast "000"' param\_cast 'int\_trunc' : provides the integer part of a number without rounding to the nearest integer param\_cast 'frac' : provides the decimal part of a number. param\_cast 'relative' and param\_cast 'absolute' : change the parameter to be a relative or absolute value

  

param\_delta

transform an absolute value into relative (example: 0.5, 0.7, 0.8 will become +0.0, +0.2, +0.1)

  

param\_uppercase

change the text result of the previous element in the script into uppercase

  

param\_lowercase

change the text result of the previous element in the script into lowercase

  

param\_ucfirst

change the first letter into upper case and the rest in lower case

  

blink

turn on and off the LED, once per second. You can specify the speed: 'blink 1000ms' Speed can also be specified in number of beats: 'blink 1bt'. The time blinking can also be specified: 'blink 1bt 25%'

  

fadeout

'loop & fadeout 10000ms 3000ms' will return 100% when loop is on, and fade out to 0% after 10 seconds in 3 seconds when loop turns off Alternatively, the action can be entered as the third parameter in backticks: 'fadeout 10000ms 3000ms \`loop\`'

  

pulse

return true when the previous action turns to true only for the duration specified: 'is\_using 'equalizer' & pulse 2000ms'

  

param\_make\_discrete

useful for smooth endless encoders, to make them discrete Example: 'param\_make\_discrete 0.1 & param\_bigger 0 ? loop\_move +100% : param\_smaller 0 ? loop\_move - 100%'

  
  

## Repeat

repeat

repeat the actions every x ms as long as the key is pressed: 'repeat 1000ms & browser\_scroll +1' (default is 500ms if no speed is specified. Second parameter can specify a delay before repeating the first time)

  

repeat\_start

Repeat an action at a specified interval: 'repeat\_start 'myrepeatname' 1000ms 5 & browser\_scroll +1' (first parameter is an identifier name, second parameter is the interval and the third optional parameter can specify a number of times to repeat). The first action will be performed after an interval has passed. The interval can be specified in milliseconds, beats, or can be an action of itself. 'repeat\_start 'myrepeatname' 1bt' or 'repeat\_start 'myrepeatname \`get\_var a\`'

  

repeat\_start\_instant

Repeat an action at a specified interval: 'repeat\_start\_instant 'myrepeatname' 1000ms 5 & browser\_scroll +1' (first parameter is an identifier name, second parameter is the interval and the third optional parameter can specify a number of times to repeat). The first action will be performed immediately.

  

repeat\_stop

stop a previous repeat\_start or repeat\_start\_instant action: 'repeat\_stop 'myrepeatname''

  

wait

wait for the specified amount of time between two script actions: 'wait 1bt & pause', 'wait 500ms & play'

  

holding

execute different actions depending if the key is pressed for a long time or not: 'holding ? automix : mix\_now'. you can specify the time ('holding 1000ms'), by default it's 500ms.

  

doubleclick

execute different actions depending if the key is pressed twice in a short period of time or not: 'doubleclick ? automix : mix\_now'. you can specify the time between two presses ('doubleclick 1000ms'), by default it's 300ms.

  
  

## Skin

skin\_panel *(or* skin\_pannel*)*

show or hide a panel on the skin. "skin\_panel 'my\_panel' on"

  

skin\_panelgroup *(or* skin\_pannelgroup*)*

change which panel from a skin panel group is shown. syntax "skin\_panelgroup 'groupname' 'panelname'" or "skin\_panelgroup 'groupname' +1" or "skin\_panelgroup 'groupname' 0.75"

  

skin\_panelgroup\_available

set a panel to be available or not. panels that are not available will not show up in group cycles

  

lock\_panel *(or* lock\_pannel*)*

NOTE: despite the name, this action acts on <split> elements, not <panel>

  

show\_splitpanel

Show/hide the specified split panel Examples: "show\_splitpanel 'sidelist'", "show\_splitpanel 'sideview' on", "show\_splitpanel 'sidelist' 50%"

  

rack

Open/close a unit in specified rack. Example: "rack 'rack1' 'unit1'"

  

rack\_solo

Open/close a unit in full size on the specified rack. Closing the unit will re-open the previous configuration. Example: "rack\_solo 'rack1' 'unit1'"

  

rack\_prioritize

Prioritizes a unit of the specified rack. When more configurations with same size are available, the prioritized unit will get most space. Example: "rack\_prioritize 'rack1' 'unit1'"

  

custom\_button

a custom button is a button with initially no action, but the action can be written in VDJScript by the user

  

custom\_button\_name

return (or set) the name for this custom button

  

has\_custom\_button

returns true if this custom button has an action assigned to it

  

custom\_button\_edit

open the custom button editor to set or change the action

  

multibutton

Click on the named multibutton: 'multibutton "my\_button"'

  

multibutton\_select

Open the selection menu for the named multibutton. If a second text parameter is provided after the name, use it as the new action to load in the multibutton: 'multibutton\_select "my\_button" "goto\_cue 2 & play"'

  

zoom *(or* zoom\_scratch*)*

zoom horizontal rhythm and scratch visual

  

zoom\_vertical

zoom vertical scratch wave

  

switch\_skin\_variation

  

load\_skin

load a new skin. Use syntax " load\_skin ':newvariation' " to load a different variation inside the same skin file.

  

skin\_empty\_buttons

  

is\_using

check if a particular feature is being used ('filter', 'equalizer', 'loop', 'cue', 'sample', 'pads', 'effect', 'load')

  

has\_logo

  

get\_skin\_color

  

has\_cover

  

skin\_width

  

skin\_height

  

skin\_starter\_tip

  
  

## System

get\_cpu

get the cpu activity

  

get\_peak\_audio

  

get\_clock

get the current time (use 'get\_clock 12' to display AM/PM)

  

get\_date

get the current date (use 'get\_date "format"' to get the date in a specific format. format can include %Y, %m, %d for year, month and day, %A for weekday)

  

is\_pc *(or* is\_windows*)*

return true if the computer is a PC, false if it's a MAC (example: <panel visible="is\_pc" />)

  

is\_mac *(or* is\_macos*)*

return true if the computer is a MAC, false if it's a PC

  

has\_notch

return true when the display has a notch at the top center and the skin is maximized, false otherwise

  

system

  

debug

display the value of the parameter (you can use this to see what values controllers are sending, for example)

  

open\_help

open the user guide

  

get\_battery

returns how much battery is left on your laptop

  

is\_battery

returns true if your computer is running on batteries

  

has\_battery

returns true if your computer has batteries

  

getfood

because no DJ should work on an empty stomach

  

show\_keyboard

display an onscreen keyboard

  

system\_volume

Change the system volume of the active sound card when available (use has\_system\_volume to check)

  

has\_system\_volume

Returns true when the system volume can be modified

  

handshake

Perform an encrypted handshake to ensure that this plugin is currently being called by a real VirtualDJ environment. Call this passing any string, decrypt the result using VirtualDJ's handshake public key, and check that it matches what you passed. See the developer documentation on our website for example code.

  
  

## Variables

var

'var "my\_var" ? my\_action1 : my\_action2'. execute my\_action1 if my\_var is true (non zero), execute my\_action2 otherwise. You can also compare var with a specific value: 'var "my\_var" 1 ? my\_action1 : my\_action2' execute my\_action1 is my\_var is 1, or my\_action2 otherwise

  

var\_equal

syntax: 'var\_equal "my\_var" 42 ? my\_action1 : my\_action2'. execute my\_action1 if my\_var equals 42, execute my\_action2 otherwise. syntax: 'var\_equal "this\_var" "that\_var" ? action1 : action2' execute action1 if this\_var equals that\_var, execute action2 otherwise

  

var\_not\_equal

syntax: 'var\_not\_equal "my\_var" 42 ? my\_action1 : my\_action2'. execute my\_action1 if my\_var doesn't equal 42, execute my\_action2 otherwise.

  

var\_smaller

syntax: 'var\_smaller "my\_var" 42 ? my\_action1 : my\_action2'. execute my\_action1 if my\_var is smaller than 42, execute my\_action2 otherwise.

  

var\_greater

syntax: 'var\_greater "my\_var" 42 ? my\_action1 : my\_action2'. execute my\_action1 if my\_var is greater than 42, execute my\_action2 otherwise.

  

set\_var\_dialog

set\_var\_dialog 'varname' opens a dialog to enter the value of varname set\_var\_dialog 'varname' 'information text' opens a dialog to enter the value of varname, and shows the second parameter as informational text

  

set

set 'varname' 5 sets variable varname to the value 5 set 'varname' 'var2' sets variable varname to the value of variable var2 set 'varname' \`play\` sets variable varname to the value of the action play

  

toggle

syntax: 'toggle "my\_var"'. toggle my\_var between true and false.

  

cycle

syntax: 'cycle "my\_var" 42'. increment my\_var, and goes back to 0 when it reaches 42. 'cycle "my\_var" -42' decrements my\_var, and goes to 41 after it reached 0.

  

get\_var

get the value of the specified variable

  

set\_var

set the value of the specified variable

  

var\_list

show a window with a list of your current variables and their values

  

controllervar

variable that is unique to each controller. You can add # in front of the variable name to make it both deck and controller-dependent

  
  

## Window

close

close the application.

  

minimize

minimize the application in the taskbar.

  

maximize

maximize the application to maximized, full screen, or back to windowed. A specific mode can be selected using "maximize 'windowed'", "maximize 'maximized'" or "maximize 'fullscreen'"

  

show\_window

on skin with multiple windows, show or hide the specified window

  

open\_stem\_creator

  
  

## Audio

song\_pos

position in the song. (the difference between song\_pos and goto is that song\_pos can be used as a slider).

  

goto

change the position in the song. 'goto +10ms' jumps 10ms forward. 'goto -4' jumps 4 beats backward. 'goto 20%' jumps to 20% of the song's length.

  

goto\_bar

put the song on its nth beat after the downbeat without loosing sync: 'goto\_bar 4'

  

songpos\_remain

get the remaining time in %. if used with a parameter (in % or ms), returns true if the time left is less or equal than the value: 'songpos\_remain 500ms ? blink'.

  

songpos\_warning

returns true if the song is in its last 30s (actual time can be adjusted in options)

  

seek

move into the song while the button is pressed. 'seek +2' moves beat by beat, skipping 2 beats every 10ms. 'seek +420ms' moves from 420ms every 10ms. using skip with a beat number keep the song playing correctly while moving inside.

  

reverse

play the song backward

  

dump

reverse the playback direction while dump is active, then when deactivated, start again forward from where the song should have been if it had been playing forward during the dump. when quantize\_all is active, dump will be quantized to match the beats. This can also be forced by using 'dump quantized' or 'dump notquantized' to dump only while the key is pressed, use 'dump while\_pressed'

  

goto\_first\_beat

automatically goes to the first beat in the song.

  

goto\_start

go to the start of the song.

  

mixermode

Return true if internal mixer used (master output available), false if external mixer used. Parameter can also be explicit: mixermode "internal" or mixermode "external"

  

beat\_juggle

Alternatively jumps one beat forward and backward 'beat\_juggle 0.5' will jump 1/2 beat forward or backward

  

swap\_decks

swap deck 1 and deck 2

  

clone\_deck

clone the deck (load the same song on the other deck, and play it from the same position, ready for beat-juggling).

  

clone\_from\_deck

clone from the other deck (load the song from the other deck, and play it from the same position, ready for beat-juggling).

  

move\_deck

load the song from the called deck into the deck specified by the parameter and unloads the song from the calling deck

  

stems\_split

'stems\_split' will duplicate deck 1 to deck 3 or deck 2 to 4, with the vocals playing on the first deck and the instruments on the other deck 'stems\_split vocal target' will duplicate the opposite deck to the deck stems\_split was called from

  

stems\_split\_unlink

After using stems\_split, you can use stems\_split\_unlink to have the decks behave independently, allowing to scratch the vocals without affecting the instrumental for example

  

dualdeckmode

toggle dual deck mode. when enabled dualdeckmode\_decks will apply to both decks 1/3 or 2/4

  

dualdeckmode\_decks

  

beatjump

Jump a certain number of beats as set by beatjump\_select 'beatjump +1' to jump forward, or 'beatjump -1' to jump backwards

  

beatjump\_select

Select the number of beats the beatjump action will jump 'beatjump\_select 4' to set beatjump to 4 beats 'beatjump\_select +1' to set the next higher beat size 'beatjump\_select 50%' to halve the current beat size 'beatjump\_select 200%' to double the current beat size

  

beatjump\_page

change the offset of the jumps in beatjump\_pad actions

  

beatjump\_pad

execute 'goto +x' where x depends on the pad number and the beatjump\_page

  
  

## Audio\_controls

play

start the deck.

  

play\_stutter

if paused, start the deck. if playing, restart from last stutter point.

  

play\_pause

if paused, start the deck. if playing, pause the deck.

  

pause\_stop

if playing, pause the deck. if stopped, rewind to beginning of the song, then cycle through all cue points each time pressed.

  

stop

stop to the last cue point, then on second press to the beginning of the song, then cycle through the cue points.

  

pause

pause the deck.

  

play\_button *(or* play\_3button*)*

depending on the play\_mode, act like play\_stutter (Numark way) or play\_pause (Pioneer way).

  

stop\_button *(or* stop\_3button*)*

depending on the play\_mode, act like pause\_stop (Numark way) or stop (Pioneer way).

  

play\_options

show a context menu to select the behavior of the play and cue buttons, and the various smart modes

  

auto\_sync\_options

show a context menu to control the various auto-sync options

  

deck\_options

show a context menu to select the behavior of the play and cue buttons, the various smart modes, and pitch options

  

blink\_play

blinking fast when less than 10 seconds remaining, blinking slow when less than 30 seconds remaining, off otherwise 'blink\_play on' is similar, but is on when the song is paused, and only off if no song is loaded or the loaded song has an error

  

emergency\_play

play something

  
  

## Audio\_inputs

mic *(or* microphone*)*

activate or deactivate the microphone input

  

mic\_talkover

Lower the volume of all decks while active and activates microphone Use 'mic\_talkover while\_pressed' to only activate mic as long as button is held Use 'mic\_talkover 20% 1000ms' to lower deck volumes to 20% and fade to the volume in 1 second. (Defaults are 30% and 400ms)

  

mic\_eq\_low

  

mic\_eq\_mid

  

mic\_eq\_high

  

djc\_mic

  

aux\_volume

  

linein

Activate or deactivate the linein on this deck. You can also specify a linein number to assign another linein: "deck 1 linein 2 on" Or you can assign the microphone or aux input: "deck 3 linein 'mic' on" or "deck 3 linein 'aux' on" If you don't want the line in to become the master deck automatically, you can use "deck 3 linein 'trs'"

  

linein\_rec

record the linein input on this deck.

  

mic\_rec

record the microphone input on this deck

  
  

## Audio\_scratch

touchwheel *(or* scratch\_wheel *or* scratchwheel*)*

used for a jogwheel with touch sensitivity. 'touchwheel +1.0' means a full rotation of the wheel.

  

get\_scratch\_direction

  

touchwheel\_touch *(or* scratch\_wheel\_touch *or* scratchwheel\_touch *or* speedwheel\_touch*)*

use when the touchwheel is touched, to hold the song and start to scratch.

  

jogwheel *(or* jog *or* jog\_wheel*)*

used for a jogwheel without touch sensitivity. 'jogwheel +1.0' means a full rotation of the wheel.

  

motorwheel

used for a motorized jogwheel. Each time the jogwheel moves, send 'motorwheel "move" +1.0' followed by 'motorwheel "timestamp" 1000.0'. 'move +1.0' means a full platter rotation. 'timestamp 1.0' means 1ms since last message. You should query 'motorwheel' and turn the motor on when it returns true and off when false.

  

speedwheel

used for a precision touchwheel that reports both position and speed. 'speedwheel +1.0 1.5' means a full rotation of the wheel, at 150% speed.

  

vinyl\_mode

Set the jogwheel to Vinyl mode (with scratch), or to CD mode (with pitchbend)

  

wheel\_mode

change the mode of the jogwheel between: "jog", "search", "loop\_move", "loop\_out", "loop\_in", "browser", or use +1 and -1 to cycle through all modes. You can select from a subset using a syntax like 'wheel\_mode "loop\_move,loop\_in,loop\_out" +1'.

  

hold *(or* scratch\_hold*)*

'hold on' or 'hold off' (or 'hold toggle') to stop the disc for scratching, or release it.

  

scratch

'scratch +120ms' to scratch 120ms forward.

  

nudge

'nudge +120ms' to nudge the song 120ms forward (using mastertempo if it's activated).

  

slip\_mode

While in slip mode, during loops hotcues or scratch, the play cursor will keep moving unaffected, and will resume from there after release

  

get\_slip\_active

  

get\_slip\_time

Get the time where the song will be when slip mode is de-activated in milliseconds Alternatively, use get\_slip\_time "min", get\_slip\_time "sec" and get\_slip\_time "msec"

  

slip

activate or deactivate a global slip mode, that will save the position on "slip on" and resume where it should have been if untouched on "slip off", letting you do any scratch/loop/effect/etc in between

  

scratch\_dna

execute a scratch defined by its DNA signature (see scratch\_dna\_editor for information about DNA signatures)

  

scratch\_dna\_option

set some options about the Scratch DNA behavior. options are "drymix" and "quantized"

  

scratch\_dna\_editor

open a visual editor to compose scratch DNA signatures

  
  

## Audio\_volumes

crossfader *(or* crossfader\_slider*)*

move the crossfader. crossfader 0% will only let the left deck out, crossfader 100% will only let the right deck out.

  

auto\_crossfade *(or* auto\_crossfader*)*

Automatically crossfade to the other deck. You can specify the duration of the crossfade in ms: 'auto\_crossfade 2000ms' Assigned to a slider, or specifying a specific position, it will move the crossfader slowly to that position: 'auto\_crossfade 50%' or 'auto\_crossfade 1000ms 50%'

  

level *(or* level\_slider *or* volume *or* volume\_slider*)*

set the volume of the deck

  

mute

Mute a specific deck

  

mic\_volume

Set the volume of the microphone

  

mic2\_volume

Set the volume of the second microphone

  

gain *(or* gain\_slider *or* power\_gain*)*

set the gain of a deck

  

gain\_label

get the text to display under the gain knob

  

gain\_relative

change the gain, relative to the software gain position

  

set\_gain

set the gain in order to bring the song to the specified dBA (with 0dBA being the maximum level outputable by the soundcard without compression): 'set\_gain 0'

  

mono\_mix

Mix left and right channels together for all outputs

  

fake\_mixer

tell VirtualDJ not to apply the volumes to the sound output

  

fake\_eq

tell VirtualDJ not to apply the equalizer to the sound output

  

fake\_gain

tell VirtualDJ not to apply gain to the sound output

  

fake\_hp

tell VirtualDJ not to apply headphone volume to headphone sound output

  

fake\_hpmix

tell VirtualDJ not to apply headphone mix to headphone sound output

  

fake\_pfl

tell VirtualDJ to disable pfl switch from skin, when pfl can only be controlled from controller or mixer

  

fake\_master

tell VirtualDJ not to apply master volume to master sound output

  

colorfx\_prefader

color fx are prefader (required for some controllers)

  

fake\_filter

tell VirtualDJ not to apply filter to sound output

  

master\_volume

set master volume

  

headphone\_volume

set cue volume

  

booth\_volume

set booth volume

  

headphone\_mix

change the mix of the PFL (0% is only the cued deck, 100% is the master output).

  

headphone\_crossfader

change the PFL fader (0% is only the left deck, 100% is only the right deck).

  

headphone\_gain

change the gain of the PFL output (from -30dB to +30dB)

  

master\_balance

change the left/right balance on the master output.

  

levelfader\_curve *(or* fader\_curve*)*

select the curve of the level faders. 0% is a linear curve, 50% (default) is a quadratic curve, 100% is a cubic curve

  

crossfader\_hamster

invert the crossfader.

  

crossfader\_curve

select the curve of the crossfader. enter a value to adjust the slope from a X curve (0%) to a inverted-U curve (100%). you can also specify common curves by name ("smooth", "full", "scratch", "cut"). or you can draw your own curve, using a syntax like 'crossfader\_curve "0=\[1,0\]/0.5=\[1,1\]/1=\[0,1\]"'.

  

crossfader\_disable

disable the crossfader

  

get\_limiter

return true if the limiter is compressing because the signal was saturated. Use 'deck 1 get limiter' to get the limiter on a deck in external mixer mode, or 'get\_limiter' (or 'get\_limiter "master") to get the limiter on the master for internal mixing mode (also can use 'get\_limiter "headphones"' and 'get\_limiter "booth"')

  

get\_level

Get level of signal before master volume. If no deck is specified will get master level Use "get\_level 'mic'" for microphone level, or "get\_level 'sampler'" for sampler level Use "get\_level 'vocal'" for vocal vu meter, other stem names also supported

  

get\_level\_log

Similar to get\_level, but returns level on logarithmic scale where -127dB=0.0 and 0dB=1.0

  

get\_level\_peak

Get peak level of signal before master volume. If no deck is specified will get master peak level.

  

get\_level\_left

Get level of left channel before master volume. If no deck is specified will get master level.

  

get\_level\_left\_peak

Get peak level of left channel before master volume. If no deck is specified will get master peak level.

  

get\_level\_right

Get level of right channel before master volume. If no deck is specified will get master level.

  

get\_level\_right\_peak

Get peak level of left channel before master volume. If no deck is specified will get master peak level.

  

get\_vu\_meter

Get level of signal after master volume. If no deck is specified will get master level. Use "get\_vu\_meter 'mic'" for microphone level or "get\_vu\_meter 'sampler'" for sampler level Use "get\_level 'vocal'" for vocal vu meter, other stem names also supported

  

get\_vu\_meter\_peak

Get peak level of signal after master volume. If no deck is specified will get master peak level.

  

get\_vu\_meter\_left

Get level of left channel after master volume. If no deck is specified will get master level.

  

get\_vu\_meter\_left\_peak

Get peak level of left channel after master volume. If no deck is specified will get master peak level.

  

get\_vu\_meter\_right

Get level of right channel after master volume. If no deck is specified will get master level.

  

get\_vu\_meter\_right\_peak

Get peak level of right channel after master volume. If no deck is specified will get master peak level.

  

is\_audible

active if the deck is playing and volume is up (on-air)

  

get\_crossfader\_result

get the actual volume balance between deck 1 and 2, based on crossfader, levels, and play (use get\_crossfader\_result "full" to show levels even for paused decks)

  
  

## Automix

automix

Start or stop automatic playlist mixing

  

automix\_dualdeck

Enable or disable automix using both decks

  

automix\_skip

When automix is active, skip the current song and mix to the next one

  

mix\_now

Smoothly crossfade from one side to the other, matching beats when the tempo of both songs is close together When automix is off, fade speed can be adjusted: "mix\_now 4000ms" or "mix\_now 4bt"

  

mix\_now\_nosync

Smoothly crossfade from one side to the other When automix is off, fade speed can be adjusted: "mix\_now\_nosync 4000ms" or "mix\_now\_nosync 4bt"

  

mix\_selected

When automix is active, mix to the song currently selected

  

mix\_next

If the non-playing deck has a song loaded that has already been played, load a new one from the playlist. Then smoothly crossfade from the playing deck to the other, using beatsync if appropriate

  

mix\_next\_sidelist

If the non-playing deck has a song loaded that has already been played, load a new one from the sidelist. Then smoothly crossfade from the playing deck to the other, using beatsync if appropriate

  

mix\_and\_load\_next

automatically mix to the next deck, then stop the current track and load a new song if something is available in the playlist or sidelist by default this will to a tempo mix and sync bpm if the bpm is in range. You can add 'nosync' to mix without tempo synchronization. 'mix\_and\_load\_next nosync'

  

get\_automix\_song

get a property from the next song in automix: "get\_automix\_song 'title'" you can also get properties from songs further down: "get\_automix\_song 'title' 2"

  

playlist\_options

display a drop-down with the list of options for the playlist.

  

sidelist\_options

display a drop-down with the list of options for the sidelist.

  

automix\_add\_next

Add the songs selected in the browser to the automix playlist right after the song currently playing If a song in the automix list is selected and automix is active, move it after the currently playing song

  

get\_automix\_position

Return position of currently playing song in automix list

  

playlist\_add

Add the songs selected in the browser to the automix list

  

playlist\_load\_and\_remove

Load the first song in the automix list on the deck, and remove it from list

  

playlist\_load\_and\_keep

Load the first song in the automix list on the deck, without removing it from the list

  

switch\_sidelist\_playlist

Exchange the content of the automix list and the sidelist

  

create\_list\_from\_playlist *(or* create\_virtualfolder\_from\_playlist*)*

Save the automix list in MyLists

  

playlist\_randomize

shuffle the order of the songs in the playlist.

  

playlist\_randomize\_once

shuffle the order of the songs in the playlist once.

  

playlist\_repeat

repeat (or stop to repeat) the playlist while automixing.

  

playlist\_clear

empty the playlist.

  

playlist\_save

save the playlist in a file.

  

playlist\_remove\_played

remove from the playlist all the songs that have already been played since the software was launched.

  

playlist\_remove\_duplicates

remove duplicate songs from the playlist.

  

automix\_editor

Open the automix editor, and fine-tune the automix transitions for every songs in your playlist

  

automix\_editor\_movetrack

When the automix editor is opened, move the selected track's position automix\_editor\_movetrack 'current' +10 Also accepts 'next' or 'previous' to move the next or previous track. When the number is not given it can be mapped to rotary knobs or jog wheels

  

relay\_play

Enable or disable the decks to automatically start playing when the opposite deck reached its end

  

get\_playlist\_time

Gets how much time is left before the end of the automix playlist

  
  

## Browser

add\_favoritefolder

make the selected folder a favorite folder (monitored folders).

  

add\_filterfolder

create a new filter folder.

  

add\_list *(or* add\_virtualfolder*)*

create a new list (virtual folder).

  

goto\_last\_folder

Go back to the last browsed folder

  

browser\_scroll

scroll through the songs or folders. 'browser\_scroll +1' or 'browser\_scroll -1' to scroll one line, or "browser\_scroll 'top'", "browser\_scroll 'bottom'" to scroll to the beginning or end

  

browser\_move

browser\_move +1 : Moves the currently selected song in a playlist down browser\_move 'top' or browser\_move 'bottom' : Moves the selected song to the top or the bottom of the list

  

browser\_folder

if focus is on songs, change focus to folders. if focus is on folders, open or close the subfolders of the selected folder.

  

browser\_enter

if focus is on songs, load the selected song. if focus is on folders, change focus to songs.

  

browser\_open\_folder

Expand selected folder in browser when closed, or close folder when opened. You can also use 'browser\_open\_folder off' to always close the folder, or 'browser\_open\_folder on' to open a folder

  

browser\_remove

Remove the selected song from playlist

  

browser\_window

Change the active browser zone. "browser\_window 'folders'", "browser\_window 'songs'", "browser\_window 'sideview'", or "browser\_window 'automix'", "browser\_window 'sidelist'", "browser\_window 'sampler'" Cycle through available browser zones. "browser\_window +1", "browser\_window -1" Cycle through specified zones. Example "browser\_window 'folders,songs'"

  

search

put the keyboard focus on the search zone, or, if a text parameter is specified, search for this text.

  

search\_add

add the specified text to the search query

  

search\_delete

remove the last character from the search query

  

clear\_search

clear the search string

  

edit\_search

put the keyboard focus in the search zone but keep the actual search string.

  

log\_search

log the current search in the SearchLog.txt file, so you can easily search for your failed requests once the gig is over.

  

search\_playlists

open a dialog to search which list contains a specific song by default it searches for the song selected in the browser. Use "search\_playlists deck" to search for the song loaded on the deck.

  

search\_folder

open a dialog to search for folders or playlists by name

  

grid\_view

put the browser in grid-view mode, optimized for touch screens

  

view\_options

popup the list of view options. to set one directly, you can use 'view\_options "showkaraoke" on' etc...

  

sideview\_options

show the context menu to add or remove folders shortcuts to the sideView

  

sideview\_triggerpad

set the sideview sampler in triggerpad mode or in list mode

  

file\_info

Open the Tag Editor for the specified or loaded song.

  

browsed\_file\_info

open the Tag Editor for the browsed song.

  

browsed\_file\_color

set the color of the file currently selected in the browser. Example: browsed\_file\_color "red" Use browsed\_file\_color "reset" to clear the color and set the color back to default

  

browsed\_file\_reveal

open the OS file manager to the browsed song

  

browsed\_file\_analyze

reanalyze the current file selected in the browser use 'browsed\_file\_analyze multi' to do a scan for multiple bpms

  

browsed\_file\_prepare\_stems

prepare stems for the file(s) currently selected in the browser

  

browsed\_file\_reload\_tag

Reload tag of file currently selected in browser. This will overwrite changes made in the VirtualDJ database by what is saved in the file's tag.

  

browsed\_file\_rename

rename the current file selected in the browser

  

set\_browsed\_file\_bpm

set the bpm of the selected songs to the set value: 'set\_bpm 129.3', or relative to the actual value: 'set\_bpm 50%'

  

load

load the selected song on the deck. you can also specify a fullpath to load 'load "path\_to\_my\_song"'.

  

load\_pulse

return a brief false then true again when a new song is loaded

  

load\_pulse\_active

return true when a new song becomes audible for the specified duration. Can be delayed using the second parameter. 'load\_pulse\_active 1000ms 5000ms' will return true for 1 second, 5 seconds after a new song becomes audible

  

loaded

return true if a song is loaded on the deck

  

undo\_load

Unload the song and reload the previous song. Use 'undo\_load any' to unload from the last deck a song was loaded on. Otherwise the deck the action is called from is used.

  

unload

unload the song from the deck.

  

browser\_isactive

return true when the browser was used by a controller in the past 6 seconds

  

not\_played

don't mark the song on this deck as 'played'.

  

browser\_gotofolder

'browser\_gotofolder' goes to the folder containing the current file. 'browser\_gotofolder "/my\_path/my\_folder"' goes to the specified folder. 'browser\_gotofolder 4' goes to the fourth virtual/favorite folder.

  

recurse\_folder

display the content of both the selected folder and all its subfolders in the browser list.

  

browser\_sort

Sort the browser files on the specified column: 'browser\_sort "artist"', 'browser\_sort "lastplay"',... To sort in descending order, add a - in front of the column name: 'browser\_sort "-bpm"' To explicitly sort in ascending order, add a + in front of the column name: 'browser\_sort "+bpm"' To reset the sort order of a playlist to it's original order, use 'browser\_sort "Original Sort Order"'

  

sideview\_sort

Sort the sideview on the specified column: 'sideview\_sort "artist"', 'sideview\_sort "lastplay"',...

  

playlist\_load

Load the folder or playlist selected in the browser in the playlist. Use "playlist\_load 'append'" to add the selected folder to the playlist instead of replacing the existing playlist

  

sidelist\_load

Load the folder or playlist selected in the browser in the sidelist Use "sidelist\_load 'append'" to add the selected folder to the sidelist instead of replacing the existing sidelist

  

karaoke\_load

Load the folder or playlist selected in the browser in the karaoke list Use "karaoke\_load 'append'" to add the selected folder to the karaoke list instead of replacing the existing karaoke

  

edit\_comment

open a window to edit the comment on the selected track.

  

search\_options

popup the list of search options. to set one directly, you can use 'search\_options "composer"' to toggle search of the field on or off

  

add\_to\_list *(or* virtualfolder\_add*)*

Add the currently selected songs in the browser to the specified List. 'add\_to\_list "my\_list"'

  

font\_size

Change browser font size. Example: font\_size +1

  

sidelist\_clear

clear the sidelist.

  

sidelist\_add

Add the songs selected in the browser to the sidelist

  

sidelist\_load\_and\_remove

load the first song from the sidelist, and remove it from the sidelist.

  

sidelist\_load\_and\_keep

load the first song from the sidelist.

  

karaoke\_add

Add the songs selected in the browser to the karaoke list

  

edit\_singer

Pops up the dialog to change the singer of the currently selected song in the karaoke list

  

file\_count

Get number of files currently shown in browser You can also use 'automix', 'sideview', 'karaoke' or 'sidelist' as parameter to get the count in other lists. "file\_count automix"

  

sideview

Show a specific folder in the sideview. Available sideviews are automix,sidelist,karaoke,sampler,clone Use 'sideview +1' or 'sideview -1' to scroll between available sideviews

  

sideview\_title

Show the title of the folder selected in sideview

  

info\_options *(or* infos\_options*)*

show the context menu about the info panel fields and prelisten behavior

  

page

  

save\_deck\_set

Save the current configuration (which song is loaded on which deck) in a file

  

load\_deck\_set

Reload a previously saved deck\_set file

  

browser\_options

show the context menu about the browser filters, root folders, database, etc

  

browser\_export

Export the current list of files to a CSV or HTML file

  

rating

Get or set the rating for the current song

  

browser\_zoom *(or* browser*)*

  

browser\_geniusdj

Lookup recommendations based on the items currently selected in the browser Use 'browser\_geniusdj playing' to use the currently playing track instead of the track selected in the browser

  

browser\_padding

Change the padding around lines in folder and list views. Example: browser\_padding 50%

  

load\_next

Load next track. You can use 'load\_next keepplay' to start playing the loaded song if the currently loaded song was playing

  

load\_previous

Load previous track

  

sidereco\_options

Show a menu to select what should be displayed in the sideview recommendation panel

  

sidereco\_song

  

sidereco\_source

  

mark\_linked\_tracks *(or* mark\_related\_tracks*)*

Mark the tracks in deck 1 and 2 as linked. (Linked tracks can be shown in the remixes tab of the sideview)

  

has\_linked\_tracks

Returns true when track has links to other tracks. On a button can be used to show the linked tracks in the sideview You can also use 'has\_linked\_tracks browsed' to get the result for the currently browsed track Passing a script that returns a full file path is also possible using 'has\_linked\_tracks \`script\`'

  

has\_quick\_filter

Return true if quick filter with given index exists

  

quick\_filter

Apply or remove a quick filter on the list of song shown in the browser

  

browser\_shortcut

'browser\_shortcut': assign the current folder as a new shortcut\\n'browser\_shortcut X': go to the folder assigned to the Xth shortcut

  
  

## Config

settings *(or* config*)*

open the configuration window.

  

smart\_loop

when smart\_loop is on, loop are automatically adjusted to sound perfect

  

smart\_play *(or* auto\_sync*)*

when smart\_play is on, songs are automatically synchronized when started

  

smart\_cue

when smart\_cue is on, songs are automatically re-synchronized when jumped to a new position or cue

  

auto\_match\_bpm

when Auto Match BPM is on, songs are automatically set to the same BPM when loaded

  

auto\_match\_key

when Auto Match KEY is on, songs are automatically set to a compatible KEY when loaded, if possible

  

auto\_pitch\_lock

when Auto Pitch Lock is on, pitch\_lock engages whenever BPMs are matched, so that moving manually one pitch slider will move the other in order to keep the match

  

quantize\_loop

when quantize\_loop is on, loops automatically align according to the globalQuantize setting

  

quantize\_setcue

when quantize\_setcue is on, setting cues automatically align according to the globalQuantize setting

  

smart\_scratch

when smart\_scratch is on, backward scratching is automatically muted, only forward scratching will be heard

  

play\_mode

set the mode for play/stop/cue buttons: 'play\_mode "numark"', or 'play\_mode "pioneer"'.

  

save\_config *(or* saveregistryconfig*)*

save your config changes now (usually changes are saved automatically when you close virtualdj)

  

auto\_cue

set the auto\_cue mode: "off", "on", "always".

  

setting

read or write a specific setting (see config window for the list of all settings names) Example: setting "jogSensitivityScratch" 80% Example: setting "videoRandomTransition" on

  

setting\_setsession

force a specific value for a setting during this session

  

setting\_setsession\_deck

force a specific value for a setting during this session for a specific deck

  

setting\_setdefault

change the default value for a setting during this session

  

setting\_reset

reset a setting to its default value

  

setting\_ismodified

  

fader\_start

enable or disable fader start

  

get\_lemode

return true if we are running a LimitedEdition

  

apply\_audio\_config

  

eventscheduler\_start

Start the Event Scheduler (can specify one specific saved schedule: eventscheduler\_start 'summer\_wedding')

  

eventscheduler

Open the Event Scheduler

  

connect

  
  

## Controllers

get\_controller\_name

return the name(s) of the controller(s) assigned to this deck

  

get\_ns7\_platter

  

get\_denon\_platter

  

get\_pioneer\_loop\_display

  

get\_controller\_image

Use in controller mappings to get the cover art from deck for use on controllers with screens

  

get\_pioneer\_display

  

pioneer\_play

On when playing, off when no track loaded, blinking when paused or playing with cue stutter

  

pioneer\_cue

On when playing or paused on cue, blinking when paused and not on cue, off when no track loaded

  

numark\_waveform\_zoom

Set numark waveform zoom (value from 0 to 3, or +1, -1 to step through zoom levels)

  

get\_numark\_waveform

  

get\_rotation\_cue

get the angle of the cue point on the disc

  

get\_rotation\_slip

get the angle of the slip point on the disc when slip is active, or regular get\_rotation otherwise

  

get\_numark\_beatgrid

  

get\_numark\_songpos

  

get\_gemini\_display

  

get\_gemini\_waveform

  

gemini\_waveform\_zoomlevel

  

get\_denon\_cuepoints

'get\_denon\_cuepoints 100' for a led bar with 100 leds. Number must match the number of leds in the led bar in the definition.

  

menu\_button

defines a button whose behaviour can be changed by a menu. Syntax: 'menu\_button 1 "hotcue,sampler,effect,loop"'.

  

menu

display a menu on the controller's screen, that allows to change the behaviour of the menu\_buttons. you can navigate through the menu using the browser\_scroll action'.

  

menu\_cycledisplay

on single-line controllers, cycle display when no menu is shown between artist - title, artist or title

  

get\_display

get some text to display. depending on the latest action, it can be the name of an effect, the folder being browsed, the title of the current song, etc... for multiline displays, you can add the line number: "get display 1", "get display 2".

  

get\_controller\_screen

  

shift

set or query the built-in shift variable, used for controllers

  

display\_time

set the mode to display time: "total", "remain", "elapsed", +1 or -1.

  

show\_text

Show text on controller display. (If your controller uses get\_display for the displays) "show\_text 'Line 1|Line 2' 3000ms" will show 2 lines of text for 3 seconds (time optional, | separates lines) "show\_text '$myvar$'" shows the contents of the variable $myvar

  

action\_deck

return true if the button calling this action is on the specified deck: 'action\_deck 1 ? actionA : actionB'

  

set\_deck

use script or implicit variable to affect which deck the action is applied to example: 'set\_deck \`get\_var varname\` & play'

  

device\_side

Assign a different action for a button or slider of a device depending on which side of the device it is on: "device\_side 'left' ? action\_for\_left : action\_for\_right" For more than 2-deck controllers, you can use "device\_side 1 ? action1 : device\_side 2 ? action2 ? device\_side 3 ? action3 : etc..."

  

invert\_controllers

Invert the deck of the controllers

  

rescan\_controllers

rescan for newly connected controllers.

  

reinit\_controller

Reinit the specified controller (or all if none specified), going through the exit and init sequences (you can specify a delay between exit and init: "reinit\_controllers 'mycontroller' 200ms".

  

midiclock\_active

Toggle sending midiclock to the specified controller

  

miditovst\_active

Toggle sending midi from a specific controller to the specified deck's VST instruments or effects

  

refresh\_controller

refresh the display of the specified controller (or all if none specified).

  

assign\_controller

Assign a specific controller to this deck. 'deck 1 assign\_controller "CDJ400" 2' assigns the second CDJ400 to deck 1 Or in a controller mapping 'deck 1 assign\_controller' will assign the controller the action was executed from to deck 1.

  

ns7\_platter

  

phase\_movement

  

phase\_position

  

controller\_battery

  

v7\_status

  

motor\_switch

assign this deck to be controlled by the motorized wheel

  

denon\_platter

  

motorwheel\_instant\_play

when set to on, the song will start instantly, bypassing the ramp up time the motor takes to reach its full rotation speed (the drawback is that then you cannot hold the disc still when your start the motor)

  

djc\_shift

  

djc\_button

  

djc\_button\_popup

  

djc\_button\_slider

  

djc\_button\_select

  

djc\_panel

  

mixer\_order

For controllers with 4 decks, specify the order of the decks, from left to right. Default: "mixer\_order 3124"

  

effect\_fxsendreturndeck

  

effect\_fxsendreturndeck\_multi

Select which source to apply fx to for a specific send/return channel in case there are more than one 'deck 1 effect\_fxsendreturndeck\_multi master' : Apply master fx on the first fx send/return pair 'deck 2 effect\_fxsendreturndeck\_multi mic' : Apply mic fx on the second fx send/return pair 'deck 2 effect\_fxsendreturndeck\_multi 4' : Apply deck 4 fx on the second fx send/return pair

  

effect\_fxsendreturnenable

  

os2l\_button

Send a command to a DMX software over OS2L: 'os2l\_button "blackout"', 'os2l\_button "fog machine" while\_pressed', etc. If you want to specify a page, you can use 'os2l\_button "mypage" "mybutton"'. If the DMX software doesn't send feedback commands, os2l\_button acts as a flash button (it sends 'on' when pressed, 'off' when released) - use 'os2l\_button "mybutton" on' to not send commands on release. If the DMX software sends feedback commands, os2l\_button acts as a toggle button (it sends the opposite of the last feedback when pressed, nothing on release) - use 'os2l\_button "mybutton" while\_pressed' to send a command on release.

  

os2l\_scene

similar to os2l\_button, but sends 'on' to the DMX software only if the button was not active yet, and only if the deck is audible. (requires feedback from the DMX software) when the deck is not audible, the scene will be queued and started when the deck becomes audible os2l\_scene "scene1" os2l\_scene "mypage" "myscene"

  

os2l\_cmd

Send a numeric command to a DMX software over OS2L: 'os2l\_cmd 42 on' or 'os2l\_cmd 43 50%'

  

os2l\_info

  

rzx\_touch

  

rzx\_touch\_x

  

rzx\_touch\_y

  

controller\_mapping

Assign a mapping to a controller 'controller\_mapping "My Mapping"' assigns the mapping 'My Mapping' to the controller the command was executed on 'controller\_mapping "CDJ400" "My Mapping"' assigns the mapping 'My Mapping' to all CDJ400s 'controller\_mapping "CDJ400" "My Mapping" 2' assigns the mapping 'My Mapping' to the second CDJ400

  

controllerscreen\_deck

  

keyboard\_shortcuts

Map to CTRL or ALT. While pressed will show keyboard overlay in browser. Double-press to activate sticky keys. Accepts time to delay showing overlay (keyboard\_shortcuts 500ms). In scripts can also be used to turn on or off the overlay manually (keyboard\_shortcuts on)

  

select\_master\_output

Select if the audio should be played on the computer speakers or on the controller audio output

  
  

## Cues

cue\_stop

if playing, pause and go to the last cue point. if paused, set the current position as cue point, and preview the cue as long as pressed. you can specify a number ('cue\_stop 1', 'cue\_stop 57') to work with several cues.

  

cue\_play

if playing, pause and go to the last cue point. if paused, set the current position as cue point, and preview the cue as long as pressed. if you kept pressed more than 2s (or the time specified), it will continue playing once you release. syntax: 'cue\_play 1 1000ms'

  

cue

if playing, go to the last cue point and continue playing. if paused, set the current position as cue point, and preview the cue as long as pressed. if in loop, change loop\_in to the cue point but keep the loop's length. you can specify a number ('cue 1', 'cue 57') to work with several cues.

  

hot\_cue *(or* hotcue*)*

if no cue point is set, or if 'cue', 'cue\_stop' or 'cue\_play' is pressed, set one at the current position. otherwise go to the cue point and start or continue playing. if in loop, set the cue point as new loop\_in but keep loop\_length. you can specify a number ('hot\_cue 1', 'hot\_cue 57') to work with several cues.

  

silent\_cue

Mute track when enabled until a hot cue is activated

  

cue\_select

Select the nth cue point as default cue point for cue, hotcue, etc.. actions. Does not change position to the selected cue point.

  

cue\_cup

if playing, rewind to the last cue point, and start again on release. if paused, set the current position as cue point.

  

cue\_button *(or* cue\_3button*)*

act like cue\_stop, cue\_play or cue\_cup depending on the cueMode setting

  

set\_cue

store the current position in the cue. if one parameter is given, it's the number of the cue to use. if two parameters are given, the second is the position to store, in ms, in beats, or in percentage of the song length.

  

goto\_cue

Go to the specified cue. Example "goto\_cue 1", "goto\_cue +1", "goto\_cue -1" "goto\_cue" will jump to the currently selected/last used cue.

  

delete\_cue

Deletes a stored cue point. If no cue number is specified, it will delete the currently active cue point

  

cue\_pos

"cue\_pos 1" returns the position of cue point #1 as a percentage "cue\_pos 1 msec", "cue\_pos 1 sec", "cue\_pos 1 min" returns the position of cue point #1, msec, sec and min parts "cue\_pos 1 mseconly" returns the position of cue point #1 in milliseconds "cue\_pos 1 beats" returns the position of the cue point in number of beats from first beat

  

cue\_name

"cue\_name 1" returns the name of cue point #1, or changes the cue point when pressed

  

cue\_action

  

get\_cue

returns the currently active cue, or 0 if no cue point is active

  

has\_cue

returns true if the specified cue number is set

  

cue\_countdown

count down to the next cue (or end) in beats use 'cue\_countdown color' or 'cue\_countdown name' to get the name or color of the next cue point

  

cue\_countup

count up from the last cue point (or start) in beats use 'cue\_countup color' or 'cue\_countup name' to get the name or color of the last cue point

  

cue\_counter

count up or down to the nearest cue point in beats use 'cue\_counter color' or 'cue\_counter name' to get the name or color of the nearest cue point

  

lock\_cues

lock/unlock the cues for this particular song, so that cue actions cannot inadvertently modify them while you're playing

  

shift\_all\_cues

shift all the cues of the song from the given amount (can be used to fix the cues from v7 imported files in case the automatic fix didn't work properly): 'shift\_all\_cues -10ms'

  

cue\_color

query or set the color of a cue point Query example: cue\_color 1 Set example: cue\_color 1 'yellow'

  

cue\_loop

Jump to a cue and stay in a loop. Use cue\_loop\_hold to select if loop is temporary, or stays until pressed again. When the cueLoopAutoSync option is enabled, jumping to the cue is beat synchronized

  

cue\_loop\_hold

Toggle cue\_loop between looping while pressed and turn loop on/off

  

cue\_loop\_autosync

  

cue\_display

Show information about a cue point based on the cueDisplay config option. Example: 'cue\_display 1' Can also be used to modify the cueDisplay option by using +1 or -1 as parameter: 'cue\_display +1' The cueDisplay option can also be set by name: 'cue\_display name'

  

sort\_cues

sort cue points chronologically

  

cues\_options

Show some options about cues

  
  

## Deck\_select

select

select this deck as 'working deck'. the beat of the working deck will be shown in front in the display, and shortcuts and actions with no specified deck will affect this deck.\\nUnless PFL has been set manually, the PFL will also follow the working deck.

  

masterdeck\_auto

remove the masterdeck selection and put back automatic masterdeck behavior

  

masterdeck

select/unselect this deck as 'master deck'. When a master deck is set, all synchronization operations will take the master deck as reference. (for skins with more than 2 decks)

  

leftdeck

select this deck to be the left deck: "deck 3 leftdeck" or "leftdeck +1"

  

rightdeck

select this deck to be the right deck: "deck 3 rightdeck" or "rightdeck +1"

  

invert\_deck

switch leftdeck between deck 1 and deck 3 or rightdeck between deck 2 and deck 4 "invert\_deck" to swap the calling deck, or "invert\_deck 'left'", "invert\_deck 'right'" to specifically switch left or right deck

  

leftcross

assign this deck to the left of the crossfader: "deck 3 leftcross" "deck 3 leftcross 'only'" to assign only deck 3 to left of the crossfader "leftcross 'none'" to disable the left crossfader

  

rightcross

assign this deck to the right of the crossfader: "deck 3 rightcross"

  

cross\_assign

assign this deck to a side of the crossfader: "deck 3 cross\_assign 'left'" or "deck 3 cross\_assign 'thru'"

  

pfl

select if this deck is sent to the headphones. (can be used with a slider or a % to specify the volume: 'pfl 75%')

  

get\_deck\_color

return blue or red if the deck is the left deck or right deck (and gray otherwise). Can be used with a darkness modifier: 'get\_deck\_color 50%' Use 'get\_deck\_color "absolute"' or 'get\_deck\_color "absolute" 50%' to get a color based on actual deck rather than left/right (red for deck 1, blue for deck 2, orange for deck 3, green for deck 4)

  
  

## Equalizer

eq\_mode

Select the behavior of the EQs knobs (frequency, modernEQ or EZRemix) Can be used to switch between Frequency and your preferred stems mode using 'eq\_mode +1' To change the eq mode only for a single deck, use "eq\_mode +1 deck" (or "deck 1 eq\_mode +1 deck" to specify deck 1 in your script) To select a specific behavior, you can use "eq\_mode frequency", "eq\_mode modernEQ", "eq\_mode ezRemix" or "eq\_mode stems"

  

mute\_stem

mute one stem. Stem names are: "HiHat", "Vocal", "Instru", "Bass", "Kick", or you can use aggregate stems: "Melody" (Instru+Bass), "Rhythm" (HiHat+Kick), "MeloRhythm" (Instru+Bass+HiHat+Kick)

  

only\_stem

keep only one stem. Stem names are: "HiHat", "Vocal", "Instru", "Bass", "Kick", or you can use aggregate stems: "Melody" (Instru+Bass), "Rhythm" (HiHat+Kick), "MeloRhythm" (Instru+Bass+HiHat+Kick)

  

stem\_pad

mute a stem (or isolate if pressed with Shift). Stem names are: "HiHat", "Vocal", "Instru", "Bass", "Kick", "Rhythm", "MeloRhythm", "Acapella", "Instrumental"

  

has\_stems

Return true if the track has stems available. Can also be called with 'has\_stems "2.0"' to check for new engine, or 'has\_stems "ready"' to check if stems are ready at the current playing position

  

stems\_bleed

Control how much the fast stems separation algorithm will allow bleeding. The action affects one of the four bleeding values (MuteVocal, MuteInstru, OnlyVocal, OnlyInstru) depending on what is currently muted or isolated on the deck. (NOTE: this does nothing on the regular HiQuality algorithm)

  

high\_label

  

mid\_label

  

low\_label

  

eq\_high *(or* eq\_high\_slider*)*

change the amount of HiHat, Vocal or High (depending on EQ control mode).

  

eq\_mid *(or* eq\_med *or* eq\_mid\_slider*)*

change the amount of Melody, Vocals or Medium (depending on EQ control mode).

  

eq\_low *(or* eq\_low\_slider*)*

change the amount of Kick or Low in the mix (depending on EQ control mode).

  

stem

Change the amount of a stem in the mix. Stem names are: "HiHat", "Vocal", "Instru", "Bass", "Kick", or you can use aggregate stems: "Melody" (Instru+Bass), "Rhythm" (HiHat+Kick), "MeloVocal" (Melody/Vocal). To get kill on left side and isolate on right side of the slider, you can use "FullVocal", "FullMelo" and "FullRhythm" To map a slider to always control the equalizer, regardless of EQ mode, you can use "stem FreqHi", "stem FreqMid", and "stem FreqLo"

  

eq\_high\_freq

set the treble equalizer

  

eq\_mid\_freq

set the medium equalizer

  

eq\_low\_freq

set the bass equalizer

  

eq\_kill\_high

mute the treble

  

eq\_kill\_mid *(or* eq\_kill\_med*)*

mute the medium.

  

eq\_kill\_low

mute the bass.

  

eq\_crossfader\_high

crossfade the treble between both decks

  

eq\_crossfader\_mid *(or* eq\_crossfader\_med*)*

crossfade the center frequencies between both decks.

  

eq\_crossfader\_low

crossfade the bass between both decks

  

eq\_reset

reset the equalizer.

  

filter\_activate

enable or disable the deck filter

  

filter *(or* filter\_slider*)*

apply the selected colorfx to the sound (nothing applied at 50%, and more applied the farther from the center)

  

filter\_label

get the text to display under the filter knob (use filter\_label "clean" to always get the value, and filter\_label "name" to always get the name)

  

filter\_resonance

change the resonance of the filter

  

filter\_selectcolorfx

Select the color effect controlled by the filter knob

  

stem\_color

get the default color of a specific stem

  
  

## Get

get\_beat

get the intensity of the beat at the current position (0% to 100%).

  

get\_beat2

get the intensity of the beats from both decks at the same time.

  

get\_beatgrid

get the intensity of the beat based on the beatgrid (100% if on the beat, 0% if halfway between to beats).

  

get\_beatpos

get the current position in beatgrid coordinate (27.5 would mean halfway between the 27th and 28th beats in the song).

  

get\_beatdiff

Get the distance between the beat from this deck and the beat from the active deck 50% means the deck are aligned, 0% means this deck is late half a beat, 100% means it is ahead half a beat 'get\_beatdiff 4' will return the distance percentage between bars instead of beats

  

get\_bpm

Get the bpm of the song Use 'get\_bpm absolute' to get the original bpm of the song (not changing when changing the pitch)

  

get\_firstbeat

get the position of the first beat (in milliseconds)

  

get\_firstbeat\_local

get the position of the first beat in the current phrase 16 beats (in milliseconds)

  

get\_time

get the elapsed time (or remaining or total depending on "display\_time"), in milliseconds. Use 'get time 1000' to get another unit than ms (1000=ms, 25=1/25th of seconds, 44100=frames, etc). Use "elapsed", "remain" or "total" to bypass the setting of display\_time. Use "absolute" not to take the pitch into account. On texts, use "short" to hide the decimals. Example: get\_time "remain" "short"

  

get\_time\_sign

Get the sign (-1 or +1) of the elapsed time (or remaining or total, depending on "display\_time") You can write 'get\_time\_sign "elapsed"' or "remain" or "total" to bypass the setting of display\_time

  

get\_time\_hour

Get the hours of the elapsed time (or remaining or total, depending on "display\_time") Use 'get\_time\_hour "absolute"' if you don't want to take the pitch variations into account You can write 'get\_time\_hour "elapsed"' or "remain" or "total" to bypass the setting of display\_time

  

get\_time\_min

get the minutes of the elapsed time (or remaining or total, depending on "display\_time"). use 'get time\_min "absolute"' if you don't want to take the pitch variations in account. you can write 'get time\_min "elapsed"' or "remain" or "total" to bypass the setting of display\_time

  

get\_time\_sec

get the seconds of the elapsed time (or remaining or total, depending on "display\_time").

  

get\_time\_ms

get the 1/100th seconds of the elapsed time (or remaining or total, depending on "display\_time") use 'get\_time\_ms 1000' to get the actual milliseconds

  

get\_time\_msf

get the MSF frame of the elapsed time (or remaining or total, depending on "display\_time").

  

get\_totaltime\_min

get the minutes of the length of the song

  

get\_totaltime\_sec

get the seconds of the length of the song

  

get\_totaltime\_ms

get the 1/100th seconds of the length of the song

  

get\_totaltime\_msf

get the frames of the length of the song

  

get\_rotation

get the angle of the disc

  

get\_arm

get the position of the turntable arm

  

get\_position

get the position in the song

  

get\_automix

get the position of the automix crossfader

  

get\_volume

get the volume applied by both the volume sliders and the crossfader

  

get\_deck

get the number of the deck

  

get\_deck\_letter

get the letter of the deck

  

get\_spectrum\_band

get the level of a single spectrum band. 'get\_spectrum\_band 1' Use 'deck master' in front to get spectrum of the master deck 'deck master get\_spectrum\_band 1' By default there are 32 bands, to use a smaller number of bands, use 'get\_spectrum\_band 1 3' to get the first of 3 bands The third parameter can be used to get a spectrum of stems 'get\_spectrum\_band 1 32 vocals'

  

get\_plugindeck

For use in plugins. Returns 1,2,etc... when plugin is active on a deck, 0 for master, -1 for sampler, -2 for mic

  

get\_defaultdeck

get the number of the default deck

  

get\_leftdeck

get the number of the left deck

  

get\_rightdeck

get the number of the right deck

  

get\_activedeck

get the number of the sync master deck

  

get\_decks

get the total number of decks of the current skin (can also be used with argument to compare: 'get\_decks 4' returns true if 'get\_decks' would return 4, false otherwise)

  

get\_custom\_text

  

get\_beat\_counter

get the position of the beat counter

  

get\_beat\_num

"get\_beat\_num" returns a value between 1 and 4 indicating the beat in the measure "get\_beat\_num 1 4" returns true when the first beat of the measure is currently playing "get\_beat\_num 1" returns true when the first beat of a 4-beat measure is currently playing (works from 1 to 4) "get\_beat\_num 16" returns a percentage indicating the beat position in a 16-beat phrase (works with any phrase number larger than 4)

  

get\_phrase\_num

"get\_phrase\_num" returns a value between 1 and 4 indicating the measure number "get\_phrase\_num 1" returns true when the first measure of the phrase is currently playing

  

get\_bar

returns the current bar number (1 bar = 4 beats)

  

get\_beat\_bar

get the position in % in the 4:4 bar (or in 4:16 if called with 'get beat\_bar 16')

  

get\_filepath

get the filepath of the song on the deck

  

get\_filename

  

get\_filesize

  

get\_artist

  

get\_title

  

get\_title\_remix

Return combination of title and remix: "Title (Remix)".

  

get\_title\_before\_remix

Return title of the track. If remix is empty, the part in brackets in the title is removed (and shown by get\_remix\_after\_title)

  

get\_remix\_after\_title

Return remix of the track loaded on the deck like "(remix)" Remix will automatically be extracted from title if remix field is empty

  

get\_artist\_before\_feat

Return artist of the track, with 'featuring' stripped

  

get\_featuring\_after\_artist

Return featuring artist, stripped from artist or title field

  

get\_artist\_title\_separator

Return a dash ( - ) if there is both an artist and a title

  

get\_artist\_title

  

get\_title\_artist

  

get\_album

  

get\_year

  

get\_genre

  

get\_composer

  

get\_songlength

get the length in seconds of the song on the deck

  

get\_comment

  

get\_version

Returns version as text such as "2025"

  

get\_build

Returns build number

  

get\_membership

  

get\_license

  

get\_hwnd

return the Windows handle to VirtualDJ's window

  

get\_vdj\_folder

return the home folder of VirtualDJ.

  

get\_browsed\_selection\_index

'get\_browsed\_selection 1 3' returns true if the first line is the selected line in a browser 3 lines high 'get\_browsed\_selection 3' returns the line number of the selected line in a browser 3 lines high (between 1 and 3)

  

get\_browsed\_folder\_selection\_index

'get\_browsed\_folder\_selection 1 3' returns true if the first line is the selected line in a browser 3 lines high 'get\_browsed\_folder\_selection 3' returns the line number of the selected line in a browser 3 lines high (between 1 and 3)

  

get\_browsed\_song

get a property from the currently browsed file: "get\_browsed\_song 'title'", "get browsed\_song 'playcount'", etc...

  

browsed\_song

set a property of the currently browsed file: "browsed\_song 'rating' 5", ...

  

get\_loaded\_song

get a property from the song loaded on the deck: "deck 2 get\_loaded\_song 'album'"

  

loaded\_song

set a property of the currently loaded file: "loaded\_song 'rating' 5", ...

  

get\_loaded\_song\_color

'get\_loaded\_song\_color red 255' (component, default color) 'get\_loaded\_song\_color white' (default color) returns color for the loaded track. This includes color filters. (For manually selected color only, use 'get\_loaded\_song color' instead)

  

prelisten\_info

  

get\_browsed\_artist

  

get\_browsed\_title

  

get\_browsed\_title\_artist

  

get\_browsed\_artist\_title

  

get\_browsed\_album

  

get\_browsed\_composer

  

get\_browsed\_genre

  

get\_browsed\_comment

  

get\_browsed\_filepath

get the filepath of the song currently selected in the browser

  

get\_browsed\_bpm

  

get\_browsed\_color

'get\_browsed\_color 0 red 255' (item, component, default) 'get\_browsed\_color 0 white' (item, default) returns color for selected item. This includes color filters. (For manually selected color only, use 'get\_browsed\_song color' instead)

  

get\_browsed\_header

  

get\_browsed\_scrollpos

  

get\_browsed\_scrollsize

  

get\_browsed\_folder\_scrollpos

  

get\_browsed\_folder\_scrollsize

  

get\_browsed\_folder\_icon

  

get\_browsed\_folder

get the name of the folder selected in the browser

  

get\_browsed\_folder\_path

get the full path of the folder selected in the browser

  

get\_browsed\_folder\_tab

  

get\_browsed\_key

  

get\_record\_time

get the time already spent recording

  

get\_record\_size

get the current size of the recording file

  

get\_record\_message

get the message displayed on the record page

  

get\_record\_min

get the minutes of the recording time

  

get\_record\_sec

get the seconds of the recording time

  

get\_record\_ms

get the milliseconds of the recording time

  

get\_record\_msf

get the frames of the recording time

  

get\_haslinein

returns true if the current soundconfig includes some linein inputs

  

get\_hasmic

returns true if the current soundconfig includes a mic input

  

has\_aux

returns true if the current soundconfig includes a aux input

  

get\_hasinput

returns true if the current soundconfig includes any input (mic, linein or timecode)

  

get\_hasheadphones *(or* get\_hasheadphone*)*

True when a headphones output is configured in sound setup, or when the controller has a headphone volume control

  

get\_hasmaster

True when a master output is configured in sound setup, false for external mixer configurations

  

get\_askthedj\_unread

Returns the number of unread Ask The DJ requests (requires askTheDJMonitoring setting to be on always)

  

get\_askthedj

Returns the latest request from ask the dj (requires askTheDJMonitoring setting to be on always) Use 'get\_askthedj 2' to get the second latest request, etc.

  

get\_deck\_analysis

  

get\_song\_event

Provide analysis about current and coming events in the song. Can be used when writing visualisation plugins. The first parameter is "current" or "next" to get the current or the coming event. The second parameter can be "hasbeats", "volume", "volume\_end", "remaining"

  

get\_username

  
  

## Karaoke

karaoke

Start or stop automatic karaoke loading and background music

  

karaoke\_options

show the contextmenu with the karaoke options

  

karaoke\_show

show the singer list on the video output

  

get\_next\_karaoke\_song

Get info about the upcoming karaoke tracks Example 'get\_next\_karaoke\_song "singer" +1'

  

get\_karaoke\_background\_song

Get info about the background song playing in karaoke mode

  

is\_karaoke\_idle

On when karaoke mode is active but not playing. (Background music may be playing)

  

has\_karaoke\_next

On when karaoke mode is active and there is still another singer queued

  

is\_karaoke\_playing

On when karaoke track is playing and karaoke mode is active. Off when background music is playing

  

karaoke\_venue\_name

  
  

## Key

key

change the key of the song, from -12 (one octave down) to +12 (one octave up), only in multiple of semitones.

  

get\_key\_modifier

get the number of semitone up or down currently applied to the song

  

get\_key\_modifier\_text

get the number of semitone up or down currently applied to the song

  

get\_harmonic

  

get\_key

get the key of the current song, based on keyDisplay option Use get\_key "musical" or get\_key "harmonic" to get a specific display independent of keyDisplay option

  

key\_smooth

change the key of the song, from -6 (half octave down) to +6 (half octave up), allowing not only multiple of semitones. use key\_smooth full for full octave up or down

  

key\_move

move the key up or down from the given amount of semitones.

  

set\_key

change the key of the song to match the given key. you can use standard notation ('set\_key "A#m"') or numeric ('set key "03A"'). if no given key, it will use the other deck. the change will match the exact key.

  

match\_key

change the key of the song to match the given key. you can use standard notation ('match\_key "A#m"') or numeric ('match\_key "03A"'). if no given key, it will use the other deck. the change will be the smallest change to make it compatible with the given key.

  

key\_match\_button

Match key to the other deck's key on first press, or reset key to normal on second press

  

key\_match\_menu

Open a menu to select a different key for the current song

  

get\_key\_color

Return color of the current key of the track in the specified deck

  

key\_lock *(or* keylock*)*

activate/deactivate the key lock (to make the pitch slider change the speed of the song, but keep the key of the song like it is now).

  

keycue\_pad\_jump

when on, keycue\_pad will jump to the cue point on each press, when off, keycue\_pad will only modify the key without jumping to the cue point

  

keycue\_pad

change the key depending on the pad and play the current cue point

  

keycue\_pad\_color

green for the selected key, magenta for lower keys, orange for higher keys and white for no key change

  

keycue\_pad\_page

change the offset of the key change by keycue\_pad actions

  
  

## Loop

loop

set or remove a loop. 'loop 4', 'loop 0.5' set a loop in beats. 'loop 10ms' set a loop in ms. 'loop 200%' multiply by 2 the size of the loop. 'loop 50%' divides by 2. 'loop' alone set a loop at the actual position with the same beat size as the last set loop.

  

get\_loop\_in\_time

Get time (in ms) of the start of the loop Use "get\_loop\_in\_time 1.0" to return the time in seconds instead of milliseconds Use "get\_loop\_in\_time on" to return the loop in time even when no loop is active

  

get\_loop\_out\_time

Get time (in ms) of the end of the loop Use "get\_loop\_out\_time 1.0" to return the time in seconds instead of milliseconds Use "get\_loop\_out\_time on" to return the loop out time even when no loop is active

  

loop\_button

one-button smart loop: Set the loop in on the first press, set the loop out on second press, remove the loop on third press.

  

loop\_in

if not in loop, set the beginning of a loop. if in loop, jump back to the beginning of the loop.

  

loop\_out

if not in loop, set the deck in loop, starting from the last set loop\_in point or stutter point. if in loop, exit the loop.

  

pioneer\_loop\_in

  

pioneer\_loop\_out

  

pioneer\_loop

  

loop\_length

change the length of the loop. 'loop\_length 15ms' set the length in ms, 'loop\_length 0.5' set the length in beats, 'loop\_length +100%' set the length in percentage of the actual length.

  

loop\_move

move the loop without changing its length. 'loop\_move +10ms' set the distance in ms, 'loop\_move +2' set the distance in beats, 'loop\_move +50%' set the distance in percentage of the actual length.

  

loop\_double

doubles the length of the loop.

  

loop\_half

halves the length of the loop.

  

loop\_exit

remove the loop.

  

loop\_select

set the loop size (or default loop size if no loop is active). If no parameter is provided, a popup list of loop values to choose from will be displayed.

  

reloop

jump to the loop\_in point.

  

reloop\_exit

if in loop, remove the loop. otherwise, reactivate the last used loop. Highlights when a loop had been used

  

loop\_position

Get relative position in loop (from 0% to 100%)

  

get\_active\_loop

get the number of beats in the current loop

  

get\_loop

get the number of beats in the current loop or the default loop size if no loop is active

  

loop\_save

'loop\_save 1' Save current loop in saved loop slot 1 'loop\_save "myloop"' Save current loop and name it "myloop"

  

loop\_load

'loop\_load 1' Load the saved loop from slot 1 'loop\_load "myloop"' Load saved loop named "myloop"

  

loop\_load\_prepare

'loop\_load\_prepare 1' Activate/Deactivate the saved loop in slot 1 without jumping to the start point 'loop\_load\_prepare "myloop"' Activate/Deactivate stored loop named "myloop" without jumping to the start point

  

loop\_delete

'loop\_delete 1' Delete the saved loop in slot 1

  

saved\_loop

'saved\_loop 1' Load the saved loop in slot 1 or set if it doesn't exist 'saved\_loop "myloop"' Load saved loop named "myloop" or set if it doesn't exist

  

saved\_loop\_prepare

'saved\_loop\_prepare 1' Activate/Deactivate the saved loop in slot 1 without jumping to the start point or set if it doesn't exist 'saved\_loop\_prepare "myloop"' Activate/Deactivate stored loop named "myloop" without jumping to the start point or set if it doesn't exist

  

get\_saved\_loop

get information about a saved loop: get\_saved\_loop 'pos', get\_saved\_loop 'length', get\_saved\_loop 'name'

  

saved\_loop\_display

Show information about a saved loop based on the savedLoopDisplay config option. Example: 'saved\_loop\_display 1' Can also be used to modify the savedLoopDisplay option by using +1 or -1 as parameter: 'saved\_loop\_display +1'

  

saved\_loop\_autotrigger

'saved\_loop\_autotrigger 1' Activate/Deactivate auto-trigger of loop when the play position arrives at the saved loop

  

loop\_color

query or set the color of a saved loop Query example: loop\_color 1 Set example: loop\_color 1 'yellow'

  

loop\_back

When loop back mode is enabled, starting a loop sets the end point of the loop, looping what you just heard. When disabled, starting a loop sets the start point of the loop.

  

loop\_roll\_mode

If loop roll mode is active, when the loop exits, the song continues from the position it should have been if no looping had been done

  

loop\_roll

"loop\_roll 0.25" for 1/4th beat loop roll "loop\_roll video" to toggle video loop roll on or off

  

slicer

"slicer 1" to "slicer 8" for 8 slicer buttons "slicer 1 'hold'" to hold the current position on first activate "slicer 'length' +1" to increase length "slicer 'step' +1" to increase step size "slicer video" to toggle video slicer on or off

  

repeat\_song

When active, song will restart from beginning when finished

  

loop\_adjust

use the jogwheel to adjust the loop. loop\_adjust 'move', loop\_adjust 'out', loop\_adjust 'in' activate a specific loop adjust mode loop\_adjust -1, loop\_adjust +1 emulate moving the jog when loop adjust is active

  

loop\_pad

Use 'loop\_pad 1' to 'loop\_pad 8' to trigger a loop of predefined length, depending on loop\_pad\_page and loop\_pad\_mode

  

loop\_pad\_page

Cycle through the different lengths of loops for use with loop\_pad

  

loop\_pad\_mode

Cycle through the different loop modes for use with loop\_pad. 1=On/Off 2=Hold 3=Roll

  

loop\_options

Show some options about loops

  
  

## Macro

macro\_record

Start or stop recording a macro

  

macro\_play

playback a previously recorded macro

  
  

## Pads

pad

activate the ith pad from the current pad page

  

pad\_page *(or* pad\_pages*)*

Syntax: 'pad\_page 1' to activate a the first page, 'pad\_page 1 hotcues' to override the default for a page, 'pad\_page btn1' for first button (that could be page 1 or page 5 depending on shift), 'pad\_page' to show the dropdown menu

  

pad\_page\_select *(or* pad\_page\_favorite\_select*)*

Select the pad page for this slot

  

pad\_edit

edit the current pads page

  

pad\_param

change the param 1 of the pads

  

pad\_param2

change the param 2 of the pads

  

pad\_pressure

change the pressure applied on the ith pad

  

pad\_color

return the color of the ith pad (without auto-dim)

  

pad\_button\_color

returns the color of the ith pad as should be used on a controller button (changing the color for standby/active/pressed according to the controller's RGB capability). if the pad is active and has no color, white is returned. if the pad is inactive and has a color, and the controller support full RGB pads, a dimmed color is returned. if the pad is active and has a color, and the controller doesn't support full RGB pads, the color is blinking.

  

padshift

the 'pad' action automatically change action on shift, but if you want to manually force the use of the shift action, you can use padshift instead

  

padshift\_pressure

the 'pad\_pressure' action automatically change action on shift, but if you want to manually force the use of the shift action, you can use padshift\_pressure instead

  

padshift\_button\_color

the 'pad\_button\_color' action automatically change action on shift, but if you want to manually force the use of the shift action, you can use padshift\_button\_color instead

  

pad\_pushed

returns true if the pad is pushed (useful for custom color actions not using auto-dim)

  

pad\_menu

open the menu for this pad page

  

pad\_has\_param

  

pad\_param\_visible

  

pad\_has\_action

  

pad\_has\_pressure

  

pad\_has\_color

  

pad\_has\_menu

  

pad\_has\_16pads

Returns true when a controller is connected with a 4x4 pad layout

  

pad\_bank2

Switch between showing pads 1-8 or 9-16 on skins that support it

  

padfx

Activate/deactivate named effect with a single key. Effect parameters can be specified as well. 'padfx "echo" 40% 90%' to start/stop the echo effect with first parameter at 40% and second parameter at 90%. When the effect is stopped, the parameters return to their original values. 'padfx "echo" 40% 90% smart\_pressed' smart\_pressed works as a toggle when pressing the button shortly, or as a temporary while holding the button pressed 'padfx "echo" 40% 90% "TRAIL:on"' after the sliders, it is possible to add strings to disable or enable switch parameters by defining their name, a colon and "on" to enable or "off" to disable 'padfx "echo out" 80% "solostem:vocal"' as the last parameter, you can add solostem:stemname to only let that stem be audible while applying the effect 'padfx "echo out" "mutestem:rhythm"' as the last parameter, you can add mutestem:stemname to mute that stem while applying the effect 'padfx "reverb" "stemfx:vocal"' as the last parameter, you can add stemfx:stemname to apply the effect only to that stem (other stems will continue playing normally) stem names can be Vocal,HiHat,Bass,Instru,Kick,Melody,Rhythm,MeloVocal,MeloRhythm

  

padfx\_single

Same as padfx, but turns off the previous padfx before activating the current effect

  
  

## Pitch

pitch *(or* pitch2 *or* pitch2\_slider *or* pitch\_slider*)*

Set the pitch of the deck. Without parameters it can be assigned to sliders Used with a number, it gives the position on the slider (and therefore account for pitch\_range). ('pitch 0.25' set pitch at -10% if pitch range is 20%) Used with a percent it gives an absolute position. 'pitch 112%' set pitch at +12% Relative values are possible too. 'pitch +0.1%', 'pitch +0.1 bpm' When used with 'bpm', the pitch is set to match the bpm. 'pitch 130 bpm' set pitch to match 130 bpm

  

pitch\_motorized

  

pitch\_relative

set the pitch of the deck, to be used by hardware controllers if you prefer the change to be relative to the software pitch position

  

pitch\_zero

Set pitch to 0% (normal playing speed) Use 'pitch\_zero "center"' on controllers that send a message when the pitch slider is at the center. This prevents unwanted behavior in gradual or relative mode.

  

pitch\_reset

Slowly brings the pitch back to 0%. You can specify the speed in % per second (default uses the pitchResetSpeed option): 'pitch\_reset 5%' You can also specify the speed in ms or beats: 'pitch\_reset 500ms' or 'pitch\_reset 4bt'

  

pitch\_range

set the range for the pitch slider. 'pitch\_range 12%' set the range from -12% to +12%. 'pitch\_range +1' scrolls through the default pitch ranges. 'pitch\_range "12,16,25" +1' scrolls through the provided list of pitch ranges. 'pitch\_range +1 deck' changes the pitch range only for the specific deck

  

pitch\_bend

slow down or speed up the song: 'pitch\_bend +3%'. you can make the bend to increase slowly by specifying a second time parameter: 'pitch\_bend +1% 500ms' will start at +1% and will double every 500ms.

  

master\_tempo

activate/deactivate the master tempo (to make the pitch slider change the speed of the song, but keep the original key of the song).

  

pitch\_lock *(or* pitchlock*)*

when Pitch Lock is on, moving the pitch slider on one deck will move the slider on the other deck to keep the sync

  

startupspeed

vinyl startup speed, the larger, the longer it takes for the record to get from stopped to playing

  

backspin

Do a backspin. It is possible to specify the length: 'backspin 5000ms' or 'backspin 4bt'

  

brakespeed

vinyl brake speed, the larger, the longer it takes for the record to get from playing to stopped

  

get\_pitch

Get the pitch from -100% to +100%, centered on 0%

  

get\_pitch\_value

Get the pitch from 0% to 200%, centered on 100%

  

get\_pitch\_zero

Is true if the pitch is zero, with an optional precision parameter: 'get pitch\_zero 5%' (the % is relative to the pitch range. Use "get pitch\_zero 'absolute' 0.1%" to use absolute precision)

  
  

## Plugins

effect\_select\_multi

effect\_select\_multi 2 "echo" -> select effect echo in slot 2 effect\_select\_multi 1 -1 -> select previous effect in slot 1 effect\_select\_multi +1 -> select next effect in slot 1 effect\_select\_multi -> show popup window for slot 1 effect\_select\_multi 1 -> show popup window for slot 1 effect\_select\_multi 1 0.2 -> select the 2/10th effect from the list in slot 1 effect\_select\_multi "video" -> select effect in the video effect slot effect\_select\_multi does not deactivate the previous plugin in the specified slot

  

effect\_select

effect\_select 2 "echo" -> select effect echo in slot 2 effect\_select 1 -1 -> select previous effect in slot 1 effect\_select +1 -> select next effect in slot 1 effect\_select -> show popup window for slot 1 effect\_select 1 -> show popup window for slot 1 effect\_select 1 0.2 -> select the 2/10th effect from the list in slot 1 effect\_select "audioonlyvisualisation" -> select visualisation used when song has no video effect\_select deactivates the previous plugin in the specified slot

  

effect\_select\_toggle

Same as effect\_select, but will turn on the new effect if the previous effect was on

  

effect\_select\_popup

Same as effect\_select, but shows the selection drop-down temporarily for easier selection

  

effect\_active *(or* effect\_activate*)*

activate/deactivate the effect on a specific slot. example: effect\_active 1 'flanger' on or effect\_active 1

  

effect\_disable\_all

'deck 1 effect\_disable\_all' Disables all effects on deck 1 'deck master effect\_disable\_all' Disables all master effects 'effect\_disable\_all sampler' Disables all sampler effects. 'aux' or 'mic' can be used for mic or aux effects

  

effect\_slider *(or* effect\_slider\_slider*)*

Move the n-th slider on the given effect "effect\_slider 1 2 50%" : Set slider id 2 on slot 1 to 50% "effect\_slider 1 0%" : set slider id 1 on slot 1 to 0%

  

effect\_slider\_skip\_length

Move the n-th slider on the given effect, excluding a length slider if present "effect\_slider\_skip\_length 1 2 50%" : Set slider 2 (excluding length) on slot 1 to 50% "effect\_slider\_skip\_length 1 0%" : set slider 1 (excluding length) on slot 1 to 0%

  

effect\_slider\_active *(or* effect\_slider\_activate*)*

move a slider and activate the effect as long as the mouse is down

  

effect\_has\_slider

effect\_has\_slider 1 2 on -> returns true if there is a second slider on slot 1 effect\_has\_slider 1 -> returns true if there is a first slider on slot 0

  

effect\_slider\_reset

return this plugin slider to its default value

  

effect\_colorfx

'effect\_colorfx 1 "echo"' to use echo on custom color fx slot 1 (up to 4 custom slots available)

  

effect\_colorslider

Control the effect from center position off, to full on either left or right

  

effect\_releaseslider

Control the effect release specific slider

  

effect\_releaseslider\_active

Control the effect release specific slider and auto activate the effect

  

effect\_button

'effect\_button 1 2' button 2 on slot 1 'effect\_button 2' button 2 on slot 1

  

effect\_has\_button

'effect\_has\_slider 1 2 on' -> returns true if there is a second button on slot 1

  

video\_source

activate video if not active yet, and open the shader selection dialog if shader is the source

  

video\_source\_select

select the plugin used for video source. you can specify by name ('video\_source\_select "webcam"'), relative ('video\_source\_select +1') or without parameters to open a popup window listing the available plugins

  

video\_transition\_select

select the plugin used for video transitions. you can specify by name ('video\_transition\_select "my\_plugin"'), relative ('video\_transition\_select +1') or without parameters to open a popup window listing the available plugins

  

video\_transition\_slider *(or* video\_transition\_slider\_slider*)*

move the n-th slider of the video transition plugin

  

video\_transition\_button

push the n-th button of the video transition plugin

  

video\_fx\_select

select a video effect plugin. you can specify by name ('video\_fx\_select "my\_plugin"'), relative ('video\_fx\_select +1') or without parameters to open a popup window listing the available plugins

  

video\_fx\_clear

deactivate all the active video effects

  

video\_fx

activate/deactivate the selected video effect

  

get\_video\_fx\_slider\_label

get the text to display under this slider control

  

video\_fx\_slider *(or* video\_fx\_slider\_slider*)*

move the n-th slider of the video effect plugin

  

video\_fx\_button

push the n-th button of the video effect plugin

  

effects\_used

Active when there are any effects activated. Use "effects\_used 'deck'" to get the effects on the selected deck, or "effects\_used 'master'" to get effects activated on master.

  

get\_effects\_used

Returns the number of effects currently active

  

get\_effect\_name

get the name of the currently selected effect

  

get\_effect\_title

get the title of the currently selected effect

  

get\_effect\_string *(or* effect\_string*)*

get the text displayed by this effect. Some effects allow setting text as well

  

get\_effect\_string\_name

get the label to display for this effect

  

get\_effect\_button\_name

get the name of the xth button of the currently selected effect

  

get\_effect\_button\_shortname

get the short name of the xth button of the currently selected effect

  

get\_effect\_button\_count

get the number of buttons on this effect

  

get\_effect\_slider\_count

get the number of slider on this effect

  

get\_effect\_slider\_name

get the name of the xth slider of the currently selected effect

  

get\_effect\_slider\_shortname

get the shortname to display under this slider control

  

get\_effect\_slider\_label

get the label to display under this slider control

  

get\_effect\_slider\_label\_full

get the label to display under this slider control

  

get\_effect\_slider\_text

get the full text associated with this slider control

  

get\_effect\_slider\_default

returns the default value for this slider

  

get\_videofx\_name

get the name of the currently selected video effect

  

get\_videotrans\_name

get the name of the currently selected video transition

  

effect\_show\_gui

show the control window for this effect

  

effect\_dock\_gui

dock/undock this effect's control window

  

pluginsongpos

  

show\_pluginpage

show or hide the plugin control windows in the browser area

  

effect\_command

send a command to this effect

  

effect\_beats

set the beat parameter for certain effects

  

effect\_beats\_all

set the beat parameter for 1, 3 or 6 slots depending on skin6FxLayout and skin3FxLayout settings

  

effect\_has\_beats

  

effect\_has\_length

  

is\_releasefx

query if this effect is in the release effect slot

  

effect\_3slots\_layout

Change between the 1-slot and 3-slots layout for effects

  

effect\_clone

Load into this deck all 3 slots from the current left or right deck

  

effect\_mixfx

Associate an effect with the crossfader

  

effect\_mixfx\_activate

Toggle mix fx on or off. Use effect\_mixfx\_select to select

  

effect\_mixfx\_select

Select the mix fx when moving the crossfader

  

effect\_bank\_save

save the effects in deck fx slots 1 to 6 to the bank specified by the parameter

  

effect\_bank\_load

load the effects in deck fx slots 1 to 6 from the bank specified by the parameter

  

get\_nb\_multicam

  

effect\_stems\_color

Get the color for the effect\_stems button

  

effect\_stems

Apply effects only to the selected stems. 'effect\_stems vocal on' Stems are Vocal,HiHat,Bass,Instru,Kick,Melody,Rhythm,MeloVocal or MeloRhythm

  

effect\_arm\_stem

Select/unselect a stem to be used with "stems" as slot for effect\_ actions Accepted stem names are Vocal, HiHat, Bass, Instru, Kick. They can be combined using "+"

  

effect\_arm\_deck

For controllers with a deck selection switch for effects, select the deck effects will be activated on using effect\_arm\_active Use 'effect\_arm\_deck single' to allow only one deck at a time to be armed Use 'effect\_arm\_deck master' to select master instead of a deck. 'sampler', 'mic', and 'aux' also supported

  

effect\_arm\_select

For controllers with a effect selection switch, select the effect that will be activated using effect\_arm\_active

  

effect\_arm\_slot

Toggle if a slot will be activated by using effect\_arm\_active

  

effect\_arm\_active

Activate the effect selected using effect\_arm\_select on the deck selected using effect\_arm\_deck

  

effect\_arm\_slider

Move the effect parameter of the effect selected using effect\_arm\_select on the deck selected using effect\_arm\_deck Use "effect\_arm\_slider 1 2" to move the second slider of the first slot

  

effect\_arm\_slider\_name

Get the effect parameter name of the effect selected using effect\_arm\_select on the deck selected using effect\_arm\_deck. Use 'effect\_arm\_slider\_name 1 short' to get the short label

  

effect\_arm\_slider\_text

Get the effect parameter text of the effect selected using effect\_arm\_select on the deck selected using effect\_arm\_deck.

  

effect\_arm\_slider\_label

Get the effect parameter label of the effect selected using effect\_arm\_select on the deck selected using effect\_arm\_deck. Use 'effect\_arm\_slider\_label 1 short' to get the short label

  

effect\_arm\_beats

Change the speed of the effect selected using effect\_arm\_select on the deck selected using effect\_arm\_deck

  

effect\_arm\_bpm

Get the bpm of the deck selected using effect\_arm\_deck

  
  

## Poi

beat\_tap

tap on a few beats to set a new bpm for the song if the application didn't got it right on the first time.

  

edit\_poi

open the POI Editor to edit the cue points, and other points of interest

  

edit\_bpm

open the BPM Editor to edit the bpm and beat grid

  

adjust\_cbg

adjust the beat grid. 'adjust\_cbg +2' moves the start bar from 4:4. 'adjust\_cbg +10%' moves the actual bars.

  

set\_bpm

set the bpm of the song to the set value: 'set\_bpm 129.3', or relative to the actual value: 'set\_bpm 50%'.

  

goto\_mixpoint

Jump to the specified mix point ("StartTempo", "EndTempo", "StartCut", "EndCut", "StartFade", "EndFade", "StartSound", "EndSound") Example: goto\_mixpoint "StartCut"

  

set\_mixpoint

Move the specified mix point to the current position ("StartTempo", "EndTempo", "StartCut", "EndCut", "StartFade", "EndFade", "StartSound", "EndSound") Example: set\_mixpoint "StartTempo"

  

set\_loadpoint

Set the point where the track will start when loaded

  

set\_firstbeat

moves the first beat to the current position, adjusting the beat-grid

  

reanalyze

reanalyze bpm etc... for the file loaded on the deck 'reanalyze multi' can be used to scan for multiple bpm's

  
  

## Prelisten

prelisten *(or* preview*)*

Pre-listen the selected track

  

prelisten\_output

Set this deck to be used for the prelisten player Example: "deck 1 prelisten\_output", or to put it back to default: "prelisten\_output 'auto'"

  

prelisten\_options

Show a context menu with the prelisten player options

  

prelisten\_pos

move the position of the prelisten player

  

prelisten\_stop

Stop the prelisten player

  
  

## Record

record

start recording the session.

  

record\_cut

cut the current recording to a new file (or new track if recording to CD)

  

record\_config

open the record configuration panel

  

record\_vu

show the volume of what's being recorded

  

broadcast

start or stop to broadcast Optionally add parameter to specify "video", "direct", "server" or "podcast". Without parameters it will use the last used mode.

  

broadcast\_message

set or get the broadcast message.

  
  

## Sampler

sampler\_play

play the selected sample. syntax 'sampler\_play' plays the default sample. 'sampler\_play 4' plays the fourth sample.

  

sampler\_play\_stutter

play the selected sample. if already playing, restart from begining.

  

sampler\_play\_stop

play the selected sample if it's not already playing, or stop it if it's already playing.

  

sampler\_stop

stop the selected sample. syntax 'sampler\_stop' stops the default sample. 'sampler\_stop 4' stops the fourth sampler slot. 'sampler\_stop all' stops all samples.

  

sampler\_pad

'sampler\_pad 1' triggers the sample in slot 1, based on the play mode for that sample slot

  

sampler\_pad\_shift

'sampler\_pad\_shift 1' stop sample when playing, delete sample otherwise

  

sampler\_pad\_page

show next page of samples if the bank has more than 8 samples

  

sampler\_assign

'sampler\_assign 1 "path to vdjsample"' adds the sample to sample slot 1. (For use in drag&drop in pad page)

  

sampler\_loaded

'sampler\_loaded 1' returns true when there is a sample loaded in slot 1, otherwise returns false

  

sampler\_color

get the color of the sample on this slot if it has one The sample number takes the sampler\_pad\_page into account, so should be used in combination with sampler\_pad

  

sampler\_select *(or* sampler\_default*)*

select which sample is the default sampler slot for that deck. syntax 'sampler select 5' selects the fifth sampler slot. 'sampler select +1' scrolls through the sampler slots. 'sampler select' open a popup menu to select the new default sampler slot.

  

sampler\_position

get the current position of the sample

  

sampler\_bank

Select a new sampler bank. Can be called either by name (sampler\_bank "birthday"), by number (sampler\_bank 2) or can be assigned to a rotary knob (sampler\_bank) or buttons (sampler\_bank +1)

  

sampler\_mute

mute/unmute this sample

  

sampler\_edit

edit the given sample in the SampleEditor

  

sampler\_mode *(or* sampler\_rapidfire*)*

set the global trigger mode for the sampler: "sampler\_mode 'on/off'", 'hold', 'stutter' or 'unmute' set trigger mode for a specific sample: "sampler\_mode 1 'on/off'" to set sample 1 mode or "sampler\_mode 1 +1" to cycle

  

sampler\_output

Select sampler output channel. 'deck master sampler\_output', 'sampler\_output "headphones"', 'deck 1 sampler\_output', 'sampler\_output "popup"'

  

sampler\_options

popup the sample menu. can also be used with 'sampler\_options "locked"' or 'sampler\_options "stemswap"' to change the bank's settings.

  

sampler\_volume\_master

'sampler\_volume\_master' sets the master volume of the sampler

  

sampler\_pfl

Select if the sampler is sent to the headphones. (can be used with a slider or a % to specify the volume: 'sampler\_pfl 75%')

  

sampler\_volume

'sampler\_volume' sets the volume of the sample that has the focus, on the selected deck. 'sampler\_volume 1' sets the volume of the sample in slot 1 in the current bank. 'sampler\_volume "siren"' sets the volume of the sample 'siren.vdjsample'.

  

sampler\_velocity

  

sampler\_volume\_nogroup

sets the volume of the sample without changing the volume of other samples in the same group

  

sampler\_group\_volume

change the volume of all the samples in the give group. You can specify the group by name, or by group index

  

sampler\_group\_color

get the color of a sampler group

  

sampler\_group\_name

get the name of a sampler group

  

sampler\_group\_mute

mute/unmute a sample group. You can specify the group by name, or by group index

  

sampler\_has\_group

returns true if the specified group (specified by name or by index) exists in the current samplebank

  

scratchbank\_edit

  

scratchbank\_load

  

scratchbank\_assign

  

scratchbank\_load\_to\_deck

  

scratchbank\_unload *(or* sampler\_unload\_from\_deck*)*

Unload the song previously loaded using scratchbank\_load\_to\_deck from deck and load back the last song

  

sampler\_load\_to\_deck

Load the sample from the selected slot to the deck

  

sampler\_rec

On first press, start to record a new sample. On second press, stop to record Use 'sampler\_rec "mic"' to record a sample from microphone, or 'sampler\_rec "master"' to record from master output If the deck is on loop, a loop sample will immediately be created. If the deck is playing, it will record what's playing until the stop. If the deck is paused, it sets the 'entry point', and the second push will set the 'exit point' and use the deck's file between those two points. 'sampler\_rec 1' or 'sampler\_rec 1 "mic"' will store the sample in the first slot of the "Record" sample bank, so that it can be used immediately after recording

  

sampler\_start\_rec

start to record (from the deck, or from mic or master if specified) in order to create a new sample file

  

sampler\_stop\_rec

stop the recording and save the result in a sample file

  

sampler\_abort\_rec

cancel the recording and delete the sample file

  

sampler\_rec\_delete

delete a recording from the "Recordings" bank "sampler\_rec\_delete 3" would delete the sample previously recorded using "sampler\_rec 3"

  

sampler\_loop

use 'sampler\_loop -1' or 'sampler\_loop +1' to change the length of a playing sample use 'sampler\_loop "current" 1' to set the sample to loop for 1 beat or 'sampler\_loop 1 1' to set sample 1 to 1 beat loop use 'sampler\_loop "current" 0.5 "play" while\_pressed' to loop the sample as long as long as the button is pressed for 0.5 beats

  

sampler\_used *(or* get\_sampler\_used*)*

check if a sample is playing (or if used with 'sampler\_used 4' check if exactly 4 samples are playing)

  

get\_sampler\_slot

get the number of the sampler slot that currently has the focus

  

get\_sampler\_count

get the number of slots in the current sampler bank

  

get\_sample\_name *(or* get\_sample\_slot\_name*)*

get the name of the specified sample

  

get\_sample\_info

get additional information about the sample, such as 'get\_sample\_info 1 fullpath' In addition to the regular column names, 'group' is also supported, and 'length' returns beat values for loops

  

get\_sampler\_bank

get the name of the currently loaded sampler bank

  

get\_sampler\_bank\_id

get the number of the currently loaded sampler bank

  

get\_sampler\_bank\_count

get the number of sample banks

  

get\_sample\_color

get the color for the specified sample (with auto-dim)

  
  

## Sandbox

sandbox

activate/deactivate sandbox mode. in sandbox mode, the master output continues to play what it was playing without being affected by your actions, and you can move both decks to whatever position you want, in order to prelisten your upcomming mix.

  

can\_sandbox

returns true if virtualdj can be sandboxed. sandbox cannot be activated while you have effects or samples active, or video, or if you're scratching, or if you have more than one deck playing with the volume up.

  
  

## Sync

sync

smoothly synchronize the song with the other deck.

  

is\_sync

on when tracks are synchronized (bpm and phase while playing, bpm when not playing)

  

match\_bpm

set the pitch to match the BPM of the other deck.

  

match\_gain

set the gain to match the other deck.

  

play\_sync

play the song instantly synchronized with the other deck.

  

play\_onbeat

instantly synchronize the song with the other deck, using local beat information instead of the global beatgrid, but don't change the pitch.

  

play\_sync\_onbeat *(or* sync\_nocbg*)*

instantly synchronize the song with the other deck, using local beat information instead of the global beatgrid.

  

beatlock

When beatlock is activated, the songs are kept synchronized, even when moving the pitch, scratching, etc...

  

smart\_fader

When smart fader is activated, songs are synchronized while using the crossfader, and the tempo moves toward the tempo of the song that is being faded into

  

auto\_bpm\_transition

When pressed, the bpm of the song is gradually moved to the bpm of the other deck while keeping both songs at the same bpm When smartPlay or autoBPMMatch are on, it will move to the bpm of the other deck at normal speed When using parameter 'source\_original', 'target\_original' or 'target\_current' you can force which bpm it will transition to

  

auto\_bpm\_transition\_options

Enable/Disable certain features of the auto\_bpm\_transition. First parameter can be 'length', 'loop', 'stems', 'master\_tempo', 'autostart' When selecting stems to disable, use 'auto\_bpm\_transition\_options stems vocal' for example

  

get\_bpm\_match

Returns 0.5 when bpm's are synchronized

  

auto\_sync\_settings

Set some pre-defined values for the main automatic sync settings (auto match bpm, auto match key, auto sync, auto pitch lock) depending on the skin category

  

sync\_hint

sync\_hint 'pitch' returns true if the pitch should be matched. Then sync\_hint 'phase' returns true if the phase should be synced

  

phrase\_sync

shift by a number of beat to match the phrase of the other deck (default 4:4, but can specify 'phrase\_sync 16' for example)

  

quantize\_all

Set all quantize options

  
  

## Text

get\_text

get some text. You can use the inverted apostrophe to query VDJScript results within the text: "get text 'You are listening to \`get loaded\_song "title"\` at \`volume\` volume.".\\nVDJScript returning booleans (buttons) will be displayed as "on" or "off".\\nVDJScript returning values (sliders) will be displayed as a percentage.\\n(you can also (but it's being deprecated in VDJ7) use % shortcuts for some common queries: "get text 'you are listening to %title by %author'")

  

get\_status

get information about background tasks

  

stopwatch

  

stopwatch\_reset

  

countdown

Count down to a specific date or time. Example: countdown '2025/01/01 00:00' Second parameter can be used to optionally format the return value. Use %full, %HH, %MM, %SS, %DD

  
  

## Timecode

timecode\_active

Select if the deck is controlled by a timecode signal. (note: You can use 'timecode\_active x' where x is the turntable number, to assign the same turntable to control several decks at once: 'deck 1 timecode\_active 1 on & deck 2 timecode\_active 1 on')

  

invert\_timecode

Invert timecode control (for 1 timecode source, switch it through available decks, for 2 timecode sources, from 1 to 3, 2 to 4)

  

timecode\_mode

Set the timecode mode: 'smart', 'absolute', 'relative'.

  

timecode\_config

Open the timecode config window

  

timecode\_bypass

Use the timecode turntable as linein input

  

timecode\_reset\_pitch

Reset the "software" pitch to 100%, so that the deck pitch matches the turntable pitch exactly, and needle-drop is truly absolute

  

timecode\_pitch

For controllers that send the pitch through midi, let the timecode engine know the pitch slider's position

  

get\_hastimecode

returns true if the current soundconfig includes some timecode inputs

  

get\_timecode\_quality

  

timecode\_cd\_mode

Force timecode to CD mode (use when using a vinyl timecode on a cd or other digital device)

  

timecode\_motor\_enable

Hybrid turntables that send midi messages to indicate if motor is enabled can use this

  

timecode\_options

Show some timecode options

  
  

## Video

leftvideo

assign this deck to the left of the video crossfader: "deck 3 leftvideo" or "leftvideo +1" or "leftvideo 'auto'".

  

rightvideo

assign this deck to the right of the video crossfader: "deck 3 rightvideo" or "rightvideo +1" or "rightvideo 'auto'".

  

leftvideo\_button

simple button to control the left video source: "deck 3 leftvideo\_button".

  

rightvideo\_button

simple button to control the right video source: "deck 3 rightvideo\_button".

  

is\_video

return true if this deck has some video

  

is\_audioonlyvisualisation

return true if this deck has the audio only visualisation running on it

  

has\_video\_mix

return true if video output is using transition and video-crossfader with one or more video sources, false if it's playing audio-only and using a source plugin

  

over\_video *(or* overvideo*)*

force this deck's video output on the video master

  

video\_crossfader\_link

link or unlink the video crossfader to the audio crossfader

  

video\_crossfader\_auto

move the video crossfader automatically according to which side is playing, cueing, scratching, etc...

  

video

open or close the video window

  

video\_output

Show menu to select on which monitor to open the video output. You can also specify a specific output: "video\_output 1" to open video output on the first monitor To just show or hide the output use "video\_output on" or "video\_output off". To toggle output, use "video\_output ? video\_output off : video\_output on"

  

video\_crossfader

set the video crossfader

  

video\_fadetoblack

activate/deactivate fade-to-black on volume sliders

  

video\_transition

Launch a transition from one video deck to the other. You can specify the duration of the transition: 'video\_transition 1000ms' You can specify the direction of the transition: 'video\_transition "left"' or 'video\_transition "left" 1000ms' You can specify the location to transition to using a percentage (or assign it to a slider): 'video\_transition 50%' or 'video\_transition 1000ms 50%'

  

video\_delay

set a delay between video or audio to synchronize output (in milliseconds) Use "video\_delay +100ms" or "video\_delay -100ms" to increase or decrease the delay, or "video\_delay 0ms" to reset it Use "video\_delay +100" or "video\_delay -100" to set it to exactly the specified amount

  

video\_level

fade-to-black independent slider for the left or right video deck