---
title: "VirtualDJ - VDJPedia - Skin Font"
source: "https://www.virtualdj.com/wiki/Skin%20Font.html"
author:
  - "[[VirtualDJ Website]]"
published:
created: 2025-02-17
description: "With over 100,000,000 downloads, VirtualDJ packs the most advanced DJ technology. Both perfect to start DJing, and perfect for advanced pro DJs."
tags:
  - "clippings"
---
[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)

  
**Skin SDK: The *<font>* element**

---

---

  
This element defines the font to be used for the skin, or an element when used as a child to a supported element.  
  
**Attributes :**  

  
- *size* : the size of the font
- *name* | *font* : the face name of the font
- *weight="bold"* : use the bold font weight

  
**Children:** None  
  
**Example:**  
  
```
<font name="Arial" size="20" weight="bold"/>
```
  
  
**Other Uses:**  
  
The same syntax is also used by variants of the <font> element:  
  
Other variations of <font> are used by the skin engine. <fontsearch> is used by the search box of the browser and <edit> controls. There are also these that are used by the browser - <fontheader>, <fontgridtitle>, <fonttoolbar> and <fontplugins>. All have the same syntax as <font> with the exception that ***font*** is used as Attribute instead of *name*  
  
**Example:**  
  
```
<fontgridtitle font="Arial" size="18" weight="bold"/>
```
  
  
  
  

---

  

[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)