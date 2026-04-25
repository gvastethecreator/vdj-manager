---
title: "VirtualDJ - VDJPedia - Skin Scratchwave"
source: "https://www.virtualdj.com/wiki/Skin%20Scratchwave.html"
author:
  - "[[VirtualDJ Website]]"
published:
created: 2025-02-17
description: "With over 100,000,000 downloads, VirtualDJ packs the most advanced DJ technology. Both perfect to start DJing, and perfect for advanced pro DJs."
tags:
  - "clippings"
---
[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)

  
**Skin SDK: The *<scratchwave>* element**

---

---

  
*Availability: v8.0 onwards*  
  
Displays the scratch waveform.  
  
**Parameters:**  

  
- *orientation*: horizontal or vertical
- *color*: The primary color for the waveform. Default: full
- *color2*: The secondary color for the waveform. Only used if the primary is not full.

  
**Children:**  

  
- *<grid mainsize="" size="" height="" pos="" maincolor="" color="" transparency="" mirrored="" background="" backgroundcolor="" backgroundshaded=""/>* **v8.2 or later required**  
  
Displays the CBG grid on the scratchwave. Parameters:  

  
- *mainsize*: The size of the marker for first beat of 4
- *size*: The size of the marker for the remaining 3 beats
- *height*: The height of the grid marker. If vertical, then this actually refers to the width.
- *pos*: The position offset from the boundary
- *maincolor*: The color of the first beat of 4
- *color*: The color of the remaining 3 beats
- *transparency*: The transparency level of the CBG grid (0 to 1)
- *mirrored*: If set to yes then the grid markers are mirrored onto the other size of the waveform
- *background*: If set to yes then the background of the scratchwave will be shaded according to the beat
- *backgroundcolor*: The color to use for the shading of 'background'. Default is white.
- *backgroundshaded*:
- *<cue y="" height=""><text dx="" dy="" size=""/><mask width="" height="" x="" y=""/></cue>*
- *<overlay/>*

  
**Example:**  
  
```
<scratchwave deck="left" orientation="horizontal">
<pos x="10" y="100" width="1900" height="60"/>
   <grid mainsize="3" size="1" height="10" pos="0" maincolor="#008ce1" color="white" transparency="1" mirrored="true" background="yes"/>
   <cue y="+0" height="60">
    <text dx="10" dy="-3" size="14" />
    <mask width="12" height="92" x="942" y="1372"/>
   </cue>   
  </scratchwave>
```
  
  

---

  

[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)