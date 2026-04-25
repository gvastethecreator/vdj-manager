---
title: "VirtualDJ - VDJPedia - Use a combination of buttons to trigger two different actions"
source: "https://www.virtualdj.com/wiki/useacombinationofbuttonstotriggertwodifferentactions.html"
author:
  - "[[VirtualDJ Website]]"
published:
created: 2025-02-18
description: "With over 100,000,000 downloads, VirtualDJ packs the most advanced DJ technology. Both perfect to start DJing, and perfect for advanced pro DJs."
tags:
  - "clippings"
---
To use a combination of buttons to trigger two different actions (I.e: **SHIFT** button):  
  
VDJscript for the button that will act as the modifier, i.e: **SHIFT**:  
  
```
set '$shift' 1 while_pressed
```
  
  
Button to perform two different actions depending on the state of **SHIFT** button, e.g: **FX**:  
  
```
var '$shift' ? effect_active 'backspin' : effect_active 'Flanger'
```
  
  
*This causes the button to trigger flanger on its own, and backspin if SHIFT+button is pressed.*  
  
  
[Return to VDJscript examples...](https://www.virtualdj.com/wiki/VDJScript%20Examples.html)