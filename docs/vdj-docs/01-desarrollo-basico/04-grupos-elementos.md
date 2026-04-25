---
title: "VirtualDJ - VDJPedia - Skin Group"
source: "https://www.virtualdj.com/wiki/Skin%20Group.html"
author:
  - "[[VirtualDJ Website]]"
published:
created: 2025-02-17
description: "With over 100,000,000 downloads, VirtualDJ packs the most advanced DJ technology. Both perfect to start DJing, and perfect for advanced pro DJs."
tags:
  - "clippings"
---
[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)

  
**Skin SDK: The *<group>* container**

---

---

  
The group container allows you to group skin elements together. What is great about this is that you can add position attributes to everything in the whole group easily. This is great for defining the left and right decks for example.  
  
**Syntax :**  
<**group** *name="" x="" y="" visibility=""*\>  
  
**Attributes :** (All are optional)  

  
- ***name*** : Provide a name of the group (mostly an aid to quickly identify and look up for a group when reading the xml code)
- ***x*** : Define the x position/offset of the group. Read further details in [Skin Element Position](https://www.virtualdj.com/wiki/Skin%20Element%20Positioning.html)
- ***y*** : Define the y position/offset of the group. Read further details in [Skin Element Position](https://www.virtualdj.com/wiki/Skin%20Element%20Positioning.html)
- ***visibility*** : Provide a [VDJ Script](https://www.virtualdj.com/wiki/VDJScript.html) action which returns true/false. The skin elements nested inside the group will be visible only when the *visibility=""* returns true and hidden when false.

  
**Children:** Other elements can be contained within a group  
  
**Example:**  
```
<group name="leftdeck">
	<deck deck="left">
		<button action....>
			<pos x="100" y="100"/>
			....
		</button>
		<slider action....>
			<pos x="200" y="200"/>
			....
		</slider>
	</deck>
</group>
```
  
  
**Example 2:**  
```
<group name="leftdeck" x="+0" y="+0">
	<deck deck="left">
		<button action....>
			<pos x="+100" y="+100"/>
			....
		</button>
		<slider action....>
			<pos x="+200" y="+200"/>
			....
		</slider>
	</deck>
</group>
```
  
  
In this second example the group is for the left deck. Notice the "**+**" before the <pos> values. This makes them dynamic values and they will add the values specified in the <group> header. So in this case the group will be placed in exactly the same place as above.  
  
**Example 3:**  
```
<group name="rightdeck" x="+500" y="+0">
	<deck deck="right">
		<button action....>
			<pos x="+100" y="+100"/>
			....
		</button>
		<slider action....>
			<pos x="+200" y="+200"/>
			....
		</slider>
	</deck>
</group>
```
  
  
But notice in this third example for the right deck, the <group> is applying an additional 500 pixels on the X axis meaning the whole group will shift right on the screen. The only other part of the code inside the group that has been changed is the <deck> element. everything else is exactly the same. This makes writing the deck elements very quick, especially when you include the <define> elements also.  
  
*Note: There is no limit to the number of groups you can have. You can also put <group> inside of another <group>.*  
  
  

---

  

[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)