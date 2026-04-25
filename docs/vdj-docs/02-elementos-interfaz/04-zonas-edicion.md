---
title: "VirtualDJ - VDJPedia - Skin Edit"
source: "https://www.virtualdj.com/wiki/Skin%20Edit.html"
author:
  - "[[VirtualDJ Website]]"
published:
created: 2025-02-17
description: "With over 100,000,000 downloads, VirtualDJ packs the most advanced DJ technology. Both perfect to start DJing, and perfect for advanced pro DJs."
tags:
  - "clippings"
---
[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)

  
**Skin SDK: The *<edit>* element**

---

---

  
This element creates a custom search box in the skin.  
  
**Syntax** : *<edit>*  
  
**Attributes :** None  
  
**Children:**  

- *<pos x="" y=""/>* : Give the position of the element on the screen. Read further details in [Skin Element Position](https://www.virtualdj.com/wiki/Skin%20Element%20Positioning.html)
- *<size width="" height=""/>* : Give the width and height of the element. Read further details in [Skin Element Position](https://www.virtualdj.com/wiki/Skin%20Element%20Positioning.html)
- *<font size="" name=""/>* : Define the font for the Search/Edit Browser area. See [font](https://www.virtualdj.com/wiki/Skin%20Font.html).
- *<colors background="" border="" selected="" text="" cursor="" />* : The color attributes. See example for default values. More info about Colors in [Pre-defined Colors](https://www.virtualdj.com/wiki/Skin%20Default%20Colors.html)

  
**Example:**  
  
```
<edit>
	<pos x="0" y="50"/>
	<size width="100" height="20"/>
	<font size="20" name="Arial"/>
	<colors background="#1F1F1F" border="#7A7A7A" selected="#717171" text="#FFFFFF" cursor="#FFFFFF"/>
</edit>
```
  
  

![](https://www.virtualdj.com/image/87064/178859/edit.png)

  
  

---

  

[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)