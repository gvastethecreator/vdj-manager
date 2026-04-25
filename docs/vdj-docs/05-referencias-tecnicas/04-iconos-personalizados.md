---
title: "VirtualDJ - VDJPedia - Skin CustomIcons"
source: "https://www.virtualdj.com/wiki/Skin%20CustomIcons.html"
author:
  - "[[VirtualDJ Website]]"
published:
created: 2025-02-17
description: "With over 100,000,000 downloads, VirtualDJ packs the most advanced DJ technology. Both perfect to start DJing, and perfect for advanced pro DJs."
tags:
  - "clippings"
---
[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)

  
**Skin SDK: The *<customicons>* element**

---

---

  
You can define your own icons to be used in VirtualDJ by adding a *<**customicons**\>* element in your skin. The graphics for the custom icons can be in a separate *filename.png* file inside the skin zip, or inside the *skin.png* (if optional *property file=""* is not used)  
  
**Syntax**: *<**customicons** file="" x="" y="" iconsize="" nb="" nbx=""/>*  
  
**Attributes**:

- *file=""* : (Optional) Provide the image filename (included in your skin zip) with your Custom Icons. If no file="" attribute is provided, the Custom Icons will be looked at the skin image file.
- *x="" y=""* : Give the X, Y coordinates in the image file where the custom icons grid starts.
- *iconsize=""* : Define the resolution of your Icons by giving the size (width & height) of each cell/grid/icon in pixels (default is 64).
- *nb=""* : The number of total icons in your grid.
- *nbx=""* : The number of columns in the grid (how many icons are in each line). The number of rows of the grid will be auto-calculated by nb/nbx.

  
  
**Example:**  
```
<customicons file="mycustomicons.png" x="0" y="0" iconsize="64" nb="144" nbx="16"/>
```
  
  
**Note:** If you want to change/edit just a few of the default Icons, point to a part of your image with your Grid in transparent background and provide only those Icons in the Grid. If no Icon is provided in that Grid, the default Icon will be used.  
  
**Using Icons in your skin:**  
Except from the VirtualDJ Browser, some of the Default or Custom Icons can be called by their name (*sysicon* property) , be colored and resized to any size needed inside your skin.  
  
**Example :**  
```
<button action="loop_half" >
	....
	....
	<icon sysicon="arrowleft" width="32" height="32" />
<button>
```
  
  
See further details about Icons and **sysicon** names in [Default Icons](https://www.virtualdj.com/wiki/Skin%20Default%20Icons.html)  
  

---

  

[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)