---
title: "VirtualDJ - VDJPedia - Split Window"
source: "https://www.virtualdj.com/wiki/Split%20Window.html"
author:
  - "[[VirtualDJ Website]]"
published:
created: 2025-02-17
description: "With over 100,000,000 downloads, VirtualDJ packs the most advanced DJ technology. Both perfect to start DJing, and perfect for advanced pro DJs."
tags:
  - "clippings"
---
[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)

  
**Skin SDK: The *<window>* element**

---

---

  
The idea behind this is to allow elements of the skin to be displayed in a floating and resizable window on top of the main skin. You can choose the size and position of the window and also whether the user can resize the window on-the-fly.  
  
In order to use the <window> element you will need to have the graphics for the window element in a separate image file to that of the main skin.  
  
You will the use the below code:  
```
 <window name="window" width="500" height="500" posx="11" posy="545" image="browser_windowed" shown="false">

  place element code to be displayed within the window here

</window>
```
The above code should be familiar - the additions here are *posx* and *posy*, this is where the window should be positioned on the screen. Also the *image*, this is simply the name of the image file (no extension is required e.g. png).  
  
You can use the <background> element to specify a position within the image file, for example:  
  
```
 <window name="window" width="500" height="500" posx="11" posy="545" shown="false">
  <background x="12" y="559"/>

  place element code to be displayed within the window here

</window>
```
  
  
Once you have included the window, you will need to add buttons in order to display or hide the window.  
```
<button action="show_window 'window'">
```
This code toggles the window on and off.  
  
By default this window will be resizable - you can use the parameter resize to disable this:  
```
 <window name="window" width="500" height="500" posx="11" posy="545" shown="false" resize="false">
</window>
```
  
  
  

---

  

[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)