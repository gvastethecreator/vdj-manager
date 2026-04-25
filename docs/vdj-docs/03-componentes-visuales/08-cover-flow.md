---
title: "VirtualDJ - VDJPedia - Skin CoverFlow"
source: "https://www.virtualdj.com/wiki/Skin%20CoverFlow.html"
author:
  - "[[VirtualDJ Website]]"
published:
created: 2025-02-17
description: "With over 100,000,000 downloads, VirtualDJ packs the most advanced DJ technology. Both perfect to start DJing, and perfect for advanced pro DJs."
tags:
  - "clippings"
---
[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)

  
**Skin SDK: The *<coverflow>* element**

---

---

  
This element allows the use of a coverflow panel, the same as the one at the top of the file list in the default browser. The mode uses the Config.coverFlow setting. If this setting is set to *no* then it will use the smart mode.  
  
**Attributes :** None  
  
**Children:**  

- *<pos x="" y="" />* : Give the (x,y) position that the coverflow will have on the screen. Read further in [Skin Element Position](https://www.virtualdj.com/wiki/Skin%20Element%20Positioning.html)
- *<size width="" height=""/>* : Give the width and height that the coverflow will have on the screen.

  
  
**Example:**  
  
```
<coverflow>
	<pos x="0" y="50"/>
	<size width="600" height="200"/>
</coverflow>
```
  
  

![](https://www.virtualdj.com/image/5889/178854/coverflow.png)

  
  

---

  

[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)