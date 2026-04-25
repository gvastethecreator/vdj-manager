---
title: "VirtualDJ - VDJPedia - Skin Slider"
source: "https://www.virtualdj.com/wiki/Skin%20Slider.html"
author:
  - "[[VirtualDJ Website]]"
published:
created: 2025-02-17
description: "With over 100,000,000 downloads, VirtualDJ packs the most advanced DJ technology. Both perfect to start DJing, and perfect for advanced pro DJs."
tags:
  - "clippings"
---
[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)

  
**Skin SDK: The *<slider>* element**

---

---

  
The <slider> element is mostly used to draw horizontal/vertical faders and round knobs.  
  
**Syntax**: *<**slider** action="" dblclick="" rightclick="" orientation="" direction="" frommiddle="" relative="" visibility="" os="" panel="" deck="">*.  
  
**Inherited Attributes** :  
*visibility="" os="" panel="" deck=""*  
See [Global Element Attributes](https://www.virtualdj.com/wiki/Skin%20Element%20Properties.html)  
  
**Properties :**

- *action="" :* is a [VDJ Script](https://www.virtualdj.com/wiki/VDJScript.html) action that will be performed from the slider
- *rightclick="" :* can specify a different value if the slider is clicked with the right mouse button
- *leftclick="" :* can specify a different value if the slider is clicked with the left mouse button
- *dblclick="" :* can specify a different value if the slider is double-clicked
- *orientation="" :* Possible values:  
\[list\]
- *horizontal*, for a simple horizontal slider
- *vertical*, for a simple vertical slider
- *circle*, for a circular slider
- *round*, for a knob-like button
- *2d*, for a X-Y 2 dimensions slider

- *direction=""* (*horizontal* and *vertical* sliders only) : possible values: *"up"* (default) or *"down"*
- *relative=""* : if set to "*yes*", the slider will move its associated value relatively
- *frommiddle=""* : Set to true to split on/off graphics at the mid point and create a half up/down slider (useful for EQ style knobs).  
\[/list\]  
  
**Children** :
- *<pos x="" y=""/>* : Give the (x,y) position that the slider will have on the screen. Read further details in [Skin Element Position](https://www.virtualdj.com/wiki/Skin%20Element%20Positioning.html)
- *<size width="" height=""/>* : Give the width and the height of the slider.
- *<up x="" y=""/> (or <off/>)* : Give the coordinate of the graphic to use when the slider is normal. Vector graphics can be used as well (see [button](https://www.virtualdj.com/wiki/Skin%20Button.html))
- *<selected x="" y=""/> (or <on/>)* : Give the coordinate of the graphic to use when the slider is selected. Vector graphics can be used as well (see [button](https://www.virtualdj.com/wiki/Skin%20Button.html))
- *<clipmask x="" y=""/>* : Give the coordinate of the B&W graphic that should be used as a clip mask when drawing the slider (should be avoided, suggested to draw in transparent background)
- *<mousemask x="" y=""/>* : Give the coordinate of the B&W graphic that should be used as a mask to decide if the mouse is over the slider (should be avoided, suggested to draw in transparent background)
- *<mouserect x="" y="" width="" height=""/>* : Set a simple rect zone as a mouse mask
- *<mousecircle x="" y="" r=""/>* : Set a simple circle zone as a mouse mask
- *<fader>* (*horizontal* and *vertical* sliders only) : The definition is the same as a *<button>* element without an action, and it will act as a fader for the slider
- *<circle x="" y="" anglemin="" anglemax="" sectsize="" direction=""/>* (*circle* sliders only) : define the circular slider geometry with these properties:  
\[list\]
- x : center of the circle
- y : center of the circle
- anglemin="" : angle (in degree) for the zero position of the slider
- anglemax="" : angle (in degree) for the maximum position of the slider
- sectsize="" : if not zero (default value), the slider will have a "fader" of *sectsize* width
- direction="" : possible values: *"cw"* (default) or *"ccw"*
- *<fader move="" sensibility="">* (*round* sliders only) : The *move* possible values are *"full"*, *"horz"*, *"vert"*, *"v"* or *"circ"*.  
The *<fader>* element may contains these children:  
- *<pos x="" y="" nb="" nbx=""/>* : give the coordinate of the graphics to use for the slider (depending on the slider value). If *nbx* is specified, the graphic is split on several rows. Vector graphics can be used as well (see [button](https://www.virtualdj.com/wiki/Skin%20Button.html))
- *<over x="" y="" nb="" nbx=""/>* : give the coordinate of the graphics to use when the mouse is over the slider. Vector graphics can be used as well (see [button](https://www.virtualdj.com/wiki/Skin%20Button.html))
- *<fill>* (for *round* sliders only)  
The *<fill>* element contains the following children

- *<off x="" x=""/>* : define the off graphics for the "ring" of a round slider (when at 0%)
- *<on> x="" y=""/>* : define the on graphics for the "ring" of a round slider (when at 100%). Vector graphics can be used as well (see [button](https://www.virtualdj.com/wiki/Skin%20Button.html))

\[/list\]  
  
**Example 1:** Linear vertical slider using vector graphics for off/on and image graphics for the moving fader.  
```
<slider action="level" rightclick="temporary" orientation="vertical">
	<pos x="+23-3" y="+3"/>
	<size width="6" height="124"/>
	<off height="-21" color="faderinoff" shape="square" border="darker" border_size="1" radius="3"/>
	<on height="-21" color="faderin" shape="square" border="darker" border_size="1" radius="3"/>
	<mouserect x="-20" y="+0" width="40" height="120"/> 
	<fader>
		<size width="40" height="21"/>
		<off x="236" y="266"/>
	</fader>
</slider>
```
  
  
**Example 2:** Round knob using vector graphics.  
```
<slider action="eq_high" frommiddle="true" orientation="round" relative="no" >
	<pos x="400" y="200"/>
	<size width="48" height="48"/>
	<off width="40" height="40" shape="circle" color="#3a3b3e" color2="#252628" gradient="vertical" border="#1e1e20" border_size="2"/>
	<fader color="#aaaaaa" width="3" height="17" radius="2" anglemin="-150" anglemax="150"/>
	<fill  width="48" height="48" radius="18" color="blue" backcolor="#232323"/>
</slider>
```
  
  
**Example 3** : A 2-dimentional slider (XY - horizontal & vertical)  
```
<slider action="effect_slider 1" action2="effect_slider 2" direction="right" direction2="up" orientation="2d" >
	<pos x="+35+4" y="+30+4"/>
	<size width="335" height="259"/>
	<fader>
		<size width="8" height="8"/>
		<off color="white"/>
	 </fader>
</slider>
```
  
  
  

---

  

[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)