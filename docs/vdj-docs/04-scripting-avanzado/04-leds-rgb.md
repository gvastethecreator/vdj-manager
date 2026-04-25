---
title: "VirtualDJ - VDJPedia - RGB Leds"
source: "https://www.virtualdj.com/wiki/rgbleds.html"
author:
  - "[[VirtualDJ Website]]"
published:
created: 2025-02-18
description: "With over 100,000,000 downloads, VirtualDJ packs the most advanced DJ technology. Both perfect to start DJing, and perfect for advanced pro DJs."
tags:
  - "clippings"
---
[Back to VDJ Script Examples](https://www.virtualdj.com/wiki/VDJScript%20Examples.html)

  
**RGB Leds in VirtualDJ**

---

  
  
VirtualDJ offers the ability to define the color of an RGB led in a much more user-friendly way.  
The color is defined using the *color 'text'* action and expects a text of :  

  
- a pre-defined color (such as .. red, green, blue, white, yello, orange etc. See table below)
- a HTML color hexadecimal code e.g. #FF0000, #909090 etc
- a RGB or ARGB color code e.g. 255,0,0 or 127,255,0 etc.

  
**List of pre-defined colors :**  
"red",ARGB(255,255,0,0),  
"green",ARGB(255,0,255,0),  
"blue",ARGB(255,0,0,255),  
"white",ARGB(255,255,255,255),  
"black",ARGB(255,0,0,0),  
"yellow",ARGB(255,255,255,0),  
"cyan",ARGB(255,0,255,255),  
"magenta",ARGB(255,255,0,255),  
"gray",ARGB(255,127,127,127),  
"transparent",ARGB(0,0,0,0)  
"orange",ARGB(255,255,127,0),  
"darkred",ARGB(255,127,0,0),  
"darkgreen",ARGB(255,0,127,0),  
"darkblue",ARGB(255,0,0,127),  
"darkyellow",ARGB(255,127,127,0),  
"darkcyan",ARGB(255,0,127,127),  
"darkmagenta",ARGB(255,127,0,127),  
"darkorange",ARGB(255,127,63,0),  
  
Examples :  
  
```
color 'red'
```
  
result : Led turns on red constantly  
  
```
blink ? color '#FF0000' : off 
```
  
result : Led will blink between red and off  
  
```
play ? color 'green' : off
```
  
result : Led will turn on green if track is playing and turn off if paused.  
  
```
effect_active ? blink ? color 'blue' : color 'yellow' : color 'yellow'
```
  
result: If Effect is active, Led will blink between blue and yellow, and if Effect not active will turn on yellow constantly  
  
**Note :**  
Keep in mind that some units do not offer "real" RGB Leds (e.g. they offer 64 or even less colors). VirtualDJ will tend to use the closest color from the available ones in order match the assigned color, the best way possible. (E.g if you try to assign a Cyan color to a LED that only offers Blue , the Blue will be used if the Led is assigned as Cyan)  
  

---

  

[Back to VDJ Script Examples](https://www.virtualdj.com/wiki/VDJScript%20Examples.html)