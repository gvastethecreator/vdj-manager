---
title: "VirtualDJ - VDJPedia - Skin optionsmenu"
source: "https://www.virtualdj.com/wiki/Skin%20optionsmenu.html"
author:
  - "[[VirtualDJ Website]]"
published:
created: 2025-02-17
description: "With over 100,000,000 downloads, VirtualDJ packs the most advanced DJ technology. Both perfect to start DJing, and perfect for advanced pro DJs."
tags:
  - "clippings"
---
[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)

  
**Skin SDK: The *<optionsmenu>* element**

---

---

  
  
Applies to video skins only.  
Defines video overlay options that are added to video\_output menu when right clicked on the master video preview.  
  
  
The syntax of the optionsmenu element is *<optionsmenu>* and has no attributes.  
  
**Children:**  
  
This element has no pos, size or graphics children.  
**Menu Items:**  
*<item text="" action="" check="" hascheck="" visibility="" />* : Use an item child for each item offered from the menu. The item child has the following parameters.

- *text="" :* Provide the displayed text of the menu item. Have *text="-"* to display a separator line in your menu, instead of an item
- *action="" :* Provide a [VDJ Script](https://www.virtualdj.com/wiki/VDJScript.html) action that will be executed when the menu item is clicked.
- *hascheck="" :* If set to *true* (default value) , the menu item will offer a check-mark depending of the true/false status of the action or the check parameters. If hascheck is set to *false*, then no check-mark will be offered for the menu item, regardless the status of the action and check parameters..
- *check="" :* A check-mark will be displayed at the left side of the menu item, if the action of the check parameter returns true. If no check parameter is provided, the check-mark will be displayed if the action parameter returns true.
- *visibility=""*: Provide a [VDJ Script](https://www.virtualdj.com/wiki/VDJScript.html) action that returns true|false to show/hide a menu item under certain conditions.

  
*<separator/>* : Adds a break line into the menu.  
**Sub-menus:**  
*<submenu text="" >* : A menu can have nested menus. Use the submenu child to nest other items  
  
```
<optionsmenu>
	<item text="Edit CUEs and POIs..." action="edit_poi" hascheck="false"/>
	<item text="Read-only (Lock)" action="lock_cues" hascheck="true"/>
	<item text="Smart Cue" action="smart_cue" hascheck="true"/>
	<item text="Quantize on Set" action="quantize_setcue" hascheck="true"/>
	<separator/>
	<submenu text="Display mode">
		<item text="Cue number" action="cue_display 'number'" hascheck="true"/>
		<item text="Name" action="cue_display 'name'" hascheck="true"/>
		<item text="Time Pos" action="cue_display 'position'" hascheck="true"/>
		<item text="Time left" action="cue_display 'distance'" hascheck="true"/>
		<item text="Beats left" action="cue_display 'beat'" hascheck="true"/>
	</submenu>
</optionsmenu>
```
  
  
![](https://www.virtualdj.com/img/416617/61347/Untitled.png)  
  

---

  

[Back to Skin SDK](https://www.virtualdj.com/wiki/Skin%20SDK%208.html)