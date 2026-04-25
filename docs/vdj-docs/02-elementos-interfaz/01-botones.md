---
title: "VirtualDJ - VDJPedia - Skin Button"
source: "https://www.virtualdj.com/wiki/Skin%20Button.html"
author:
  - "[[VirtualDJ Website]]"
published:
created: 2025-02-17
description: "With over 100,000,000 downloads, VirtualDJ packs the most advanced DJ technology. Both perfect to start DJing, and perfect for advanced pro DJs."
tags:
  - "clippings"
---
[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)

  
**Skin SDK: The *<button>* element**

---

---

  
The <button> element is used to display clickable buttons, with the ability to define and style its graphics for all states along with icon and/or text overlays.  
  
**Syntax:** *<button action="" leftclick="" middleclick="" rightclick="" dblclick="" query="" deck="" panel="" visibility="" os="">*.  
  
**Inherited Attributes** :  
*visibility="" os="" panel="" deck=""*  
See [Global Element Attributes](https://www.virtualdj.com/wiki/Skin%20Element%20Properties.html)  
  
**Other Attributes :**  

- *action=""* is a [VDJ Script](https://www.virtualdj.com/wiki/VDJScript.html) action that will be performed when the button is pressed
- *leftclick=""* : can specify a different action if the button is clicked with the left mouse button
- *middleclick=""* can specify a different action if the button is clicked with the middle mouse button
- *rightclick=""* can specify a different action if the button is clicked with the right mouse button
- *dblclick=""* can specify a different action if the button is double-clicked
- *query=""* can specify a different action that will enable (if true) the <on> graphics  
  
Note : Except for *action*, all other attributes are optional

  
  
**Children:**  

- *<tooltip>* : Set the tooltip for this button. Tooltips can have \\n inside the text to define additional lines.
- *<pos x="" y=""/>* : Give the (x,y) position that the button will have on the screen. Read further details in [Skin Element Position](https://www.virtualdj.com/wiki/Skin%20Element%20Positioning.html)
- *<size width="" height=""/>* : Give the width and the height of the button.  
  
**Define the graphics:**  
There are 2 ways to define the graphics of a button :  
  
a) Pointing to a part of the skin image:
- *<up x="" y=""/>* : Give the coordinate from the skin image to use when the button is normal. *<off>* is the same as *<up>*
- *<down x="" y=""/>* : Give the coordinate from the skin image to use when the button is pushed. *<on>* is the same as *<down>*
- *<selected x="" y=""/>* : Give the coordinate from the skin image to use when the button is selected
- *<over x="" y=""/>* : Give the coordinate from the skin image to use when the mouse is over the button
- *<overselected x="" y=""/>* : Give the coordinate from the skin image to use when the mouse is over the button and the button is selected
- *<downselected x="" y=""/>* : Give the coordinate from the skin image to use when the button is pushed and selected  
  
```
<button action="loop">
	<pos x="125" y="220"/>
	<size width="70" height="44"/>
	<up x="120" y="1890" />
	<over x="120" y="1890+100" />
	<down x="120" y="1890+200" />
	<selected x="120" y="1890+300" />
</button>
```
  
  
b) Draw the button with code (vector graphics) as...  
<up shape="" color="" border="" border\_size="" radius="" gradient="" color2=""/>  
(and same for <down>, <selected>, <over> etc, with the following attributes :  
\[list\]
- *shape="circle|square"* Define the shape of the button. Default (if not defined is square)
- *color=""* : Define the fill color of the button. See [Color Definitions](https://www.virtualdj.com/wiki/Skin%20Default%20Colors.html)
- *border=""* : Define the color of the border. See [Color Definitions](https://www.virtualdj.com/wiki/Skin%20Default%20Colors.html)
- *border\_size=""* : Define the thickness of the border (in pixels)
- *radius=""* : Define the radius of all the button's corners to create rounded corner buttons.
- *gradient="horizontal|vertical|circular"* : Define if the button will be filled with one of the available gradients. If not defined, the button will be filled with the solid color as defined in the *color=""* attribute .
- *color2=""* : If a gradient is defined above, use this property to define its end color (start color will be the color="" attribute ).

  
```
<button action="loop">
	<pos x="125" y="220"/>
	<size width="70" height="44"/>
	<up radius="6" border_size="2" border="black" color="#2F3034" />
	<over radius="6" border_size="2" border="black" color="#2C3B47" />
	<down radius="6" border_size="2" border="black" color="#1287E0"/>
	<selected radius="6" border_size="2" border="black" color="#1287E0"/>
</button>
```
  
  
**Drawing and mouse masks:**  
- *<clipmask x="" y=""/>* : Give the coordinate of the B&W graphic that should be used as a clip mask when drawing the button. Clipmask should be avoided and the elements need to be drawn with transparent background
- *<mousemask x="" y=""/>* : Give the coordinate of the B&W graphic that should be used as a mask to decide if the mouse is over the button. Mousemask should be avoided and the elements need to be drawn with transparent background.
- *<mouserect x="" y="" width="" height=""/>* : Set a simple rect zone as a mouse mask
- *<mousecircle x="" y="" r=""/>* : Set a simple circle zone as a mouse mask  
  
**Overlay Texts:**
- *<text>* : Set a text to be displayed inside the button (see <text> in [<textzone>](https://www.virtualdj.com/wiki/Skin%20SDK%20Textzone.html) for syntax)
- *<textselected>* : Set a text to be displayed inside the button when selected (see <text> in [<textzone>](https://www.virtualdj.com/wiki/Skin%20SDK%20Textzone.html) for syntax)
- *<textdown>* : Set a text to be displayed inside the button when pushed (see <text> in [<textzone>](https://www.virtualdj.com/wiki/Skin%20SDK%20Textzone.html) for syntax)
- *<textover>* : Set a text to be displayed inside the button when mouse is over (see <text> in [<textzone>](https://www.virtualdj.com/wiki/Skin%20SDK%20Textzone.html) for syntax)  
  
**Note:** Usually, the various text children have the same font, align and text/format/action parameters and it's just the color of the text that varies between those off/on/down/over states. In this case, you can just have a <text> child and use *color="" colordown="" coloover=""* etc to define the color of the text.  
  
```
<button action="play_pause">
	<tooltip>Line 1\nLine2</tooltip>
	<pos x="+250" y="+20"/>
	<size width="170" height="70"/>
	<off color="gray" border_size="1" border="gray"/>
	<on color="#202020" border_size="1" border="white"/>
	<over color="#505050" border_size="1" border="white"/>
	<text fontsize="15" color="gray" colorover="white" colordown="yellow" colorselected="red" weight="bold" align="center" text="PLAY"/>
</button>
```
  
  
**Overlay Icons:** You can add/overlay an icon to your button, either by pointing to a part of the skin image or use internal icons.
- *<icon x="" y="" width="" height="" dx="" dy="" downx="" downy="">*: Overlay an image on the button by defining its x, y position and size (width, height). Use dx="" and/or dy="" to create an offset (e.g. *dx="+10"* will position the icon 10 pixels to the right. Use *downx="" downy=""* to position the icon differently when the button is down (selected/pressed).
\[\*\]*<icon sysicon="" width="" height="" dx="" dy="" downx="" downy="">*: Overlay a system/internal icon on the button. Use dx="" and/or dy="" to create an offset (horizontal or vertical margin). Use *downx="" downy=""* to position the icon differently when the button is down (selected/pressed).  
  
The available *sysicon* names are: context\_menu, play\_button, stop\_button, sampler\_mode, add\_favoritefolder, add\_virtualfolder, add\_filterfolder, goto\_last\_folder, grid\_view, view\_options 'showmusic', view\_options 'showvideo', view\_options 'showkaraoke', show\_splitpanel 'info', show\_splitpanel 'sideview', show\_splitpanel 'effects', font\_size -, font\_size +, sideview 'automix', sideview 'sidelist', sideview 'sampler', sideview 'karaoke', sideview 'clone', sideview ", sampler\_bank -1, sampler\_bank +1, sampler\_bank ', sideview\_triggerpad, karaoke, automix, effect\_dock\_gui, effect\_show\_gui, search, play, play\_pause, play\_button, stop, pause, stop\_button, browser\_zoom, maximize, minimize, close, settings. See further details in [Default Icons](https://www.virtualdj.com/wiki/Skin%20Default%20Icons.html)  
  
Different colors can be used for icons by using : *coloroff="" colorselected="" colordown=""* etc  
  
```
<button action="play_pause">
....
.....
	<icon sysicon="play_button" color="#404040" colorover="#808080" colordown="green" colorselected="green" width="24" height="24" />
</button>
```
  
  
... or with a custom drawn icon (from image)  
```
<button action="play_pause">
....
.....
	<icon x="453" y="301" width="11" height="10" coloroff="textdark" colorover="textbright" colordown="white" colorselected="white"/>
</button>
```
  
  
Different image icons can be overlayed for <up>, <down>, <over> button status..  
```
<button action="" ...>
	.....
	......
	<icon x="261" y="279" width="14" height="15"> <!-- Icon graphics for up -->
		<over x="261" y="299" width="14" height="15"/>  <!-- Icon graphics for over -->
		<selected x="261" y="299" width="14" height="15"/>  <!-- Icon graphics for selected/on -->
	</icon>
</button>
```
  
\[/list\]  
Except for *<pos>*, all the other definitions are optional  
Relative to <pos> coordinates can be used with +/- for all the definitions. <pos> can have relative coordinates as well if nested inside a group or panel (see <group> and <panel>)  
  
*Example :*  
```
<button action="loop" rightclick="loop_select"  visibility="deck 1 leftdeck">
	<Tooltip>Click to enable-disable the selected loop\nRight-click to select a loop length</Toolip>
	<pos x="12" y="300" width="49" height="39"/>  
	<off x="+0" y="1130"/>
	 <on x="+0" y="1130+50"/>
	<over x="62" y="1130+50"/>
	<down x="+0" y="1172"/>
	<text size="16" weight="bold" color="#e1e1e1" align="center" format="%loop"/>
</button>
```
  
  

---

  

[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)