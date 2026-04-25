---
title: "VirtualDJ - VDJPedia - Skin Equalizer"
source: "https://www.virtualdj.com/wiki/Skin%20Equalizer.html"
author:
  - "[[VirtualDJ Website]]"
published:
created: 2025-02-17
description: "With over 100,000,000 downloads, VirtualDJ packs the most advanced DJ technology. Both perfect to start DJing, and perfect for advanced pro DJs."
tags:
  - "clippings"
---
[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)

  
**Skin SDK: The *<equalizer>* element**

---

---

  
This element displays an equalizer visual  
  
**Syntax**: *<equalizer nb="" type="" color="" width="" offset="" slow="" bass="" mirror="" visibility="" os="" panel="" deck="">*  
  
**Inherited Attributes** :  
*visibility="" os="" panel="" deck=""*  
See [Global Element Attributes](https://www.virtualdj.com/wiki/Skin%20Element%20Properties.html)  
  
**Attributes :**  

  
- *nb=""* : Define the amount of the Equalizer lines/bars (the amount of the Bands that the Equalizer will be split into)
- *type="horizontal|circle"* : Define the type of the Equalizer (Round or Linear-Horizontal layout)
- *color=""* : Specify the color of the equalizer graphics. See [Color Definitions](https://www.virtualdj.com/wiki/Skin%20Default%20Colors.html)
- *width=""* : (value from 0.0 to 1.0) Define the width of each Equalizer bar in percentage of the available width. E.g *width="0.8"* will create bars with 80% of the available width - as calculated from the nb value, pos and size) , leaving 20% of empty space between each bar. When *width="0"* the equalizer bars will always use 1px width.
- *offset=""* : (value from 0.0 to 1.0 - optional - default value is 0.7). For *type="circle"* use this property to define the end of the equalizer graphics. E.g. for an equalizer with *width="300" height="300"* and *offset="0.7"*, the *ring* of the equalizer graphics will have a maximum width of 300\*0.7=210 pixels
- *slow="true|false"* : Set to *true* (default is false) for a smoother equalizer visual.
- *bass="top|bottom|left|outside|middle"* : Define the position inside the equalizer where the Bass (Low) Equalizer frequencies will be drawn. For *type="circle"*, you can set *bass="top"* or *bass="bottom"* (bottom is default). For *type="horizontal"*, you can set *bass="left"* (default) or "*outside*" or "*middle*".
- *mirror="false|true"* : When set to true, the equalizer graphics will be drawn mirrored, starting from the center/middle of the defined area. Default is false.
- *canstretch="false|true"* : When set to true, the Equalizer graphics will keep its aspect ratio if the parent panel is resized

  
**Children:**  

  
- *<pos x="" y=""/>* : Define the position (X, Y coordinates) of the equalizer graphics inside the skin. Read further details in [Skin Element Position](https://www.virtualdj.com/wiki/Skin%20Element%20Positioning.html)
- *<size width="" height=""/>* : Define the width and height of the equalizer graphics

  
  
**Example 1 (Linear EQ) :**  
  
```
<equalizer type="horizontal" nb="96" color="#8a8a89" deck="master" width="0.4" slow="true" bass="middle" mirror="false" canstretch="true">
	<pos x="25" y="656"/>
	<size width="1100" height="60" />
</equalizer>
```
  
  
**Example 2 (Round EQ) :**  
  
```
<equalizer nb="64" type="circle" color="#FF0000">
	<pos x="10" y="10"/>
	<size width="362" height="362" />
</equalizer>
```
  
  

---

  

[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)