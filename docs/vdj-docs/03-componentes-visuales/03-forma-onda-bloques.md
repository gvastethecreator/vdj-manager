---
title: "VirtualDJ - VDJPedia - Skin BlockWave"
source: "https://www.virtualdj.com/wiki/Skin%20BlockWave.html"
author:
  - "[[VirtualDJ Website]]"
published:
created: 2025-02-17
description: "With over 100,000,000 downloads, VirtualDJ packs the most advanced DJ technology. Both perfect to start DJing, and perfect for advanced pro DJs."
tags:
  - "clippings"
---
[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)

  
**Skin SDK: The *<blockwave>* element**

---

---

  
Create a Block-style monochrome Waveform without any skin graphics. This kind of waveform is used in the default Video skins of VirtualDJ 2018  
  
**Syntax** : *<blockwave color="" blocksize="" zoom="" center="" deck="" panel="" visibility="" os="">*  
  
**Inherited Attributes** :  
*visibility="" os="" panel="" deck=""*  
See [Global Element Attributes](https://www.virtualdj.com/wiki/Skin%20Element%20Properties.html)  
  
**Attributes:**  

- *color=""* : Define the color of the blocks in the waveform. Can take HTML, RGB, ARGB or pre-defined colors (green, red, blue etc). See [Color Definitions](https://www.virtualdj.com/wiki/Skin%20Default%20Colors.html)
- *blocksize=""* : Define the actual width in pixels (integer) of the blocks in the waveform. The space between each block is hard-coded to 1:1
- *zoom=""* : Define (integer value) how many samples are in one block. zoom=1 means 80 blocks per seconds, zoom=2 means 40 blocks per seconds etc) . zoom="4" is used in the default VirtualDJ 2018 Video-skins.
- *center="middle"* : Optionally use this parameter to center the *blockwave* (current position at the middle). If not used, the *blockwave* will be left-aligned, so the current position will be the far left edge.

  
**Children:** :  

- *<pos x="" y=""/>* : Define the position (X, Y coordinates in pixels) for the element to be displayed inside the skin. Read further in [Skin Element Position](https://www.virtualdj.com/wiki/Skin%20Element%20Positioning.html)
- *<size width="" height=""/>* : Define the width and height of the element.

  
  
**Example:**  
  
```
<blockwave deck="left" blocksize="5" zoom="4" color="#0d86e3" center="middle">
	<pos x="5" y="10" />
	<size width="1280" height="150"/>
</blockwave>
```
  
  
  
  

---

  

[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)