---
title: "VirtualDJ - VDJPedia - Skin Define"
source: "https://www.virtualdj.com/wiki/Skin%20Define.html"
author:
  - "[[VirtualDJ Website]]"
published:
created: 2025-02-17
description: "With over 100,000,000 downloads, VirtualDJ packs the most advanced DJ technology. Both perfect to start DJing, and perfect for advanced pro DJs."
tags:
  - "clippings"
---
[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)

  
**Skin SDK: The *<define>* element**

---

---

  
Probably the biggest time saver ever brought to the SDK. <define> allows you to specify elements once and use that definition throughout the skin without having to re-write it. Any element can be pre-defined and then used later.  
  
The <define> must be at the beginning of the skin in order for it to be seen and used later on.  
  
**Attributes :** The attributes of the object your are defining; so for a button these could be action and rightclick for example. Additionally:  

  
- *class* : the name of the define, for example small\_button or songpos
- *classdeck* : optionally specify the deck that this class belongs to, allowing for multiple defines with different attributes for different decks that can then be used as a single object
- *placeholders:* See further down on this page.

  
**Children:** The children of the object you are defining; so for a button these would be the children of that button - for example <up>, <over>, <text>.  
  
**Example:**  
  
In this example we define a <button> for the left deck. Notice there is no <pos> - you will add this later in the actual element.  
```
<define class="mybutton" classdeck="left">
	<size height="45" width="80"/>
	<on x="100" y="125"/>
	<off x="100" y="170/>
	<over x="100" y="215"/>
</define>
```
  
With this at the beginning of your skin you can then use the following to position this element. Notice that we only add the *<pos>* and include *class=""* in the element header.  
```
<button deck="left" class="mybutton" action="loop_in">
	<pos x="356" y="542"/>
	<text format="Loop In"/>
</button>
```
  
You can also pre-define the text format for the button text:  
```
<define class="mybutton" classdeck="left">
	<size height="45" width="80"/>
	<on x="100" y="125"/>
	<off x="100" y="170/>
	<over x="100" y="215"/>
	<text align="center" size="15" color="#FFFFFF" weight="bold"/>
</define>
```
  
Or a button icon:  
```
<define class="mybutton" classdeck="left">
	<size height="45" width="80"/>
	<on x="100" y="125"/>
	<off x="100" y="170/>
	<over x="100" y="215"/>
	<icon width="25" height="25" x="1256" y="2154"/>
</define>
```
  
  
**Placeholders**

---

  
Placeholders in <define> are basically skin variables that you place in your class define and set them later as you call the class. The placeholder names need to be inside brackets \[ \] and in capitals. Simple math can be executed with placeholders if start with \* (asterisk) character, otherwise they will be handled as strings.  
```
<define class="button_main" placeholders="width=62,height=30,taction,sysicon,iconsize,tsize=11,tcolor=textoff">
	<size width="[WIDTH]" height="[HEIGHT]"/>
	<off color="buttonoff"  border="bordercolor" border_size="1" radius="2"/>
	<over color="buttonover" border="bordercolor" border_size="1" radius="2"/>
	<selected color="buttonon" border="bordercolor" border_size="1" radius="2"/>
	<down color="buttonon" border="bordercolor" border_size="1" radius="2"/>
	<text fontsize="[TSIZE]" weight="bold" color="[TCOLOR]" align="center" action="[TACTION]"/>
	<icon sysicon="[SYSICON]" coloroff="[TCOLOR]" width="[ICSIZE]" height="[ICSIZE]" />
</define>

<!-- and  later call .. -->
<button class="button_main" x="+0" y="+0" width="64" height="35" action="cue_button" taction="cue_button" />
<button class="button_main" x="+75" y="+0" width="64" height="35" sysicon="play_button" icsize="32" action="play_button"/>
```
  
  
**Color defines**

---

  
You can also define your custom colors and later call them in your code.  
**Syntax** : <**define** *color="" value="" deck=""*/>  
  
**Attributes** :

- *color:* Provide a name to the color and later use this name to call it. Note that the default pre-defined colors will be overridden if defined, e.g. *<define color="red" value="#900000" />* will display a dark red color when called as *color="red"* in your code, instead of the default red.
- *value:* Provide a hex HTML or decimal ARGB value.
- *deck :* Optional. Define the deck to which the color define will be used when called. If no *deck=""* attribute is given, the same color will be used for all decks (global)

  
See also [Pre-defined Colors](https://www.virtualdj.com/wiki/Skin%20Default%20Colors.html)  
  
Example:  
```
<!-- Color Defines -->
<define color="deckcolorbright" value="#1e7b96" deck="1"/>
<define color="deckcolorbright" value="#b73841" deck="2"/>
<define color="deckcolordark" value="#0d5269" deck="1"/>
<define color="deckcolordark" value="#8e1e25" deck="2"/>
<define color="buttonon" value="#156c89" deck="1"/>
<define color="buttonon" value="#ac2f37" deck="2"/>
<define color="textdeck" value="#1e7b96" deck="1"/>
<define color="textdeck" value="#b73841" deck="2"/> 
....
....
<deck deck="1">
	<button action="play_pause">
		<pos x="100" y="200"/>
		<size height="45" width="80"/>
		<off color="deckcolordark"/>
		<on color="buttonon"/>
		<over color="deckcolorbright"/>
		<text align="center" size="15" color="textdeck" weight="bold"/>
	</button>
</deck>
```
  
  
  
  
  

---

[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)