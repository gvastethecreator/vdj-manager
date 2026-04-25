---
title: "VirtualDJ - VDJPedia - Skin ResizeZone"
source: "https://www.virtualdj.com/wiki/Skin%20ResizeZone.html"
author:
  - "[[VirtualDJ Website]]"
published:
created: 2025-02-17
description: "With over 100,000,000 downloads, VirtualDJ packs the most advanced DJ technology. Both perfect to start DJing, and perfect for advanced pro DJs."
tags:
  - "clippings"
---
[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)

  
**Skin SDK: The *<resizezone>* element**

---

---

  
A resizezone defines a zone that can be used to resize VirtualDJ's window if it is not maximized.  
  
**Syntax**: *<resizezone>*  
  
**Attributes:** None  
  
**Children:**  

- *<pos x="" y="">* : Give the (x,y) position the resize zone will have on the screen. Read further details in [Skin Element Position](https://www.virtualdj.com/wiki/Skin%20Element%20Positioning.html)
- *<size width="" height=""/>* : Give the width and the height that the resize zone will have on the screen. Read further details in [Skin Element Position](https://www.virtualdj.com/wiki/Skin%20Element%20Positioning.html)

  
**Example:**  
  
```
<resizezone>
	<pos x="1920-20" y="1080-20"/>
	<size width="20" height="20"/>
</resizezone>
```
  
  

---

  

[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)