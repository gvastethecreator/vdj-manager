---
title: "VirtualDJ - VDJPedia - Skin Draws"
source: "https://www.virtualdj.com/wiki/Skin%20Draws.html"
author:
  - "[[VirtualDJ Website]]"
published:
created: 2025-02-17
description: "With over 100,000,000 downloads, VirtualDJ packs the most advanced DJ technology. Both perfect to start DJing, and perfect for advanced pro DJs."
tags:
  - "clippings"
---
[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)

  
**Skin SDK: The *<square>* , *<circle>* and *<line>* elements**

---

---

  
You can draw graphics (squares, lines, circles etc) inside a skin, without adding them to the graphics file  
  
**Syntax**: *<square|circle|line color="" radius="" border="" border\_color="" highlight="" shadow="" visibility="" os="" panel="" deck="" >*  
  
**Inherited Attributes**:  
*visibility="" os="" panel="" deck=""*  
See [Global Element Attributes](https://www.virtualdj.com/wiki/Skin%20Element%20Properties.html)  
  
**Attributes:**  

- *color=""* : Define the fill color. Can take HTML, RGB, ARGB or pre-defined colors (green, red, blue etc). For semi-transparent fill, you can use either ARGB/HTML e.g color="#60FF0000" or color="#FF0000" visibility="40%" See [Colors](https://www.virtualdj.com/wiki/Skin%20Default%20Colors.html)
- *radius="" (optional)* : (for <square>) Define a value in pixels, to create a rectangle with rounded corners.
- *border="" (optional)* : Define the width of the border in pixels (0 for no border - default if not used).
- *border\_color=""* : Define the color of the border. See [Colors](https://www.virtualdj.com/wiki/Skin%20Default%20Colors.html)
- *highlight=""* : For <line>. Define the color of the highlight. See [Colors](https://www.virtualdj.com/wiki/Skin%20Default%20Colors.html)
- *shadow=""* : For <line>. Define the color of shadow. See [Colors](https://www.virtualdj.com/wiki/Skin%20Default%20Colors.html)

  
**Children:**  

- *<pos x="" y=""/>* : Define the position (X, Y coordinates in pixels) for the element to be displayed inside the skin. Read further details for [Skin Element Position](https://www.virtualdj.com/wiki/Skin%20Element%20Positioning.html)
- *<size width="" height=""/>* : Define the width and height of the element. For <circle>, makes sense to have the same width and height, but you could also create ovals if differ.
- *<gradient/>* : Add a <gradient> child to get gradient fill color instead of solid (as defined in color=""). The gradient can take the following attributes  
\[list\]
- *type="horizontal|vertical|circular"* : Define the gradient type
- *color1=""* : Define the start color of the gradient (top color for vertical, left color for horizontal, middle color for circular)
- *color2=""* : Define the end color of the gradient (bottom color for vertical, right color for horizontal, outer color for circular)

If a <gradient> is defined, the color="" attribute will not be taken into account\[/list\]  
  
**Note:** You could create horizontal/vertical lines using <square> with a small value for height/width, but it's much preferrable to use <line> in order those to be displayed properly on large skin resizes.  
  
**Examples:**  
```
<!-- a 200x100 square with rounded corners, yellow 2px border and a vertical gradient (red to blue) fill -->
<square border="2" border_color="yellow" radius="20" >
	<pos x="400" y="5"/>
	<size width="200" height="100"/>
	<gradient type="vertical" color1="red" color2="blue"/>
</square>

<!-- A blue circle of 250 pixels with a blue 2px border width-->
<circle color="#0000FF"  border="2" border_color="red" >
	<pos x="30" y="30"/>
	<size width="250" height="250"/>
</circle>	

<!-- Draw a line with shadow -->
<line x="195" y="40" width="140" height="4" highlight="#101010" shadow="#707070"/>
```
  
  
**Note**: Prefer using <line> for vertical/horizontal lines instead of <square>, as those will retain their width/height properly when skin is up/down-resized and will still be displayed as lines and not as thicker/thinner squares.  
  
  
  

---

  

[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)