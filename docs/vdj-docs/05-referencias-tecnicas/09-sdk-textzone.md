---
title: "VirtualDJ - VDJPedia - Skin SDK Textzone"
source: "https://www.virtualdj.com/wiki/Skin%20SDK%20Textzone.html"
author:
  - "[[VirtualDJ Website]]"
published:
created: 2025-02-17
description: "With over 100,000,000 downloads, VirtualDJ packs the most advanced DJ technology. Both perfect to start DJing, and perfect for advanced pro DJs."
tags:
  - "clippings"
---
[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)

  
**Skin SDK: The *<textzone>* element**

---

---

  
The <textzone> element is used to display static or dynamic texts inside its boundaries.  
  
**Syntax**:  
*<textzone deck="" resetcounter="" action"" group="horizontal" click="" align="">*.  
  
**Inherited Attributes** :  
*visibility="" os="" panel="" deck=""*  
See [Global Element Attributes](https://www.virtualdj.com/wiki/Skin%20Element%20Properties.html)  
  
**Attributes :** (All are optional)  

- *resetcounter=""* : if set to *"true"*, the counter will be reset if this textzone is clicked
- *action=""* A textzone can also have a VDJScript action, which will be executed if clicked.
- *group="horizontal"* : Use this property if you need the textzone to display all the nested <text> elements, separated by a space character

  
**Children**:

- *<pos x="" y=""/>* : Give the position of the textzone on the screen. Read further details in [Skin Element Position](https://www.virtualdj.com/wiki/Skin%20Element%20Positioning.html)
- *<size width="" height=""/>* : Give the width and height of the textzone. Read further details in [Skin Element Position](https://www.virtualdj.com/wiki/Skin%20Element%20Positioning.html)
- *<background color="" /> or <background x="" y="" />* : Optional. Fill the textzone area with a solid color or graphics area from the skin image. (Still preferred adding a <visual> before the <textzone>, especially if the text is not static).
- *<text font="" weight="" fontsize="" color="" align="" valign="" dx="" dy="" overdx="" overdy="" width="" multiline="" format="" text="" action="">* : Specify the text to be displayed with these attributes :  
\[list\]
- *font* : select the font to be used (default: Arial). If you use the same font throughout the entire skin, you can save this attribute from typing all the times, by using [<font>](https://www.virtualdj.com/wiki/Skin%20Font.html)
- *weight* : possible values: *"normal"* (default) or *"bold"*
- *fontsize* : give the font size (default: 12)
- *color* : give the font color (default is white). The color can be written in numerical format (#0000FF) or with the color name ("blue"). See [Colors](https://www.virtualdj.com/wiki/Skin%20Default%20Colors.html)
- *align* : Use this attribute to horizontally align the displayed text. Possible values: *"left"*, *"right"*, *"center"* (or *"middle"*). If not defined, text will be left-aligned.
- *valign* : Use this attribute to vertically align the displayed text. Possible values: *"top"*, *"bottom"*, *"center"*. If not defined, text will be vertically centered-aligned.
- *dx="" dy="" width=""* : You can create margins/padding to your text by defining an X or Y offset (default is 0) along with the maximum width of the displayed text (if not defined, the width="" from the <pos> child will be used). E.g. dx="10" width="50" will create 10 pixels of left margin with a maximum text width of 50 pixels.
- *overdx="" overdy=""* : Same as the *dx* and *dy* attributes above. Will be used for the text when mouse is over the <textxone> area.
- *scroll* : if set to *"yes"*, the text will scroll if it can't fit in the box. Default is *"no"*
- *multiline* : Use *multiline="yes"* if you want the text to wrap in multiple lines instead of cut/shrink to a single line. Make sure the height is big enough .
- *text* : Use this attribute to display a static text. e.g. *text="PLAY"*.
- *format* : Use this attribute to display dynamic texts using %shortcuts. (see the exact format below).
- *action* : Use this attribute to display texts returned from VDJ scripts e.g. *action="get\_effect\_name"*  
**Note:** Use one of the 3 previous attributes (text, format or action) to display your text, as only one will be used and the other 2 will be ignored.

  
  
Multiple <text> children can be added inside the same <textzone>.  
If no group='horizontal" property is defined in the <textzone>, the additional <text> children will cycle and their texts will be displayed every time the <textzone> is clicked.  
If group="horizontal" is defined, all the <text> children will be displayed in the same horizontal line separated by a space.  
\[/list\]  
  
The format is a string that describes how the text will be displayed. You can still use a [VDJ Script](https://www.virtualdj.com/wiki/VDJScript.html) action with backward single quotes \`\` for example *format="\`get sample\_slot\_name X\`"* which displays the name of the sample in slot X, or you can use one of the special textzone commands:  

- \\\\: print a single \\ character
- \\*n* : print a line feed
- \\*r* : print a carriage return
- \\*t* : print a tab character
- \\*x* : print the ascii character xx
- *%%* : print a single % character
- *%yy* : goto to the yy line
- *%xx,yy* : goto to the xx,yy position
- *%title* : print the song's title
- *%author* : print the song's author
- *%comment* : print the song's comment if any
- *%fullhour* : display the time in a hh:mm:ss format
- *%hour* : display the time in a hh:mm format
- *%hour12* : display the time in a h:mm am/pm format
- *%counter* : display a counter
- *%pitch* : print the pitch value
- *%time* : print the length of the song (can use modifiers - see below)
- *%spent* : print the spent time of the song (can use modifiers)
- *%left* : print the left time of the song (can use modifiers)
- *%cueX* : print the time position of the Xth cue point (can use modifiers)
- *%tocueX* : print the time to the Xth cue point (can use modifiers)
- *%fromcueX* : print the time elapsed from the Xth cue point (can use modifiers)
- *%start* : print the time position of the first beat (can use modifiers)
- *%end* : print the time position of the last beat (can use modifiers)
- *%tostart* : print the time to the first beat (can use modifiers)
- *%toend* : print the time to the last beat (can use modifiers)
- *%fromstart* : print the time elapsed from the first beat (can use modifiers)
- *%fromend* : print the time elapsed from the last beat (can use modifiers)
- *%bpm* : print the bpm of the song (can use modifiers)
- *%bpmex* : print the bpm of the song (can use modifiers)
- *%bpmexx* : print the bpm of the song (can use modifiers)
- *%level* : print the song's level in dB (can use modifiers)
- *%key* : print the song's key
- *%camelot* : print the song's key (numeric)
- *%keyoffset*
- *%cpu*
- *%status*
- *%maineffect*
- *%effectslotX*
- *%mainsample*
- *%videofx*
- *%videotransition*
- *%linkedvideo*
- *%loop*
- *%name*
- *%namecueX*
- *%pitchrange*
- *%djc\_buttonX*  
**New**
- *%nextcue* : print the time of the next cue point
- *%prevcue* : print the time of the last cue point
- *%nextcuename* : print the name of the next cue point
- *%prevcuename* : print the name of the last cue point

Some of the % commands can be used with modifiers. Modifiers are capitalized letters you insert between the % and the command. You can use:  

- *P* : modify the value to reflect the pitch change
- *L* : use the local value instead of the global value (only used by *%level*)
- *B* : display the value as a number of beat instead of a time

  
  
  

---

  

[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)