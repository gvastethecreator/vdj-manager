---
title: "VirtualDJ - VDJPedia - Skin Element Positioning"
source: "https://www.virtualdj.com/wiki/Skin%20Element%20Positioning.html"
author:
  - "[[VirtualDJ Website]]"
published:
created: 2025-02-18
description: "With over 100,000,000 downloads, VirtualDJ packs the most advanced DJ technology. Both perfect to start DJing, and perfect for advanced pro DJs."
tags:
  - "clippings"
---
[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)

  
**Skin SDK: Skin Element Position & Size**

---

---

  
Every skin element needs to have X, Y attributes to define the position of the top-left point of the element's boundaries on the screen. The values are in pixels starting from the top-left corner of the screen (0,0).  
If no position is defined, the skin element will be positioned at 0,0. The **x, y** position values can be defined either in a **<pos>** nested node or directly as a attribute in <element> node.  
  
In addition, every skin element needs to have a size (Width & Height) in pixels. If size is not defined or defined as 0, the skin element will not be displayed. The **width, height** values of size can be defined in a **<size>** nested child or in a **<pos>** nested child or directly as an attribute in <element> node.  
  
The following 3 codes will display the same 120x50 button at the **same** 100,200 position.  
  
```
<button action="play_pause">
	<pos x="100" y="200"/>
	<size width="120" height="50"/>
	<off color="green"/>
</button>
```
  
```
<button action="play_pause">
	<pos x="100" y="200" width="120" height="50"/>
	<off color="green"/>
</button>
```
  
```
<button action="play_pause" x="100" y="200" width="120" height="50">
	<off color="green"/>
</button>
```
  
  
**Relative Position**

---

  
You can position an element relatively to its parent container (group, panel), by adding a + or - in front of the x, y values.  
In the following example the Play button will be positioned at (80+100) , (200+30) and the Loop button will be positioned at (80+150), (110).  
  
```
<group x="80" y="200">
	<button action="play_pause">
		<pos x="+100" y="+30"/>
		<size width="120" height="50"/>
		<off color="green"/>
	</button>
	<button action="loop">
		<pos x="+150" y="110"/>
		<size width="60" height="50"/>
		<off color="green"/>
	</button>
</group>
```
  
  
In the previous example, if the <group> had a relative position (e.g. x="+10") the Skin Engine would look up to its parent container (could be another group) and if not found, then it would simply start adding the relative positions from 0 (start of skin).  
  
Relative positions are recommended and very useful when creating a skin, as entire groups of elements can be easily re-positioned with a simple edit to the x,y position values of the parent container.  
  
  
**Simple Math calculations**

---

  
Simple Math operators (+, -, \*, /) can be used in **both Position and Size**. The operations will be executed from left to right without any priorities.  
  
In the following example, the Play button (W:120, H:50) will be positioned at x (100-10=90), y(30+30=60), and the Loop button (W: 2\*10+40=60 , H:40-10=30) will be positioned at x(100/2-10+5+60=105), y(30\*2+10=70).  
  
```
<button action="play_pause">
	<pos x="100-10" y="30+30"/>
	<size width="120" height="50"/>
	<off color="green"/>
</button>
<button action="loop">
	<pos x="100/2-10+5+60" y="30*2+10"/>
	<size width="2*10+40" height="40-10"/>
	<off color="green"/>
</button>
```
  
Note that a X position defined as x="100/2+10" is equal to 60 but x="10+100/2" is equal to 55 as the addition of 10+100 is executed before the division.  
  

---

  

[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)