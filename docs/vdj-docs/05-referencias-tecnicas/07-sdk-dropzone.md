---
title: "VirtualDJ - VDJPedia - Skin SDK Dropzone"
source: "https://www.virtualdj.com/wiki/Skin%20SDK%20Dropzone.html"
author:
  - "[[VirtualDJ Website]]"
published:
created: 2025-02-17
description: "With over 100,000,000 downloads, VirtualDJ packs the most advanced DJ technology. Both perfect to start DJing, and perfect for advanced pro DJs."
tags:
  - "clippings"
---
[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)

  
**Skin SDK: The *<dropzone>* element**

---

---

  
A dropzone is a zone where a file could be dragged over in order to load it to a Deck.  
  
**Syntax**: *<dropzone deck="" panel="" visibility="" os="">*.  
  
**Inherited Attributes** :  
*visibility="" os="" panel="" deck=""*  
See [Global Element Attributes](https://www.virtualdj.com/wiki/Skin%20Element%20Properties.html)  
  
**Children:**  

- *<pos x="" y="">* : Give the position of the dropzone on the screen. Read further in [Skin Element Position](https://www.virtualdj.com/wiki/Skin%20Element%20Positioning.html)
- *<size width="" height="">* : Give the width and height of the dropzone.
- *<mousemask x="" y="">* : (Optional) Give the coordinate of the B&W graphic that should be used as a mask to decide if the mouse is over the dropzone
- *<mouserect x="" y="" width="" height="">* : (Optional) Set a simple rect zone as a mouse mask
- *<mousecircle x="" y="" r="">* : (Optional) Set a simple circle zone as a mouse mask
- *<over color="" border\_size="" border="" shape="square|circle"/>* : (Optional) Set the fill color, border color and border size of the drop area (introduced in VirtualDJ 2020). color="" and border="" can use default color names (such as blue, red, green etc), ARGB, RGB or HTML colors or even color shortcuts. See [Color Definitions](https://www.virtualdj.com/wiki/Skin%20Default%20Colors.html)

  
  
**Example 1:**  
```
<dropzone deck="1">
	<pos x="+0" y="+45"/>
	<size width="700" height="143"/>
	<over color="#40000000" border_size="2" border="#FF0000"/>
</dropzone>
```
  
  
**Example 2:**  
```
<define color="textcolor" value="#509BD4" deck="left"/>
<define color="textcolor" value="#D93636" deck="right"/>
.....
.....
<deck deck="right">
	<panel visibility="var '@$dropcolor' 0">
		<dropzone visibility="var '@$showmixer' 0">
			<pos x="-6" y="+0" />
			 <size width="783" height="183"/>
			<over color="transparent" border="textcolor" border_size="1" shape="square"/>
		</dropzone>
		<dropzone visibility="var '@$showmixer' 1">
			<pos x="-120+5" y="+0" />
			 <size width="783+109" height="183"/>
			<over color="transparent" border="textcolor" border_size="1" shape="square"/>
		</dropzone>
	</panel>
</deck>
```
  
  
  

---

  

[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)