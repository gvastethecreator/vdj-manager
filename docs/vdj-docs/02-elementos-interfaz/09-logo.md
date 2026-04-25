---
title: "VirtualDJ - VDJPedia - Skin Logo"
source: "https://www.virtualdj.com/wiki/Skin%20Logo.html"
author:
  - "[[VirtualDJ Website]]"
published:
created: 2025-02-17
description: "With over 100,000,000 downloads, VirtualDJ packs the most advanced DJ technology. Both perfect to start DJing, and perfect for advanced pro DJs."
tags:
  - "clippings"
---
[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)

  
**Skin SDK: The *<logo>* element**

---

---

  
  
Positions and sizes the VirtualDJ logo on your skin. The minimum size for the logo is defined by the skin resolution. What might be OK at a high resolution could cause issues at a lower resolution.  
  
**Syntax:**  
<**logo** circle"" os="">  
  
**Inherited Attributes** :  
*visibility="" os="" panel=""*  
See [Global Element Attributes](https://www.virtualdj.com/wiki/Skin%20Element%20Properties.html)  
  
**Attributes** :  

- *circle="false|true" (optional)* : If set to true, the logo will be drawn in a (red) circle.

  
  
**Children:**  

- *<pos x="" y=""/>* : Give the (x,y) position that the button will have on the screen. Read further details in [Skin Element Position](https://www.virtualdj.com/wiki/Skin%20Element%20Positioning.html)
- *<size width="" height=""/>* : Give the width and the height that the button will have on the screen. Read further details in [Skin Element Position](https://www.virtualdj.com/wiki/Skin%20Element%20Positioning.html)

  
  
**Examples:**  
  
```
<logo>
	<pos x="0" y="0"/>
	<size width="100" height="30"/>
</logo>
```
  
  
  
```
<logo circle="true">
	<pos x="100" y="100"/>
	<size width="50" height="50"/>
</logo>
```
  
  

![](https://www.virtualdj.com/img/348363/3567/LogoCircular.png)

  

Result with circle="true"

  
  

---

  

[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)