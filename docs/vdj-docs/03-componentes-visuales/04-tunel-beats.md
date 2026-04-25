---
title: "VirtualDJ - VDJPedia - Skin BeatTunnel"
source: "https://www.virtualdj.com/wiki/Skin%20BeatTunnel.html"
author:
  - "[[VirtualDJ Website]]"
published:
created: 2025-02-17
description: "With over 100,000,000 downloads, VirtualDJ packs the most advanced DJ technology. Both perfect to start DJing, and perfect for advanced pro DJs."
tags:
  - "clippings"
---
[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)

  
**Skin SDK: The *<beattunnel>* element**

---

---

  
Create a Beat-Move Tunnel visualization, without any skin graphics.  
  
**Attributes:**  

- *color=""* : Define the color of the Beat-Tunnel rings. Can take HTML, RGB, ARGB or pre-defined colors (green, red, blue etc). See [Color Definitions](https://www.virtualdj.com/wiki/Skin%20Default%20Colors.html)
- *depth=""* : Define how far in the future is the center ring (integer in milli-seconds). E.g.depth="4000" is 4 seconds which is around 8 beats (at 120 bpm)

  
**Children:**  

- *<pos x="" y=""/>* : Define the position (X, Y coordinates in pixels) for the element to be displayed inside the skin. Read further [Skin Element Position](https://www.virtualdj.com/wiki/Skin%20Element%20Positioning.html)
- *<size width="" height=""/>* : Define the width and height of the element. For round beat-tunnel, makes sense to have the same width and height, but you could also create ovals if differ.

  
  
**Example:**  
  
```
<beattunnel depth="4000" color="#00AAFF">
	<pos x="30" y="200"/>
	<size width="250" height="250"/>
</beattunnel>
```
  
  
  
  

---

  

[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)