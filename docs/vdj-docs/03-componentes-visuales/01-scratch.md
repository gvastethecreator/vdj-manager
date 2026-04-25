---
title: "VirtualDJ - VDJPedia - Skin scratch"
source: "https://www.virtualdj.com/wiki/Skin%20scratch.html"
author:
  - "[[VirtualDJ Website]]"
published:
created: 2025-02-17
description: "With over 100,000,000 downloads, VirtualDJ packs the most advanced DJ technology. Both perfect to start DJing, and perfect for advanced pro DJs."
tags:
  - "clippings"
---
[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)

  
**Skin SDK: The *<scratch>* element**

---

---

  
The scratch element defines a zone where the user can scratch using the mouse.  
  
**Syntax** : *<scratch visibility="" os="" panel="" deck="">*.  
  
**Inherited Attributes** :  
*visibility="" os="" panel="" deck=""*  
See [Global Element Attributes](https://www.virtualdj.com/wiki/Skin%20Element%20Properties.html)  
  
**Children :**  

- *<pos x="" y="">* : Give the position of the scratch zone on the screen. Read further details in [Skin Element Position](https://www.virtualdj.com/wiki/Skin%20Element%20Positioning.html)
- *<size width="" height="">* : Give the width and height of the scratch zone.
- *<mousemask x="" y="">* : Give the coordinate of the B&W graphic that should be used as a mask to decide if the mouse is over the scratch zone
- *<mouserect x="" y="" width="" height="">* : Set a simple rect zone as a mouse mask
- *<mousecircle x="" y="" r="">* : Set a simple circle zone as a mouse mask
- *<center x="" y="">* : Give the center of the circular mouse movement

  
  
**Example**:  
```
<scratch deck="left">
	<pos  x="573" y="166"/>
	<size width="227" height="227"/>
	<mousecircle x="687" y="280" r="114"/>
</scratch>
```
  
  

---

  

[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)