---
title: "VirtualDJ - VDJPedia - Skin Rhythmzone"
source: "https://www.virtualdj.com/wiki/Skin%20Rhythmzone.html"
author:
  - "[[VirtualDJ Website]]"
published:
created: 2025-02-17
description: "With over 100,000,000 downloads, VirtualDJ packs the most advanced DJ technology. Both perfect to start DJing, and perfect for advanced pro DJs."
tags:
  - "clippings"
---
[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)

  
**Skin SDK: The *<rhythmzone>* element**

---

---

  
  
The rhythmzone element defines where and how the rhythm curves will be displayed. It is much easier and has a lot more options than the *rhythm* element. It has been updated in version 8 to eliminate the need for mask and up images - instead these are replaced by *fade* and *<overlay>*. You can also use *center* to define the centre of the rhythmzone.  
  
The syntax of the rhythmzone element is *<rhythmzone mirror="" upsidedown="" fade="" center="" visibility="" os="">*.  
  
**Properties:**

- *upsidedown="true|false"* : (false by default). If set to "true" , the wave will be inverted on the X Axis.
- *mirror="true|false"* : (false by default). If set to "true", a mirrored wave will be placed below the current (at X axis)
- *fade=""* :Provide the width in pixels that the waves will fade to black on both sides. E.g. *fade="100"* will provide an area of 100 pixels in width on both sides, where the waves will gradually to black.
- *center="" :* Provide the X position of the center of the wave. Helpful if you need to create an off-center rhtyhmzone. If not defined, the center will be automatically placed at the *width/2 +Xpos* of the rhtyhmwave
- *visibility* : Set to *true|false* or provide a VDJ script action that returns true or false, to specify when the element will be visible or not.
- *os* : use *os="mac"* or *os="pc"* if you need to display the element only when VirtualDJ is running on Window or Mac Do not include os="" if you want the element to be displayed on both platforms.

All Properties are **optional**  
  
**Children:**

- *<size width="" height="">* : Give the width and height of the rhythm window
- *<pos x="" y="">* : give the position of the rhythm window on the screen
- *<colors chanX="" chanX\_left="" chanX\_right="" chanX\_active="">* : give the color in HTML format to be used for each channel, X is the number of the channel. There should be as many chanX parameters as waves you want to display. "transparent", "black" and "#000000" waves are ignored.
- *<rhythm y="" height="">* : give the vertical position and height of the waves.
- *<grid height="" width="" mainwidth="">* : Set up the CBG (computed beat grid) for the all channels. The *<grid>* element has these sub-elements :  
\[list\]
- *<pos y1="" y2="" yX="">* : give the vertical position of all grids

- *<cue y="" height="">* : give the vertical position and height of the cue marker. The *<cue>* element has these sub-elements :  
- *<mask x="" y"" width="" height="">* : give the position and size of the cue mask
- *<text dx="" dy="" color="" ...>* : set the position and color of the cue text (see <textzone>)
- *<overlay>* : give the position and size of the play marker (central line) and the color (background). The *<overlay>* element has these sub-elements :  

- *<pos x="" y="">* : give the position of the play marker.
- *<size width="" height="">* : Give the width and height of the play marker.
- *<background x="" y="">* : Give the position of the background color. The height size is taken from the line above.

\[/list\]  
*Example:*  
```
<rhythmzone mirror="false" upsidedown="false" fade="200">
 <size width="1910" height="88"/>
 <pos x="5" y="35"/>
 <colors deck1="#007097" deck2="#8c0709" deck1_active="#00ABEB" deck2_active="#F40000" />
 <rhythm y="+0" height="75"/>
 <grid height="6" width="6" mainwidth="10">
   <pos y1="76" y2="82"/>
 </grid>
 <cue y="+0" height="88">
   <text dx="15" dy="-1" size="14" />
   <mask width="26" height="88 " x="684" y="1389"/>
 </cue>
 <overlay>
   <size width="3" height="88"/>
   <pos x="1920/2" y="35"/>
   <background x="715" y="1395"/>
 </overlay>
</rhythmzone>
```
  
  

---

  

[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)