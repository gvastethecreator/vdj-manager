---
title: "VirtualDJ - VDJPedia - Skin Deck"
source: "https://www.virtualdj.com/wiki/Skin%20Deck.html"
author:
  - "[[VirtualDJ Website]]"
published:
created: 2025-02-17
description: "With over 100,000,000 downloads, VirtualDJ packs the most advanced DJ technology. Both perfect to start DJing, and perfect for advanced pro DJs."
tags:
  - "clippings"
---
[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)

  
**Skin SDK: The *<deck>* element**

---

---

  
The deck elements allows you to group elements together that refer to a specific deck, without having to add *deck="x"* in every nested skin element or *deck x* before their actions.  
  
**Syntax** :  
<**deck** deck="">  
  
**Attributes :**  

- ***deck*** : Define the deck. Use *deck="1|2|3|4|..etc"* or *deck="left|right"* or *deck="leftvideo|rightvideo"* or *deck="master"* or *deck="default"*

  
**Children:** Any other skin element can be contained within a <deck deck=""></deck> element  
  
**Example:**  
```
<deck deck="left">
	<button action="play_pause" ....>
		<pos x="100" y="100"/>
		....
	</button>
	<slider action="volume" ....>
		<pos x="200" y="200"/>
		....
	</slider>
</deck>

<deck deck="right">
	<button action="play_pause" ....>
		<pos x="100+800" y="100"/>
		....
	</button>
	<slider action="volume" ....>
		<pos x="200+800" y="200"/>
		....
	</slider>
</deck>
```
  
  
  

---

  

[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)