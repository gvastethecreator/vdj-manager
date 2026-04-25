---
title: "VirtualDJ - VDJPedia - VDJscript"
source: "https://www.virtualdj.com/wiki/VDJscript.html"
author:
  - "[[VirtualDJ Website]]"
published:
created: 2025-02-18
description: "With over 100,000,000 downloads, VirtualDJ packs the most advanced DJ technology. Both perfect to start DJing, and perfect for advanced pro DJs."
tags:
  - "clippings"
---
**VDJscript**  
  
  
  
[Examples of VDJScript actions](https://www.virtualdj.com/wiki/VDJScript%20Examples.html)  
  
  
VDJscript is the language in which all commands in VirtualDJ 8 are written.  
It is used in skins, keyboard shortcuts or [controller mappers](https://www.virtualdj.com/wiki/ControllerDefinition.html).  
  
It has been designed to be simple and short when used for simple actions, but versatile enough to allow complex scripting and macros.  
In its simplest form, you can write commands like play, pause, goto\_cue 1, volume 70%, pitch +0.5%, etc...  
Or you can write complex macros like play ? crossfader +12.3% & effect\_activate 'flanger' : deck 2 loop 4 & set $myvar 42  
  
**Verbs**

---

  
The basic elements of VDJscript are "verbs".  
You can find a [list of the verbs](https://www.virtualdj.com/wiki/VDJscript_verbs_v8.html) understood by VirtualDJ in the controller mapper settings or custom button editor.  
  
**Commands**

---

  
The most basic command would consist of only a verb (like play or pause).  
**Optionally**, the **verb** can be accompanied by different modifiers and parameters:

  
- **deck**: you can specify which deck the verb act upon by adding deck *xxx* in front of the verb. *xxx* can be 1, 2, 3, 4 e.t.c, left, right (for audio), leftvideo, rightvideo (for video), default or active. If not specified, the verb will apply on either the default/selected deck or the deck specified by the controller mapping or skin element.
- **parameters**: the verb can be followed by one or more parameters. The function of these parameters depends on the verb. Parameters can be strings, percentages, booleans, times, integer values, or decimal values. E.g. effect\_active 'flanger' or effect\_slider 1 2 100% , sampler\_pad 2 , sampler\_volume 3 100% etc
- **temporary** action: you can specify that the verb is to act only while the button is pressed by adding while\_pressed at the end of the command. e.g. volume 100% while\_pressed.
- **blink**: use the verb blink: play ? blink : nothing

  
The full command syntax is:  
```
{deck {deck}} verb {param1} {param2} {while_pressed}
```
  
( {...} means : optional )  
  
**Chained commands**

---

  
If you need to write more complex commands, you can use the operator "&" to chain commands, or the operators "?" and ":" to write conditional branching.  
Using *command1* & *command2* & *command3* will execute the command1, then execute the command2, then command3.  
Using *command1* ? *command2* : *command3* will query the state of command1, and if the result is true, execute command2, otherwise execute command3.  
  
For example:  
Using action\_deck 1? *command1* : *command2* will execute the command1 if the button on the controller was defined to work on deck 1 (see "definition" xml file) or execute the command2 if the button was defined to work on deck 2  
  
**Actions vs queries**

---

  
Commands can be used either as actions or as queries, depending on the context.  
For example, the command play used in a keyboard shortcut, will be an action, and start to play the music when called.  
The same command play used as a mapping for a controller's LED, will be a query, and will return *true* if the song is playing, or *false* if not.  
  
Some commands can return a boolean (true or false) or a value, depending on the parameters:  
\- crossfader will return the value (between 0.0 and 1.0) if used in a query. Will also return true if its value is greater than 0.5 and false if smaller.  
\- crossfader 42% will return true if the crossfader is at 42%, and false otherwise.  
Some other commands can return a string or a number, depending on the verb. (usually verbs starting with get\_ )  
\- get\_time\_ms will return the time of the loaded track in ms as an integer  
\- get\_artist will return the Artist of the loaded track as text  
  
When chained commands are used in queries, the result depends on the state of the 1st action. E.g. play & loop will return true if the deck is playing (regardless if the deck is looped or not).  
If && is used instead of &, to chain commands in queries, the query returns true only if both chained commands return true.  
E.g. play && loop query will return true only if both commands return true (deck is playing and is looped) and false in all other cases.  
  
**Parameters**

---

  
VDJscript knows 7 types of parameters:  
\- text: need to be enclosed in either single quotes (') or double quotes ("): load 'myfile.mp3'  
\- boolean: can be the keywords on, off or toggle. (they are often equivalent to the integers 1, 0 and -1 respectively): smart\_play off  
\- time: are specified by adding the keyword ms: nudge +100ms  
\- beat: a time as measured in beats are specified by adding the keyword bt: play\_pause & wait 8bt & play\_pause  
\- integer: effect\_select +1  
\- decimal: crossfader 0.5  
\- percentage: crossfader 50%  
  
Most of the time, decimal and percent are treated as same (after dividing the % by 100 of course).  
There are a few exceptions, like the verb pitch, where pitch 100% sets the pitch to the middle, while pitch 1.0 sets the pitch to the maximum of the slider.  
  
Keep in mind also that nudge +1 and nudge +1.0 is not the same thing. The first moves from 1 beat, while the second is equivalent to nudge +100% which jumps at the end of the song. Most of the time you should use percents instead of decimals, but if you write complex scripts it's worth knowing.  
  
**Implicit parameters**

---

  
When a command is used as an action for a slider (or knob, jogwheel, etc), the value of the slider will be added as an implicit parameter.  
  
When an implicit parameter is added, it is added at the end of the command, as an additional parameter coming just after the existing ones.  
So if your action is volume and you map this to a slider that you move to 42%, the action sent will be volume 0.42.  
But if your action is volume +10%, the action sent will be volume +10% 0.42 (and the second parameter 0.42 will just be safely ignored because the verb volume expects only one parameter).  
  
If you need to modify the implicit parameter, you can use some verbs like param\_multiply, param\_add, etc...  
So param\_multiply 0.1 & volume will result in setting the volume at 4.2%  
  
If you have a macro with several commands, each commands will have the implicit parameter added.  
So if you write crossfader & loop and map that to a slider that you move to 42%, the action sent will be crossfader 0.42 & loop 0.42.  
  
Also, it's worth knowing that sliders will add a decimal parameter (crossfader -> crossfader 0.42), jogwheel will add a relative decimal (crossfader -> crossfader +0.42, +1.0 being a full revolution of the wheel), and encoders will add a relative integer (crossfader -> crossfader +1).  
If you use an encoder for a verb that expects a slider, the integer will be automatically converted to a decimal by dividing it by 32 (so that one needs 32 steps of the encoder to move the slider from 0% to 100%). So in the previous example crossfader +1 is equivalent to crossfader +0.03125. You can use param\_multiply if you need another resolution.  
  
**Variables**

---

  
VDJscript can store states or numbers in internal variables.

  
- **Global** : If the name of the variable starts with a $ (like set $myvar), the variable will be 'global' to both decks.
- **Local** : If the name of the variable starts with a % (like set %myvar) or with nothing (like set 'myvar'), the variable will be 'local' to this deck (and can have a different value if used on the other deck).
- **Persistent Global** : If the name of the variable starts with @$ (like set @$myvar), the variable will be 'global' to both decks and its value will be saved across sessions
- **Persistent Local** : If the name of the variable starts with @% (like set @%myvar) or with just @ (like set '@myvar'), the variable will be 'local' to this deck (and can have a different value if used on the other deck) and their values will be saved across sessions

  
All type of variables are persistent during the whole time VirtualDJ is running (they are not local to a specific controller or skin).  
  
To set a variable, you can use verbs like set, toggle, cycle.  
To read a variable, you can use verbs like var, var\_equal, var\_smaller, etc...  
A typical example of using variables is to have set '$myshift' 1 while\_pressed on a shift button, and var $myshift ? *command1* : *command2* on another button.  
  
**Brackets**

---

  
Brackets can be used in scripts to break the logic into separate threads.  
( wait 1000ms & play\_pause ) & action\_deck 1 ? deck 2 play\_pause : deck 1 play\_pause  
  
[Back to Developer page](https://www.virtualdj.com/wiki/Developers.html)  
  
[Wiki HOME](https://www.virtualdj.com/wiki/index.html)