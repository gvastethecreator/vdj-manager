---
title: "VirtualDJ - VDJPedia - Skin SDK Visual"
source: "https://www.virtualdj.com/wiki/Skin%20SDK%20Visual.html"
author:
  - "[[VirtualDJ Website]]"
published:
created: 2025-02-17
description: "With over 100,000,000 downloads, VirtualDJ packs the most advanced DJ technology. Both perfect to start DJing, and perfect for advanced pro DJs."
tags:
  - "clippings"
---
[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)

  
**Skin SDK: The *<visual>* element**

---

---

  
A visual is a zone with static graphics or dynamically change its display to reflect various things.  
  
**Syntax** : *<**visual** source="" type="" orientation="" direction="" granularity="" visibility="" os="" panel="" deck="">*.  
  
**Inherited Attributes** :  
*visibility="" os="" panel="" deck=""*  
See [Global Element Attributes](https://www.virtualdj.com/wiki/Skin%20Element%20Properties.html)  
  
**Other Properties** :  

- *source* : possible values:  
\[list\]
- *"beat"* : The beat intensity
- *"rotation"* : The angle of the disc (depends on the position and the RPM speed)
- *"arm"* : The position of the turntable's arm (moves on PLAY and PAUSE)
- *"volume"* : The volume (depends on the crossfader and the level values)
- *"position"* : The position in the song
- Any of the *"get ..."* [VDJ Script](https://www.virtualdj.com/wiki/VDJScript.html) actions that return a numeric value

  
- *type* : possible values:  
- *"onoff"* : Display the up graphic if source>=2048, or the down graphic if source<2048
- *"transparent"* : Fade smoothly between up and down graphics
- *"linear"* : Display a portion from the down graphic then a portion from the up graphic
- *"custom"* : Display a specific graphic depending on the source value
- *"color"* : Display a specific color depending on the source value
- *vumeter*: To create a vu-meter style visual with <led>s.
- *orientation=""* : (defined for type="linear" only) possible values: *"horizontal"* or *"vertical"*
- *direction=""* : (defined for type="linear" only) possible values: *"left"*, *"right"*, *"up"* or *"down"*
- *granularity=""* : (for type=linear) Divide your visual graphics to sections and get section by section representation instead of smooth. (useful for VU-meters)  
\[/list\]  
**Children :**

- *<pos x="" y=""/>* : Give the position of the visual on the screen. Read further details in [Skin Element Position](https://www.virtualdj.com/wiki/Skin%20Element%20Positioning.html)
- *<size width="" height=""/>* : Give the width and height of the visual
- *<clipmask x="" y=""/> (optional)* : Give the coordinate of the B&W graphic that should be used as a clip mask when drawing the visual
- *<off x="" y=""/>* : (all types except "custom") Give the coordinate of the graphic to use when the visual is low. Vector graphics can be used as well (see [button](https://www.virtualdj.com/wiki/Skin%20Button.html))
- *<on x="" y=""/>* : (all types except "custom") Give the coordinate of the graphic to use when the visual is high. Vector graphics can be used as well (see [button](https://www.virtualdj.com/wiki/Skin%20Button.html))
- *<up x="" y="" nb="" nbx=""/>* : (type="custom" only) Give the coordinate of the graphics to use with the custom type (works like for a "round" slider). Vector graphics can be used as well (see [button](https://www.virtualdj.com/wiki/Skin%20Button.html))
- *<led x="" y="" width="" height=""/>* (for type="visual") : to define the leds of the vu-meter with the following children for each: \[list\]
- *<off color="" radius="" border="" border\_size=""/>*
- *<on color="" radius="" border="" border\_size=""/>*

  
\[/list\]  
  
**Example 1:** A linear horizontal visual displaying loop position on a bar, using vector graphics.  
```
<visual source="loop_position" type="linear" orientation="horizontal">
	<pos x="19" y="285"/>
	<size width="99" height="7"/>
	<off shape="square" color="jogringoff" radius="3"/>
	<on shape="square" color="jogringon" radius="3"/>
</visual>
```
  
  
**Example 2 :** A simple colored area with vector graphics.  
```
<visual>
	<pos x="125-10" y="252-10"/>
	<size width="12+20" height="12+20"/>
	<off color="#404040" border="#808080" border_size="1"/>
</visual>
```
  
  
**Example 3 :** A simple colored area using color-type visual and a graphics mask.  
```
<visual source="loop_roll_mode ? constant '#427db4' : constant '#00000000'" type="color">
	<pos x="125" y="252"/>
	<tooltip></tooltip>
	<size width="12" height="12"/>
	<mask x="195" y="1085"/>
</visual>
```
  
  
**Example 4 :** A jog-rotation visual pointing to the graphics that need to rotate (e.g. logo + needle)  
```
<visual type="rotation" source="get_rotation" visibility="loaded">
	<pos x="+19+61" y="+26+60"/>
	<size width="64" height="64"/>
	<on x="993" y="86" width="64" height="64"/>
</visual>
```
  
  
**Example 5**: A VU-meter visual pointing to the on image graphics using 23 "leds".  
```
<visual source="get level" type="linear" orientation="vertical" granularity="23" direction="up" >
	<pos x="+3" y="+3"/>
	<size width="15" height="299"/>
	<on x="1098" y="2393"/>	
</visual>
```
  
  
  
**Example 6** : A vector VU-meter type visual with <led>.  
```
<visual type="vumeter" x="200" y="250" width="16" height="100" source="get_level" smooth="true" >
<led x="+0" y="+80" width="16" height="18">
	<off color="gray" radius="2" border="black" border_size="1"/>
	<on color="green" radius="2" border="black" border_size="1"/>
</led>
<led x="+0" y="+60"width="16" height="18">
	<off color="gray" radius="2" border="black" border_size="1"/>
	<on color="green" radius="2" border="black" border_size="1"/>
</led>
<led x="+0" y="+40" width="16" height="18">
	<off color="gray" radius="2" border="black" border_size="1"/>
	<on color="green" radius="2" border="black" border_size="1"/>
</led>
<led x="+0" y="+20" width="16" height="18">
	<off color="gray" radius="2" border="black" border_size="1"/>
	<on color="orange" radius="2" border="black" border_size="1"/>
</led>
<led x="+0" y="+0" width="16" height="18">
	<off color="gray" radius="2" border="black" border_size="1"/>
	<on color="red" radius="2" border="black" border_size="1"/>
</led>
</visual>
```
  

---

  

[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)