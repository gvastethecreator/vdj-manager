---
title: "VirtualDJ - VDJPedia - Skin Element Properties"
source: "https://www.virtualdj.com/wiki/Skin%20Element%20Properties.html"
author:
  - "[[VirtualDJ Website]]"
published:
created: 2025-02-18
description: "With over 100,000,000 downloads, VirtualDJ packs the most advanced DJ technology. Both perfect to start DJing, and perfect for advanced pro DJs."
tags:
  - "clippings"
---
[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)

  
**Skin SDK: Common Element Attributes**

---

---

  
Every skin <element> can **optionally** have the following attributes.  
  

  
- ***deck**\=""* : Define the deck. Use deck="1|2|3|4|..etc" or deck="left|right" or deck="leftvideo|rightvideo" or deck="master" or deck="default". This is useful to avoid typing deck x in front of every VDJ Script action or text element attributes . It is still preferred to nest elements inside a <deck> container for cleaner code. See [deck](https://www.virtualdj.com/wiki/Skin%20Deck.html) container.
- ***visibility**\=""* : Define the % transparency of the displayed graphics and texts. [VDJ Script](https://www.virtualdj.com/wiki/VDJScript.html) actions that return true or false to specify when the button will be visible or not. Tip: if you have lots of buttons with the same visibility, it is suggested and less cpu consuming to nest all buttons inside a <panel> or a <group> container with the same visibility (see [Panel](https://www.virtualdj.com/wiki/Skin%20SDK%20Panel.html) and [Group](https://www.virtualdj.com/wiki/Skin%20Group.html))
- ***os**\=""* : use *os="mac"* or *os="pc"* if you need to display a skin element only when VirtualDJ is running on Window or Mac (e.g. if you need to display the close/min/maximize buttons in different places depending on the Operating system). Do not include *os=""* if you want the buttons to be displayed on both platforms.
- ***panel**\=""* : Provide the name of the panel that the button is part of. The skin element will be displayed only when the panel is visible. Should be avoided. It is suggested to nest elements inside a <panel> container (see [Panel](https://www.virtualdj.com/wiki/Skin%20SDK%20Panel.html))

  
  
  
  
  
  

---

  

[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)