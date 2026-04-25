---
title: "VirtualDJ - VDJPedia - Skin Prelisten"
source: "https://www.virtualdj.com/wiki/Skin%20Prelisten.html"
author:
  - "[[VirtualDJ Website]]"
published:
created: 2025-02-17
description: "With over 100,000,000 downloads, VirtualDJ packs the most advanced DJ technology. Both perfect to start DJing, and perfect for advanced pro DJs."
tags:
  - "clippings"
---
[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)

  
**Skin SDK: The *<prelisten>* element**

---

---

  
The Prelisten Player is part of the [<browser>](https://www.virtualdj.com/wiki/Skin%20Browser.html) and/or [<browserinfo>](https://www.virtualdj.com/wiki/Skin%20Browserinfo.html) elements, but can be included and placed in a skin at a different position using the <prelisten> skin element.  
  
**Syntax** : *<prelisten>*  
  
**Attributes :** None  
  
**Children:**  

- *<pos x="" y=""/>* : Give the position of the element on the screen. Read further details in [Skin Element Position](https://www.virtualdj.com/wiki/Skin%20Element%20Positioning.html)
- *<size width="" height=""/>* : Give the width and height of the element. Read further details in [Skin Element Position](https://www.virtualdj.com/wiki/Skin%20Element%20Positioning.html)
- *<colors background="" border="" selected="" cursor="" button="" buttonbackground="" buttonselected="" />*: See example with the default values. More info about Colors in [Pre-defined Colors](https://www.virtualdj.com/wiki/Skin%20Default%20Colors.html)  
Note: <colors> is optional. If no <colors> (or <color>) is defined, then will look into any <browser><colors><prelisten> node in your skin (see [<browser>](https://www.virtualdj.com/wiki/Skin%20Browser.html)) , and if not defined there either, will use the default colors.

  
**Example:**  
  
```
<prelisten>
	<pos x="0" y="50"/>
	<size width="280" height="30"/>
	<colors  background="#1F1F1F" border="#7A7A7A" selected="#136024" cursor="#18A639" button="#CBCBCB" buttonbackground="#5C5C5C" buttonselected="#18A639" />
</prelisten>
```
  
  

![](https://www.virtualdj.com/img/353231/38870/prelistenskin.png)

  
  

---

  

[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)