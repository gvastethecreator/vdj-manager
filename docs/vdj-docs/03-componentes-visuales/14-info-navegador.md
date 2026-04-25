---
title: "VirtualDJ - VDJPedia - Skin BrowserInfo"
source: "https://www.virtualdj.com/wiki/Skin%20BrowserInfo.html"
author:
  - "[[VirtualDJ Website]]"
published:
created: 2025-02-17
description: "With over 100,000,000 downloads, VirtualDJ packs the most advanced DJ technology. Both perfect to start DJing, and perfect for advanced pro DJs."
tags:
  - "clippings"
---
[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)

  
**Skin SDK: The *<browserinfo>* element**

---

---

  
This element allows the use of a info panel, the same as the one in the default skin.  
  
**Syntax** : *<browserinfo>*  
  
**Attributes :** None  
  
**Children:**  

- *<pos x="" y=""/>* : Give the position of the element on the screen. Read further details in [Skin Element Position](https://www.virtualdj.com/wiki/Skin%20Element%20Positioning.html)
- *<size width="" height=""/>* : Give the width and height of the element. Read further details in [Skin Element Position](https://www.virtualdj.com/wiki/Skin%20Element%20Positioning.html)
- *<font size="" name=""/>* : Define the font for the Info Browser panel See [font](https://www.virtualdj.com/wiki/Skin%20Font.html).
- *<colors background="" stripes="" text="" label="" artist="" title="" />*: See example with the default values. More info about Colors in [Pre-defined Colors](https://www.virtualdj.com/wiki/Skin%20Default%20Colors.html)

  
**Example:**  
  
```
<browserinfo>
	<pos x="0" y="50"/>
	<size width="600" height="300"/>
	<font size="20" name="Arial"/>
	<colors background="#393939" stripes="#303030" text="#FFFFFF" label="#A0A0A0" artist="#D5D5D5" title="#FFFFFF"/>
</browserinfo>
```
  
  

![](https://www.virtualdj.com/image/64585/178852/browserinfo.png)

  
  
  

---

  

[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)