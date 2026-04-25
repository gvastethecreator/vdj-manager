---
title: "VirtualDJ - VDJPedia - Skin Default Colors"
source: "https://www.virtualdj.com/wiki/Skin%20Default%20Colors.html"
author:
  - "[[VirtualDJ Website]]"
published:
created: 2025-02-18
description: "With over 100,000,000 downloads, VirtualDJ packs the most advanced DJ technology. Both perfect to start DJing, and perfect for advanced pro DJs."
tags:
  - "clippings"
---

> **Actualización 2026-03-26:** esta tabla sigue siendo útil para los nombres de colores predefinidos del Skin SDK, pero la referencia oficial más completa y vigente para el ecosistema actual de colores está en `https://www.virtualdj.com/manuals/virtualdj/appendix/defaultcolors.html`. Allí se documentan también los modos de `colorPicker` (`Auto`, `Gradient`, `Simple`, `System`) y el uso de valores `Hex`, `RGB` y nombres comunes de color.

[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)

**Skin SDK: Skin Colors**

---

---

Colors for texts, fills, borders etc can be defined using HTML (#AARRGGBB in hexadecimal ) or RGB (R,G,B in decimal ) values , pre-defined colors (green, red, blue etc) or even VDJ Script actions that return a color.  
  
**HTML** colors should start with the **\#** character, followed by..

- 2 digits for the hex value of Alpha for transparency (from 00 to FF)
- 2 digits for the hex value of Red (hexadecimal value from h00 to hFF) (Optional. If not defined, colors will be displayed as solid ones).
- 2 digits for the hex value of Green (hexadecimal value from h00 to hFF)
- 2 digits for the hex value of Blue (hexadecimal value from h00 to hFF)

If the #value has 6 digits, no transparency will be applied, so *color="#20FF0000"* is a semi-transparent red while *color="#20FF00"* is green-ish color.  
  
**RGB** colors should follow the pattern R,G,B where..

- R is the value for Red (decimal value from 0 to 255)
- G is the value for Green (decimal value from 0 to 255)
- B is the value for Blue (decimal value from 0 to 255)

E.g. *color="255,0,0"* for red , *color="0,0,255"* for blue and *color="255,255,0"* for yellow.  
  
**Color Actions**

---

In some cases you can use VDJ Script actions that return a color as value.  
  
In the following example, the *source* attribute expects an action that returns a color :  

```
<visual type="color" source="pad_color 1">
 <pos x="+19" y="+23"/>
 <size width="24" height="2"/>
</visual>
```
  
In the following example, the *color*attribute expects a color value/text/shortcut and not an action, thus the action is surrounded by \` (back tilt) characters :  

```
<textzone >
 <size width="70-25-10" height="20"/>
 <pos x="+6+25+10" y="+6"/>
 <text fontsize="15" color="\`get_key_color\`" weight="bold" align="right" action="get_key"/>
</textzone>
```
  
**Pre-defined Colors in VirtualDJ**

---

VirtualDJ Skin SDK provides the ability to use one of the pre-defined colors by using its text. E.g. *color="red"* (equal to *color=""#FF0000"* or *color="255,0,0"*) or *color="darkblue"* (equal to *color=""#00007F"* or *color="0,0,128"*)  
  
| Color Name | ARGB value | HTML hex value |
| --- | --- | --- |
| red | ARGB(255, 255, 0, 0) | #FF0000 |
| green | ARGB(255, 0, 255, 0) | #00FF00 |
| blue | ARGB(255, 0, 0, 255) | #0000FF |
| white | ARGB(255, 255, 255, 255) | #FFFFFF |
| black | ARGB(255, 0, 0, 0) | #000000 |
| yellow | ARGB(255, 255, 255, 0) | #FFFF00 |
| cyan | ARGB(255, 0, 255, 255) | #00FFFF |
| magenta | ARGB(255, 255, 0, 255) | #FF00FF |
| gray | ARGB(255, 127, 127, 127) | #7F7F7F |
| orange | ARGB(255, 255, 127, 0) | #FF7F00 |
| darkred | ARGB(255, 128, 0, 0) | #7F0000 |
| darkgreen | ARGB(255, 0, 128, 0) | #007F00 |
| darkblue | ARGB(255, 0, 0, 128) | #00007F |
| darkyellow | ARGB(255, 128, 128, 0) | #7F7F00 |
| darkcyan | ARGB(255, 0, 128, 128) | #007F7F |
| darkmagenta | ARGB(255, 128, 0, 128) | #7F007F |
| darkorange | ARGB(255, 128, 63, 0) | #7F3F00 |
| darkgray | ARGB(255, 100, 100, 100) | #646464 |
| lightgray | ARGB(255, 216, 216, 216) | #D8D8D8 |
| pink | ARGB(255, 230, 150, 150) | #E69696 |
| beige | ARGB(255, 255, 255, 200) | #FFFFC8 |
| marine | ARGB(255, 74, 134, 230) | #4A86E6 |
| violet | ARGB(255, 150, 0, 255) | #9600FF |
| transparent | ARGB(0, 0, 0, 0) | #000000 |
| none | ARGB(0, 0, 0, 0) | #000000 |
| reset | ARGB(0, 0, 0, 0) | #000000 |

The following code will display a button with gray fill and light gray border when off (play\_pause returns false = deck is stopped) and green fill with white border when on (play\_pause returns true = deck is playing)  
  
```
<button action="play_pause">
 ....
 ....
 <off color="#404040" border="#AAAAAA" border_size="2" />
 <on color="green" border="white" border_size="2" />
<button>
```
  
**Custom defined Colors**

---

You can also define your own custom colors and later use their name in your code. See [<define>](https://www.virtualdj.com/wiki/Skin%20Define.html)  
  
**Example:**  

```
<!-- Define the color here -->
<define color="myoffcolor" value="#156c89" deck="1"/>
....
....
<deck deck="1">
 <button action="play_pause">
  ....
  ....
  <off color="myoffcolor" /> <!-- use the defined color here -->
 <button>
</deck>
```
  
---

[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)
