---
title: "VirtualDJ - VDJPedia - VDJScript Examples"
source: "https://www.virtualdj.com/wiki/VDJScript%20Examples.html"
author:
  - "[[VirtualDJ Website]]"
published:
created: 2025-02-18
description: "With over 100,000,000 downloads, VirtualDJ packs the most advanced DJ technology. Both perfect to start DJing, and perfect for advanced pro DJs."
tags:
  - "clippings"
---
[Back to VDJScript](https://www.virtualdj.com/wiki/VDJ8script.html)

  
  
**VirtualDJ Script Examples**

---

---

---

  

  
- [RGB LEDs](https://www.virtualdj.com/wiki/rgbleds.html)
- [Assign different actions for the same button or knob on each side of a dual-deck controller](https://www.virtualdj.com/wiki/assigndifferentactionsforthesamebuttonorknoboneachsideofadualdeckcontroller.html)
- [Use a combination of buttons to trigger two different actions](https://www.virtualdj.com/wiki/useacombinationofbuttonstotriggertwodifferentactions.html)

  
  

**Flow**

  
  
  
**Execute different action on click and different on double-click** (for controllers)  
```
var 'double' ? set 'double' 0 & repeat_stop 'myrep' & device_side 'left' ? deck left clone_deck right : deck right clone_deck left : set 'double' 1 & repeat_start 'myrep' 400ms 1 & load & set 'double' 0
```
  
The script uses a timer and waits for 400ms to see if a second click (push) comes.  
If not it loads the track on deck, if Yes, it clones the deck to the opposite side.

  
*Script added from Djdad*  
\*Edit\* This script has now been simplified with the action/query 'doubleclick ? '  
```
doubleclick ? device_side 'left' ? deck left clone_deck right : deck right clone_deck left : load
```
  
  
  

**Automix**

  
  
  
**Automix doesn't 0 pitch onload** (custom button)  
```
var_equal "AMpWA" 0 ? off & set "AMpWA" 1 & repeat_start_instant "AMpitcher" 33ms & load_pulse ? repeat_start_instant "pitchRem" 1000ms 1 & pitch & param_cast & set "AMpitch" : get_var "AMpitch" & param_cast & pitch : blink & set "AMpWA" 0 & repeat_stop "AMpitcher"
```
  
Explained [**Here**](http://www.virtualdj.com/forums/201088/General_Discussion/Automix_Compared_to_VDJ7_and_VDJ8.html?search=jiver&page=1)  
*Script added from [Locodog](http://www.virtualdj.com/homepage/locodog/index.html)*  
  
  

**Browsing**

  
  
**Button to collapse all folders** (for controllers or keyboard)  
```
repeat_stop 'rsi_CollapseFolders' & browser_window 'folders' & browser_scroll 'bottom' & param_equal get_browsed_folder_tab 0 ? set '$BRPreviousLevel' 0 & repeat_start_instant 'rsi_CollapseFolders' 50ms & browser_window 'folders' & browser_scroll -1 & param_equal get_browsed_folder_tab 0 ? var_equal '$BRPreviousLevel' 0 ? browser_scroll 'top' ? repeat_stop 'rsi_CollapseFolders' : nothing : browser_folder & set '$BRPreviousLevel' 0 & browser_scroll 'top' ? repeat_stop 'rsi_CollapseFolders' : nothing : get_browsed_folder_tab & set '$BRPreviousLevel' & browser_scroll 'top' ? repeat_stop 'rsi_CollapseFolders' : nothing : set '$BRPreviousLevel' 1 & repeat_start_instant 'rsi_CollapseFolders' 50ms & browser_window 'folders' & browser_scroll -1 & param_equal get_browsed_folder_tab 0 ? var_equal '$BRPreviousLevel' 0 ? browser_scroll 'top' ? repeat_stop 'rsi_CollapseFolders' : nothing : browser_folder & set '$BRPreviousLevel' 0 & browser_scroll 'top' ? repeat_stop 'rsi_CollapseFolders' : nothing : get_browsed_folder_tab & set '$BRPreviousLevel' & browser_scroll 'top' ? repeat_stop 'rsi_CollapseFolders' : nothing
```
  
*Script added from PachN*  
*Scripted by [PhantomDeejay](https://virtualdj.com/user/PhantomDeejay/index.html)*  
*Source: [here](https://virtualdj.com/forums/223164/VirtualDJ_8_2_Technical_Support/collapse_all_subfolders_and_return_to_my_main_folder.html)*  
  
  
**Button or key to change the browser view settings quickly to show just karaoke , or simple music files** (for controllers or keyboard)  
Show karaoke
```
 view_options "showkaraoke" on & view_options "showmusic" off & view_options "showvideo" off 
```
  
Show music
```
 view_options "showmusic" on & view_options "showkaraoke" off & view_options "showvideo" off 
```
  
Can be easily adapted for video  
*Script added from bigron1*  
  
  
**Browse tracks with jogwheel/touchwheel when deck is empty**  
Touchwheel (*Jog*)  
```
loaded ? touchwheel : browser_window 'songs' & var $shift ? touchwheel_touch ? param_multiply 100 & browser_scroll : param_multiply 50 & browser_scroll : touchwheel_touch ? param_bigger 0.02 ? param_multiply 8 & browser_scroll : param_smaller -0.02 ? param_multiply 8 & browser_scroll : param_bigger 0 ? browser_scroll +1 : browser_scroll -1 : cycle $b 5 & var_equal $b 4 ? param_bigger 0 ? browser_scroll +1 : browser_scroll -1 : nothing
```
This script enables you to browse your tracks with your **jogwheel** when there is no track loaded on the wheel's deck.  
It does **NOT** change your wheel\_mode, it will only (but also always) browse, when the deck is completely empty.  
The idea with *param\_bigger 0 ? browser\_scroll +1 : browser\_scroll -1* is not from me, but i can't find the original post. However this is a much more improved version, as it makes the unusable state of the wheel with an empty deck useful with a lot of tweaking to create a good browsing performance.  
It uses not only the shift variable to speed up - it also changes speeds depending on whether you have pressed your touchwheel or not.  
If you want to use the shift 'feature', you need to have
```
 set $shift 1 while_pressed 
```
somewhere on your shift key.  
  
**To customize this script and learn about it's structure, click this link for the document (because it's too long for this post): *[vdjscript Document](https://docs.google.com/document/d/1cosIrvJuofxFoL7wpV0-NvPaEPVx24fF-yNIfGpyXyc/)***  
*Script added from [unlimited](http://www.virtualdj.com/homepage/unIimited/index.html)*  
  
  
**Auto-Deck-Load System \[ADL\]**  
You can put this script on any button.  
It will automaticly load the next track in your playlist onto the other deck and delete it from the list when the currently running track has less than 30 seconds left.  
It's a mix of automix and manual mixing, so you can make the transitions yourself but have the tracks loaded automaticly for you.  
If you put this on a button where you **can't** individually control the LED (e.g. custom buttons), you should set up another LED (or custom button) with this script:  
```
var $ADL ? on : off
```
to know if the ADL-System is running or not, because the on-off script returns the **wrong LED information**!  
```
set $ADL_left 0 & set $ADL_right 0 & var $ADL ? repeat_stop 'AutoDeckLoad' & set $ADL 0 : repeat_start_instant 'AutoDeckLoad' 500ms & set $ADL 1 & deck left select ? & deck left songpos_remain 30000ms ? var_equal $ADL_right 0 ? deck right playlist_load_and_remove & set $ADL_right 1 & set $ADL_left 0 & deck right select : nothing : nothing : deck right select ? deck right songpos_remain 30000ms ? var_equal $ADL_left 0 ? deck left playlist_load_and_remove & deck left select & set $ADL_right 0 & set $ADL_left
```
  
*Script added from [unlimited](http://www.virtualdj.com/homepage/unIimited/index.html)*  
  
  
**Load or Clone**  
(One Button per deck)  
```
action_deck 1 ? param_equal '\`deck 2 get_filepath\`' '\`get_browsed_filepath\`' ? deck 2 clone_deck 1 : deck 1 load : param_equal '\`deck 1 get_filepath\`' '\`get_browsed_filepath\`' ? deck 1 clone_deck 2 : deck 1 load
```
  
(One Button for all decks, follows master)  
```
deck 1 masterdeck ? param_equal '\`deck 1 get_filepath\`' '\`get_browsed_filepath\`' ? deck 1 clone_deck 2 : deck 2 load : param_equal '\`deck 2 get_filepath\`' '\`get_browsed_filepath\`' ? deck 2 clone_deck 1 : deck 1 load
```
  
*Script added from [Locodog](http://www.virtualdj.com/homepage/locodog/index.html)*  
  
  
**Skipping through browser windows back and forth**  
(for controller and keyboard)  
For changing browser windows by using two buttons/keys (Right/Left). This makes it possible to change directions in any browser window:  
**Right:**
```
browser_window 'folders' ? browser_window 'songs' : browser_window 'songs' ? browser_window 'sidelist' : browser_window 'sidelist' ? browser_window 'sideview' : browser_window 'folders' 
```
  
**Left:**
```
 browser_window 'folders' ? browser_window 'sidelist' : browser_window 'sideview' ? browser_window 'sideview' : browser_window 'sidelist' ? browser_window 'songs' : browser_window 'folders'
```
  
*Script added from zehkah*  
  
  
**djdad's autocolor script 2 times reworked**  
Assign the script below to a custom button. Select a folder. Press the custom button.  
It will automatically color all the tracks inside that folder and will automatically stop at the last one. You can press the same button again to stop the process at any time.  
  
```
repeat_start 'colorTracks' ? on & repeat_stop 'colorTracks' : off & browser_window "songs" & browser_scroll "top" & repeat_start 'colorTracks' 100ms & ( get_browsed_song 'harmonic' & param_cast 'text' & 
param_equal '01A' ? browsed_song color '#70ECD4' : 
param_equal '01B' ? browsed_song color '#00EDC9' : 
param_equal '02A' ? browsed_song color '#92F0A4' : 
param_equal '02B' ? browsed_song color '#27EC82' : 
param_equal '03A' ? browsed_song color '#B1EE86' : 
param_equal '03B' ? browsed_song color '#85ED4E' : 
param_equal '04A' ? browsed_song color '#E6E0A2' : 
param_equal '04B' ? browsed_song color '#E0C86E' : 
param_equal '05A' ? browsed_song color '#FEC8AC' : 
param_equal '05B' ? browsed_song color '#FFA279' : 
param_equal '06A' ? browsed_song color '#FFB3BF' : 
param_equal '06B' ? browsed_song color '#FF8C93' : 
param_equal '07A' ? browsed_song color '#FFB4D2' : 
param_equal '07B' ? browsed_song color '#FF85B4' : 
param_equal '08A' ? browsed_song color '#EBB7F9' : 
param_equal '08B' ? browsed_song color '#F087D9' : 
param_equal '09A' ? browsed_song color '#E7B6F8' : 
param_equal '09B' ? browsed_song color '#CE93FF' : 
param_equal '10A' ? browsed_song color '#C0CEFB' : 
param_equal '10B' ? browsed_song color '#A1B9FF' : 
param_equal '11A' ? browsed_song color '#94E5F8' : 
param_equal '11B' ? browsed_song color '#3ED2F8' : 
param_equal '12A' ? browsed_song color '#50EBF0' : 
param_equal '12B' ? browsed_song color '#01EDED' :  )
& browser_scroll 'bottom' ? repeat_stop 'colorTracks' : browser_scroll +1
```
  
*Script added from [Locodog](http://www.virtualdj.com/homepage/locodog/index.html)*  
*Script originally from djdad*  
  
  

**Crossfader**

  
  
  
**Change crossfader curve between smooth and scratch with single button or key**  
```
crossfader_curve smooth ? crossfader_curve scratch : crossfader_curve smooth
```
  
This was requested by a user on the facebook page.  
It checks to see if the current mode of crossfader\_curve is smooth.  
If true, it sets crossfader\_curve to scratch, otherwise it sets it to smooth.  
*Script added from a1kryten*  
  
  

**FX**

  
  
  
**Switch between pre and post fx** (Custom Button)  
```
setting "fxProcessing" "Post-fader" ? on & setting "fxProcessing" : off & setting "fxProcessing"
```
  
*Script added from [Locodog](http://www.virtualdj.com/homepage/locodog/index.html)*  
  
  
**Drop gain & turn flanger On, Reset gain & turn flanger OFF** (Button)  
```
effect_active 'flanger' ? effect_active 'flanger' & get_var "resetGain" & param_cast & gain : set "resetGain" '\`gain' & effect_active 'flanger' & gain -15%
```
  
This script keeps the output level at a similar level when using a FX that can increase the level.  
This bit saves the current gain as a variable.  
```
set "resetGain" '\`gain'
```
  
This bit gets the variable and uses it to set the gain.  
```
get_var "resetGain" & param_cast & gain
```
  
*Script added from [Locodog](http://www.virtualdj.com/homepage/locodog/index.html)*  
  
  
**Halve the pitch, double the pitch** (Button)  
```
toggle "1/2pitch" & var "1/2pitch" ? pitch & param_multiply 50% & pitch : pitch & param_multiply 200% & pitch
```
  
*Script added from [Locodog](http://www.virtualdj.com/homepage/locodog/index.html)*  
  
  
**Combined dial with different scales, with correct centring** dial  
user wanted to have 1 dial control both eq\_low & eq\_mid at once but also wanted mid to be 1/2 as sensitive and also wanted the eqs centred when the dial was centred  
```
deck 1 eq_low & deck 1 eq_mid & param_multiply 0.5 & param_add 0.25 & deck 1 eq_high
```
  
multiplies the calling slider by 0.5, but then to have eq high centred when the dial is centred add 0.25  
maths for other scales to be centred  
  
(constant 1 - scaling factor ) / 2 = correction  
multiply by your scale, and add the correction.  
*Script added from [Locodog](http://www.virtualdj.com/homepage/locodog/index.html)*  
  
  
**Slipped Backspin with gain correction** (Button)  
```
set 'rsGainBS' '\`gain' & gain -20% & slip on & effect_active 'backspin' & repeat_start_instant 'rsiBackSpin' 10ms & effect_active 'backspin' 1 ? nothing : repeat_stop 'rsiBackSpin' & play & slip off & get_var 'rsGainBS' & param_cast & gain
```
  
This script is a single button press, the current gain is saved, the gain is dropped, backspin FX is initiated, a repeat\_start script continually checks the FX, when the FX is finished the gain is put back to normal and the track continues from the point where it would have been if the backspin never happened.  
*Script added from [Locodog](http://www.virtualdj.com/homepage/locodog/index.html)*  
  
  
**Load 5 effects on each deck** (Button)  
```
deck 1 level 75% & deck 1 effect_select 1 'EQ 10 Bands' & deck 1 effect_active 1 'EQ 10 Bands' on & deck 1 effect_button 'EQ 10 Bands' 1 & deck 1 effect_slider 'echo' 1 0 & deck 1 effect_select 5 'flanger' & deck 1 filter 0.5 & deck 1 effect_select 2 'Djos Special Flanger' & deck 1 effect_select 3 'Echo' & deck 1 effect_active 3 'Echo' on & deck 1 effect_select 4 'Loop Roll' & deck 1 effect_show_gui 1 on & deck 1 effect_show_gui 2 on & deck 1 effect_show_gui 3 on & deck 1 effect_show_gui 4 on & deck 1 effect_show_gui 5 on & deck 2 level 75% & deck 2 effect_select 1 'EQ 10 Bands' & deck 2 effect_active 1 'EQ 10 Bands' on & deck 2 effect_button 'EQ 10 Bands' 1 & deck 2 effect_slider 'echo' 1 0 & deck 2 effect_select 5 'flanger' & deck 2 filter 0.5 & deck 2 effect_select 2 'Djos Special Flanger' & deck 2 effect_select 3 'Echo' & deck 2 effect_active 3 'Echo' on & deck 2 effect_select 4 'Loop Roll' & deck 2 effect_show_gui 1 on & deck 2 effect_show_gui 2 on & deck 2 effect_show_gui 3 on & deck 2 effect_show_gui 4 on & deck 2 effect_show_gui 5 on & deck 3 level 0% & deck 4 level 0% &
```
  
*Script added from [DJDAD & JimmyL-DJ](http://www.virtualdj.com/forums/219986/General_Discussion/Changing_screen_resolution_wipes_out_ONINIT_effects_settings_.html)*  
  
  
**LFO Filter** (Button)  
```
up ? repeat_stop 'wait' && filter 50% : filter 50% && repeat_start 'wait' 75ms & var 'up' ? filter +5% & filter 90% ? set 'up' 0 : set 'up' 1 : filter -5% & filter 10% ? set 'up' 1 : set 'up' 0 : set 'up' 1
```
  
Press and hold to get a LFO filter effect on a button  
Change the "75ms" for faster/slower effect  
*Script added from klausmogensen*  
  
  
**Noise effect as sweep** (Button)  
From Low:  
```
effect_slider 'noise' 1 20% && effect_slider 'noise' 2 20% && effect_active 'noise' 1 && repeat_start 'wait' 300ms & effect_slider 'noise' 1 +1% & effect_slider 'noise' 2 +3% & effect_slider 'noise' 1 50% ? effect_active 'noise' 0 & repeat_stop 'wait'
```
  
From High:  
```
effect_slider 'noise' 1 80% && effect_slider 'noise' 2 20% && effect_active 'noise' 1 && repeat_start 'wait' 300ms & effect_slider 'noise' 1 -1% & effect_slider 'noise' 2 +3% & effect_slider 'noise' 1 50% ? effect_active 'noise' 0 & repeat_stop 'wait'
```
  
Change the "300ms" for faster/slower effect and the effect\_slider 1 and effect\_slider 2 settings for different noise fx  
*Script added from klausmogensen*  
  
  

**Key**

  
  
  
**Key change** (dial)  
```
param_add -0.5 & param_multiply 2 & key_move
```
  
```
param_add -0.5 & param_multiply 2 & key_smooth
```
  
Two scripts for key change on a dial,  
"move" changes the key by multiples of 1 semitone \[whole notes\]\[-12, -3, +5 etc\]  
"smooth" changes the key by partial semitones \[part notes\[-11.06, -3.9, +5.2 etc\]  
*Script added from [Locodog](http://www.virtualdj.com/homepage/locodog/index.html)*  
  
  
**Key Smooth (from -1 to +1)** (dial)  
```
param_multiply 0.16 & param_add 0.44 & key_smooth
```
  
*Script added from [Locodog](http://www.virtualdj.com/homepage/locodog/index.html)*  
  
  

**Loop**

  
  
  
**Auto Half Loop** (button)  
```
loop 1 & wait 2bt & loop 0.5 & wait 1bt & loop 0.25 & wait 1bt & loop off
```
  
```
loop 1 & wait 2bt & loop 0.5 & wait 1bt & loop_move +4 & goto +4 & loop 0.25 & wait 1bt & loop off
```
  
*updated with wait command*  
*Script added from [Locodog](http://www.virtualdj.com/homepage/locodog/index.html)*  
  
  

**Microphone**

  
  

**Sampler**

  
  
  
**Control the master volume of the sampler using a knob** (for controllers)  
```
 sampler_volume_master 
```
  
Note: You can control the volume using two button, or keys, one for up, the other for down.  
*Script added from bigron1*  
  
  
**Stop all the samples playing** (for controllers or keyboard)  
```
sampler_stop all
```
  
*Script added from bigron1*  
  
  
**Use a button to play a specific named sample** (for controllers)  
Button
```
 sampler_bank X & sampler_play_stop Y 
```
  
Button LED
```
 sampler_play Y on 
```
  
where X= the bank number or name.  
and Y=the sample number or name.  
Note: If you're on a different sample page the normal slot volume control won't work, and hence you need to provide a master sampler volume control. Two buttons (one up, the other down), or one knob will do the trick.  
*Script added from bigron1*  
  
  
**Toggle between the master, and headphone sampler outputs** (for controllers)  
It also lights a LED when the headphone output is selected  
Button
```
 deck master sampler_output ? sampler output "headphones" : deck master sampler_output 
```
  
Button LED
```
 sampler output "headphones" on 
```
  
*Script added from bigron1*  
  
  
**Assign a button to mute the sampler output, and light its LED** (for controllers)  
Button
```
 sampler_volume_master 100% ? sampler_volume_master 0% : sampler_volume_master 100% 
```
  
Button LED
```
 sampler_volume_master 0% on 
```
  
*Script added from bigron1*  
  
  
**

Sweeping Actions

**  
**FADE Script**  
I want to put this script here that locodog helped me for FADER use.  
The Fade plugin from v7 no longer works on V8 and V8 does not have one, this is a script that you can assign to a button to do just that.  
```
repeat_start_instant 'levelSweep' 10ms 101 & level & param_smaller 1% ? stop & level 100% & repeat_stop 'levelSweep' : level -1%

Here is a modified version of the script (if you getting a bump/hump/click noise etc..) use this change/modified version.

repeat_start_instant 'levelSweep' 10ms 101 & level & param_smaller 1% ? stop & repeat_stop 'levelSweep' & stop & repeat_start "WaitTimer" 100ms 1 & level 100% : level -1% : nothing
```
  
script added by The.Magic.DJ  
  
  
**Auto XF more like V7** (Button)  
ONINT (add to the very end of your ONINT)  
```
crossfader 0%  & set "$XFside" 1 & repeat_start "rsXFcheck" 2000ms & crossfader 0% ? set "$XFside" 1 : crossfader 100% ? set "$XFside" 2 : nothing
```
  
Button  
```
cycle "$AutoXF" 2 & var_equal "$AutoXF" 1 ? var_equal "$XFside" 1 ? deck master repeat_start_instant "rsiXF" 10ms 101 & crossfader +1% & crossfader 100% ? deck master repeat_stop "rsiXF" & set "$XFside" 2 & set "$AutoXF" 0 : nothing : var_equal "$XFside" 2 ? deck master repeat_start_instant "rsiXF" 10ms 101 & crossfader -1% & crossfader 0% ? deck master repeat_stop "rsiXF" & set "$XFside" 1 & set "$AutoXF" 0 : nothing : nothing : deck master repeat_stop "rsiXF"
```
  
This script is a 2 parter, ONINT monitors the XF position every 2 seconds, if the XF was last @ 0% the button press will send the XF from left to right, if the XF was last @ 100% the button press will send the XF right to left.  
Pressing the button during action will stop the action.  
*Script added from [Locodog](http://www.virtualdj.com/homepage/locodog/index.html)*  
  
  
**

Video

**  
  
  
**Set the LEFT and RIGHT video on DDJ-SZ per channel FX Selectors**  
with this script you can change the 1 and 2 buttons that are located on the top of each channel to act as a video selector.  
This is useful when you have more than 2 videos playing, or want to HIDE the video without change the video level or change the volume levels.  
  
to start, put this code in the ONINT (at the beginning): *(optional)*  
```
deck 1 leftvideo & set '$lv' 1 & deck 2 rightvideo & set '$rv' 2 &
```
  
*this will make the buttons light on and set the channels 1 and 2 as the default channels for left and right videos*  
  
Now, put the following code on the **FX1\_ASSIGN** key into the mapper:  
```
action_deck 1 ? var_equal '$lv' 1 ? on & leftvideo auto & set '$lv' 0 : off & deck 1 leftvideo & set '$lv' 1 : action_deck 2 ? var_equal '$lv' 2 ? on & leftvideo auto & set '$lv' 0 : off & deck 2 leftvideo & set '$lv' 2 : action_deck 3 ? var_equal '$lv' 3 ? on & leftvideo auto & set '$lv' 0 : off & deck 3 leftvideo & set '$lv' 3 : action_deck 4 ? var_equal '$lv' 4 ? on & leftvideo auto & set '$lv' 0 : off & deck 4 leftvideo & set '$lv' 4 : on & set '$lv' 0
```
  
*This will make all the buttons marked with the number **1** as the **LEFT VIDEO** selectors. so if you wanna set the deck 3 as the **LEFT VIDEO**, you press the button on channel 3 marked with number **1** (at the top of the channel)*  
  
Now, put the following code on the **FX2\_ASSIGN** Key into the mapper  
```
action_deck 1 ? var_equal '$rv' 1 ? on & rightvideo auto & set '$rv' 0 : off & deck 1 rightvideo & set '$rv' 1 : action_deck 2 ? var_equal '$rv' 2 ? on & rightvideo auto & set '$rv' 0 : off & deck 2 rightvideo & set '$rv' 2 : action_deck 3 ? var_equal '$rv' 3 ? on & rightvideo auto & set '$rv' 0 : off & deck 3 rightvideo & set '$rv' 3 : action_deck 4 ? var_equal '$rv' 4 ? on & rightvideo auto & set '$rv' 0 : off & deck 4 rightvideo & set '$rv' 4 : on & set '$rv' 0
```
  
*This will make all the buttons marked with the number **2** as the **RIGHT VIDEO** selectors. so if you wanna set the deck 1 as the **RIGHT VIDEO**, you press the button on channel 1 marked with number **2** (at the top of the channel)*  
*Script added from [Brunoliv](http://www.virtualdj.com/homepage/brunoliv/index.html)*  
  
  
**

Wave

**  
  
  
**Switch between the default wave & scratch wave** (Button)  
```
skin_panel "horizontal_scratch_active" ? skin_panel "defaultwave" : skin_panel "horizontal_scratch_active"
```
  
*Script added from [Locodog](http://www.virtualdj.com/homepage/locodog/index.html)*  
  
  
**Zoom in or out of the wave** (Button)  
```
zoom "default" ? zoom 75% & zoom_scratch 75% : zoom "default" & zoom_scratch "default"
```
  
Zoom in or out with one button.  
*Script added from [Locodog](http://www.virtualdj.com/homepage/locodog/index.html)*  
  
  

**Key and Loop control**

  
I use this with my Hercules MK4  
  
Use the **Shift** Button (hold down) to add extra functions to buttons.  
  
```
shift while_pressed
```
  
  
Change the **Key** with the Pitch Knob while Shift is pressed  
  
PITCH  
```
shift ? param_multiply 1 & key_move : param_multiply 0.25% & pitch
```
  
  
Move the Loop 1 beat +/- with with the TRACK buttons while Shift is pressed  
  
```
shift ? loop_move -1 : seek -4
shift' ? loop_move +1 : seek +4
```
  
  
Only if you want:  
Let the SOURCE button LED blink when SHIFT ist held down  
LED\_SOURCE  
```
shift ? blink 500ms : off
```
  
*Script added from megaalf*  
  
  
Navigation :

---

  

[Back to VDJScript](https://www.virtualdj.com/wiki/VDJ8script.html) [FAQ](https://www.virtualdj.com/wiki/FAQ.html) [Wiki HOME](https://www.virtualdj.com/wiki/Index.html)